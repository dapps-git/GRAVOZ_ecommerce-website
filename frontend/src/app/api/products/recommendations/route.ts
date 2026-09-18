import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';

interface ContextProduct {
  id?: string;
  name?: string;
  subCategory?: string;
  selectedColor?: string;
  colors?: string[];
  targetAudience?: string;
  price?: number;
  shoeType?: string;
}

interface TasteSignals {
  colors: string[];
  categories: string[];
  audiences: string[];
  keywords: string[];
  priceRange: { min: number; max: number } | null;
  contextProduct?: ContextProduct;
}

function scoreProduct(product: any, signals: TasteSignals): number {
  let score = 0;

  // Extract all product colors (from colors array and colorVariants)
  const productColors: string[] = [
    ...(Array.isArray(product.colors) ? product.colors : []),
    ...(Array.isArray(product.colorVariants) ? product.colorVariants.map((cv: any) => cv.name) : []),
  ]
    .filter(Boolean)
    .map((c: string) => c.toLowerCase().trim());

  const pSubCat = (product.subCategory || '').toLowerCase().trim();
  const pAudience = (product.targetAudience || '').toLowerCase().trim();
  const pName = (product.name || '').toLowerCase().trim();

  const ctx = signals.contextProduct;

  // ── 1. Immediate Reference Product Taste Sensing ──
  if (ctx) {
    // A. Reference Color Match (Highest Priority: +25 pts)
    if (ctx.selectedColor) {
      const sel = ctx.selectedColor.toLowerCase().trim();
      if (productColors.some((c) => c.includes(sel) || sel.includes(c))) {
        score += 25;
      }
    }
    // Matching any other color in reference product (+10 pts)
    if (Array.isArray(ctx.colors)) {
      for (const c of ctx.colors) {
        if (!c) continue;
        const cLow = c.toLowerCase().trim();
        if (productColors.some((pc) => pc.includes(cLow) || cLow.includes(pc))) {
          score += 10;
          break;
        }
      }
    }

    // B. Reference Model / SubCategory Match (+20 pts)
    if (ctx.subCategory && pSubCat) {
      const ctxCat = ctx.subCategory.toLowerCase().trim();
      if (pSubCat === ctxCat || pSubCat.includes(ctxCat) || ctxCat.includes(pSubCat)) {
        score += 20;
      }
    }

    // C. Reference Model Keyword Match (e.g., boots, loafers, oxford, casual, formal) (+12 pts)
    const modelKeywords = [
      'boot', 'boots', 'loafer', 'loafers', 'oxford', 'oxfords', 
      'sandal', 'sandals', 'sneaker', 'sneakers', 'formal', 'casual', 
      'derby', 'leather', 'slip on'
    ];
    if (ctx.name) {
      const refName = ctx.name.toLowerCase();
      for (const kw of modelKeywords) {
        if (refName.includes(kw) && pName.includes(kw)) {
          score += 12;
          break;
        }
      }
    }

    // D. Reference Target Audience Match (+15 pts)
    if (ctx.targetAudience && pAudience) {
      if (ctx.targetAudience.toLowerCase().trim() === pAudience) {
        score += 15;
      }
    }

    // E. Price Proximity (+6 pts if within 30%)
    if (ctx.price && product.price) {
      const diff = Math.abs(product.price - ctx.price) / ctx.price;
      if (diff <= 0.3) score += 6;
      else if (diff <= 0.6) score += 3;
    }
  }

  // ── 2. Historical Learned Taste Signals ──
  // User's preferred colors (+12 pts for top choice down to +4 pts)
  if (signals.colors?.length > 0) {
    signals.colors.forEach((prefColor, idx) => {
      const pref = prefColor.toLowerCase().trim();
      if (productColors.some((c) => c.includes(pref) || pref.includes(c))) {
        score += Math.max(4, 12 - idx * 2);
      }
    });
  }

  // User's preferred categories & models (+10 pts for top choice down to +4 pts)
  if (signals.categories?.length > 0) {
    signals.categories.forEach((prefCat, idx) => {
      const cat = prefCat.toLowerCase().trim();
      if (pSubCat.includes(cat) || pName.includes(cat)) {
        score += Math.max(4, 10 - idx * 2);
      }
    });
  }

  // User's preferred target audience (+8 pts)
  if (signals.audiences?.length > 0) {
    for (const aud of signals.audiences) {
      if (pAudience === aud.toLowerCase().trim()) {
        score += 8;
        break;
      }
    }
  }

  // Search keywords (+3 pts each)
  if (signals.keywords?.length > 0) {
    for (const kw of signals.keywords) {
      const term = kw.toLowerCase().trim();
      if (term && (pName.includes(term) || pSubCat.includes(term))) {
        score += 3;
      }
    }
  }

  // Price Range (+5 pts)
  if (signals.priceRange && product.price) {
    if (product.price >= signals.priceRange.min && product.price <= signals.priceRange.max) {
      score += 5;
    }
  }

  // Rating tie-breaker (+1 pt for 5-star)
  if (product.rating) {
    score += product.rating * 0.2;
  }

  return score;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      colors = [],
      categories = [],
      audiences = [],
      keywords = [],
      recentProductIds = [],
      priceRange = null,
      excludeIds = [],
      contextProduct = null,
      limit = 8,
    } = body;

    await connectDB();

    // Prepare signals
    const signals: TasteSignals = {
      colors,
      categories,
      audiences,
      keywords,
      priceRange,
      contextProduct,
    };

    // Combine exclude IDs (ensure validity)
    const allExcludedStrings = [...new Set([...(excludeIds || [])])]
      .filter((id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));
    const allExcluded = allExcludedStrings.map((id) => new mongoose.Types.ObjectId(id));

    // Build search queries: combine context product taste with learned signals
    const searchColors = [
      ...(contextProduct?.selectedColor ? [contextProduct.selectedColor] : []),
      ...(Array.isArray(contextProduct?.colors) ? contextProduct.colors : []),
      ...colors,
    ].filter(Boolean).map((c: string) => c.trim());

    const searchCategories = [
      ...(contextProduct?.subCategory ? [contextProduct.subCategory] : []),
      ...categories,
    ].filter(Boolean).map((c: string) => c.trim());

    const searchAudiences = [
      ...(contextProduct?.targetAudience ? [contextProduct.targetAudience] : []),
      ...audiences,
    ].filter(Boolean).map((a: string) => a.trim());

    const conditions: object[] = [];

    // 1. Color conditions (checks both colors array and colorVariants.name)
    if (searchColors.length > 0) {
      const colorRegexes = searchColors.map((c: string) => new RegExp(c, 'i'));
      conditions.push({
        $or: [
          { colors: { $in: colorRegexes } },
          { 'colorVariants.name': { $in: colorRegexes } },
        ],
      });
    }

    // 2. Category / SubCategory condition
    if (searchCategories.length > 0) {
      const catRegexes = searchCategories.map((c: string) => new RegExp(c, 'i'));
      conditions.push({ subCategory: { $in: catRegexes } });
    }

    // 3. Target Audience condition
    if (searchAudiences.length > 0) {
      const audRegexes = searchAudiences.map((a: string) => new RegExp(a, 'i'));
      conditions.push({ targetAudience: { $in: audRegexes } });
    }

    // 4. Keyword / Model name conditions
    const allKeywords = [
      ...(contextProduct?.name ? contextProduct.name.split(/\s+/).filter((w: string) => w.length > 3) : []),
      ...keywords,
    ];
    if (allKeywords.length > 0) {
      conditions.push({
        $or: allKeywords.slice(0, 8).map((kw: string) => ({ name: { $regex: kw, $options: 'i' } })),
      });
    }

    const baseQuery: Record<string, any> = { status: 'active' };
    if (allExcluded.length > 0) {
      baseQuery._id = { $nin: allExcluded };
    }

    let candidateProducts: any[] = [];

    // Query DB with taste matching conditions
    if (conditions.length > 0) {
      candidateProducts = await Product.find({
        ...baseQuery,
        $or: conditions,
      })
        .limit(limit * 3)
        .lean();
    }

    // If matches are fewer than required limit, fetch additional active products to guarantee recommendations
    if (!candidateProducts || candidateProducts.length < limit) {
      const existingCandidateIds = (candidateProducts || []).map((p: any) => p._id.toString());
      const fallbackExcluded = [...new Set([...allExcludedStrings, ...existingCandidateIds])]
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const fallbackProducts = await Product.find({
        status: 'active',
        _id: { $nin: fallbackExcluded },
      })
        .limit(limit * 2)
        .lean();

      candidateProducts = [...(candidateProducts || []), ...fallbackProducts];
    }

    if (!candidateProducts || candidateProducts.length === 0) {
      return NextResponse.json({ success: true, products: [] });
    }

    // Score and rank all candidate products based on full taste profile
    const scored = candidateProducts
      .map((p) => ({
        product: p,
        score: scoreProduct(p, signals),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ product }) => product);

    return NextResponse.json({
      success: true,
      products: scored,
      tasteSensed: {
        referenceColor: contextProduct?.selectedColor || null,
        referenceCategory: contextProduct?.subCategory || null,
        referenceAudience: contextProduct?.targetAudience || null,
        learnedColors: colors.slice(0, 3),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message, products: [] }, { status: 500 });
  }
}
