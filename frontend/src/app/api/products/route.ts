import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { Brand } from '@/models/Brand';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const targetAudience = searchParams.get('targetAudience');
    const isBestSeller = searchParams.get('isBestSeller');
    const isTopSeller = searchParams.get('isTopSeller');
    const isFeatured = searchParams.get('isFeatured');
    const isLatest = searchParams.get('isLatest');
    const subCategory = searchParams.get('subCategory');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    };

    await connectDB();
    const query: Record<string, any> = { status: 'active' };

    if (targetAudience) query.targetAudience = targetAudience;
    if (isBestSeller === 'true') query.isBestSeller = true;
    if (isTopSeller === 'true') query.isTopSeller = true;
    if (isFeatured === 'true') query.isFeatured = true;
    if (isLatest === 'true') query.isLatest = true;
    if (subCategory) query.subCategory = new RegExp(subCategory, 'i');
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { subCategory: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const skip = (page - 1) * limit;
    const [dbProducts, total] = await Promise.all([
      Product.find(query)
        .populate({ path: 'category', select: 'name slug targetAudience', strictPopulate: false })
        .populate({ path: 'brand', select: 'name slug logoUrl', strictPopulate: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const formattedProducts = (dbProducts || []).map((p: any) => ({
      ...p,
      brand: typeof p.brand === 'object' && p.brand !== null ? (p.brand.name || 'GRAVOZ') : (p.brand || 'GRAVOZ'),
      brandDetails: typeof p.brand === 'object' ? p.brand : null,
    }));

    return NextResponse.json(
      {
        success: true,
        products: formattedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      { headers: cacheHeaders }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch products', products: [] }, { status: 500 });
  }
}
