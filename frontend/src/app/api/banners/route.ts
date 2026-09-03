import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Banner } from '@/models/Banner';

export async function GET(_req: NextRequest) {
  try {
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    };

    await connectDB();
    const dbBanners = await Banner.find({ isActive: true }).lean();

    const bannerMap: Record<string, any> = {};

    if (dbBanners && dbBanners.length > 0) {
      for (const b of dbBanners) {
        bannerMap[b.slot] = {
          slot: b.slot,
          name: b.name,
          title: b.title || '',
          subtitle: b.subtitle || '',
          description: b.description || '',
          imageUrl: b.imageUrl || '',
          thumbnailUrl: b.thumbnailUrl || '',
          lifestyleUrl: b.lifestyleUrl || '',
          price: b.price || 0,
          originalPrice: b.originalPrice || 0,
          productId: b.productId || '',
          linkUrl: b.linkUrl || '/products',
          sizes: Array.isArray(b.sizes) && b.sizes.length > 0 ? b.sizes : ['5', '6', '7', '8', '9', '10'],
          colors: Array.isArray(b.colors) ? b.colors : [],
          aspectRatio: b.aspectRatio || '16/9',
          isActive: b.isActive ?? true,
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        banners: bannerMap,
      },
      { headers: cacheHeaders }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch banners', banners: {} }, { status: 500 });
  }
}
