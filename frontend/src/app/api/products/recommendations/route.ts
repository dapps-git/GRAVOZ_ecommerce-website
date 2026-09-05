import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';

interface ScorableProduct {
  _id: string;
  name: string;
  subCategory?: string;
  targetAudience?: string;
  colors?: string[];
  price?: number;
  keywords?: string[];
}

function scoreProduct(
  product: ScorableProduct,
  signals: {
    colors: string[];
    categories: string[];
    audiences: string[];
    keywords: string[];
    priceRange: { min: number; max: number } | null;
  }
): number {
  let score = 0;
  const productBlob = [
    product.name || '',
    product.subCategory || '',
    product.targetAudience || '',
    ...(product.colors || []),
    ...(product.keywords || []),
  ]
    .join(' ')
    .toLowerCase();

  // Color match (8 pts)
  for (const color of signals.colors) {
    if (productBlob.includes(color.toLowerCase())) {
      score += 8;
    }
  }

  // Category match (6 pts)
  for (const cat of signals.categories) {
    if (productBlob.includes(cat.toLowerCase())) {
      score += 6;
    }
  }

  // Audience match (4 pts)
  for (const aud of signals.audiences) {
    if (product.targetAudience?.toLowerCase() === aud.toLowerCase()) {
      score += 4;
    }
  }

  // Keyword match from search history (2 pts each)
  for (const kw of signals.keywords) {
    if (productBlob.includes(kw.toLowerCase())) {
      score += 2;
    }
  }

  // Price range match (3 pts)
  if (signals.priceRange && product.price) {
    if (product.price >= signals.priceRange.min && product.price <= signals.priceRange.max) {
      score += 3;
    }
  }

  if (score > 0) score += 1;
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
      limit = 8,
    } = body;

    const signals = { colors, categories, audiences, keywords, recentProductIds, priceRange };

    await connectDB();

    const allExcluded = [...new Set([...recentProductIds, ...excludeIds])]
      .filter((id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const conditions: object[] = [];
    if (colors.length > 0) {
      conditions.push({ colors: { $in: colors.map((c: string) => new RegExp(c, 'i')) } });
    }
    if (categories.length > 0) {
      conditions.push({ subCategory: { $in: categories.map((c: string) => new RegExp(c, 'i')) } });
    }
    if (audiences.length > 0) {
      conditions.push({ targetAudience: { $in: audiences.map((a: string) => new RegExp(a, 'i')) } });
    }
    if (keywords.length > 0) {
      conditions.push({
        $or: keywords.map((kw: string) => ({ name: { $regex: kw, $options: 'i' } })),
      });
    }

    let dbProducts: any[] = [];
    const baseQuery: Record<string, any> = { status: 'active' };
    if (allExcluded.length > 0) {
      baseQuery._id = { $nin: allExcluded };
    }

    if (conditions.length > 0) {
      dbProducts = await Product.find({
        ...baseQuery,
        $or: conditions,
      })
        .limit(limit * 2)
        .lean();
    }

    if (!dbProducts || dbProducts.length === 0) {
      dbProducts = await Product.find({
        status: 'active',
        _id: { $nin: allExcluded },
      })
        .limit(limit)
        .lean();
    }

    if (!dbProducts || dbProducts.length === 0) {
      return NextResponse.json({ success: true, products: [] });
    }

    const scored = dbProducts
      .map((p) => ({ product: p, score: scoreProduct(p as unknown as ScorableProduct, signals) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ product }) => product);

    return NextResponse.json({ success: true, products: scored });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message, products: [] }, { status: 500 });
  }
}
