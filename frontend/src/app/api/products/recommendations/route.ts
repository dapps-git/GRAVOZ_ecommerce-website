import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';

// Static product catalog for fallback (same as search route but extended)
const STATIC_CATALOG = [
  {
    _id: 'p1',
    name: "Men's Casual Comfort Sandals – Black",
    brand: 'Gravoz',
    price: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product1.webp', alt: "Black Sandals" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Black', 'Dark Gray'],
    keywords: ['black', 'sandals', 'casual', 'comfort', 'men'],
  },
  {
    _id: 'p2',
    name: "Men's Casual Comfort Sandals – Tan",
    brand: 'Gravoz',
    price: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product2.webp', alt: "Tan Sandals" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Tan', 'Brown', 'Beige'],
    keywords: ['tan', 'brown', 'sandals', 'casual', 'men'],
  },
  {
    _id: 'p3',
    name: "Men's Casual Comfort Sandals – Brown",
    brand: 'Gravoz',
    price: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product3.webp', alt: "Brown Sandals" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Brown', 'Chocolate'],
    keywords: ['brown', 'sandals', 'casual', 'men', 'comfort sandals'],
  },
  {
    _id: 'p4',
    name: "Men's Casual Comfort Sandals – Olive",
    brand: 'Gravoz',
    price: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product4.webp', alt: "Olive Sandals" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Olive', 'Green', 'Khaki'],
    keywords: ['olive', 'green', 'sandals', 'casual', 'men'],
  },
  {
    _id: 'p5',
    name: "Men's Casual Sneaker – Classic White",
    brand: 'Gravoz',
    price: 1599,
    originalPrice: 1799,
    rating: 5.0,
    images: [{ url: '/products/product5.webp', alt: "White Sneakers" }],
    targetAudience: 'Men',
    subCategory: 'Casual Shoe',
    colors: ['White', 'Off-White'],
    keywords: ['white', 'sneakers', 'shoes', 'casual', 'men'],
  },
  {
    _id: 'p6',
    name: "Women's Comfort Casual Strap Sandal",
    brand: 'Gravoz',
    price: 1299,
    originalPrice: 1499,
    rating: 5.0,
    images: [{ url: '/products/product6.webp', alt: "Women's Sandal" }],
    targetAudience: 'Women',
    subCategory: 'Casual Sandal',
    colors: ['Tan', 'Beige', 'Gold'],
    keywords: ['women', 'sandals', 'strap', 'casual', 'ladies'],
  },
  {
    _id: 'p7',
    name: "Men's Formal Oxford Leather Shoe – Black",
    brand: 'Gravoz',
    price: 1999,
    originalPrice: 2299,
    rating: 5.0,
    images: [{ url: '/products/product7.webp', alt: "Black Oxford" }],
    targetAudience: 'Men',
    subCategory: 'Leather Shoe',
    colors: ['Black'],
    keywords: ['black', 'leather', 'oxford', 'formal', 'shoes', 'men'],
  },
  {
    _id: 'p8',
    name: "Women's Elegant Leather Buckle Sandal",
    brand: 'Gravoz',
    price: 1499,
    originalPrice: 1699,
    rating: 5.0,
    images: [{ url: '/products/product.8.png', alt: "Leather Buckle Sandal" }],
    targetAudience: 'Women',
    subCategory: 'Leather Sandal',
    colors: ['Black', 'Brown'],
    keywords: ['women', 'black', 'brown', 'leather', 'buckle', 'sandal'],
  },
  {
    _id: 'p9',
    name: "GRAVOZ Flagship Casual Comfort Runner – Black",
    brand: 'Gravoz',
    price: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product9.webp', alt: "Black Comfort Runner" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Black'],
    keywords: ['black', 'sandals', 'runner', 'flagship', 'comfort', 'men'],
  },
  {
    _id: 'p10',
    name: "Men's Classic Slip-on Casual Sandal – Black",
    brand: 'Gravoz',
    price: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product10.webp', alt: "Black Slip-on Sandal" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Black'],
    keywords: ['black', 'sandals', 'slip on', 'men'],
  },
  {
    _id: 'p11',
    name: "GRAVOZ Premium Leather Formal – Brown",
    brand: 'Gravoz',
    price: 1899,
    originalPrice: 2199,
    rating: 5.0,
    images: [{ url: '/products/product11.webp', alt: "Brown Formal Shoe" }],
    targetAudience: 'Men',
    subCategory: 'Leather Shoe',
    colors: ['Brown', 'Tan'],
    keywords: ['brown', 'leather', 'formal', 'men', 'premium'],
  },
  {
    _id: 'p12',
    name: "GRAVOZ Casual Daily Comfort Sandal",
    brand: 'Gravoz',
    price: 1199,
    originalPrice: 1399,
    rating: 5.0,
    images: [{ url: '/products/product12.webp', alt: "Daily Comfort Sandal" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Black', 'Grey'],
    keywords: ['black', 'grey', 'sandals', 'daily', 'casual', 'men'],
  },
];

interface ScorableProduct {
  name?: string;
  subCategory?: string;
  targetAudience?: string;
  colors?: string[];
  keywords?: string[];
  price?: number;
  [key: string]: any;
}

/**
 * Score a product against user signals (higher = more relevant)
 */
function scoreProduct(
  product: ScorableProduct,
  signals: {
    colors: string[];
    categories: string[];
    audiences: string[];
    keywords: string[];
    recentProductIds: string[];
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
  ].join(' ').toLowerCase();

  // Color match (highest weight — 8 pts per match)
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

  // Small freshness boost for any match at all
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

    // Try MongoDB first
    try {
      await connectDB();

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

      if (conditions.length > 0) {
        const dbProducts = await Product.find({
          status: 'active',
          _id: { $nin: excludeIds },
          $or: conditions,
        })
          .limit(limit * 2)
          .lean();

        if (dbProducts && dbProducts.length > 0) {
          // Score & sort
          const scored = dbProducts
            .map((p) => ({ product: p, score: scoreProduct(p as unknown as ScorableProduct, signals) }))
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(({ product }) => product);

          return NextResponse.json({ success: true, products: scored });
        }
      }
    } catch {
      // Fall through to static catalog
    }

    // Fallback: Score static catalog
    const excludeSet = new Set([...recentProductIds, ...excludeIds]);
    const hasSignals = colors.length > 0 || categories.length > 0 || keywords.length > 0;

    let candidates = STATIC_CATALOG.filter((p) => !excludeSet.has(p._id));

    if (!hasSignals) {
      // No signals yet → return bestsellers (random selection)
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      return NextResponse.json({ success: true, products: shuffled.slice(0, limit), reason: 'popular' });
    }

    const scored = candidates
      .map((p) => ({ product: p, score: scoreProduct(p, signals) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // If top results all have score 0, return popular fallback
    if (scored.every(({ score }) => score === 0)) {
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      return NextResponse.json({ success: true, products: shuffled.slice(0, limit), reason: 'popular' });
    }

    return NextResponse.json({
      success: true,
      products: scored.filter(({ score }) => score > 0).map(({ product }) => product),
      reason: 'personalized',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
