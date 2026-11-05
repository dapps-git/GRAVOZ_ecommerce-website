import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';

let cachedCategoriesResponse: any = null;
let lastCategoriesCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export async function GET(_req: NextRequest) {
  try {
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    };

    const now = Date.now();
    if (cachedCategoriesResponse && now - lastCategoriesCacheTime < CACHE_TTL_MS) {
      return NextResponse.json(cachedCategoriesResponse, { headers: cacheHeaders });
    }

    await connectDB();
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).lean();
    const result = {
      success: true,
      categories: (categories || []).map((c: any) => ({
        _id: String(c._id),
        key: c.slug || c.name,
        name: c.name,
        title: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
        targetAudience: c.targetAudience,
        href: `/products?category=${encodeURIComponent(c.name)}`,
        imageUrl: c.image || '/products/placeholder.svg',
      })),
    };

    cachedCategoriesResponse = result;
    lastCategoriesCacheTime = Date.now();

    return NextResponse.json(result, { headers: cacheHeaders });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: true, categories: [] });
  }
}
