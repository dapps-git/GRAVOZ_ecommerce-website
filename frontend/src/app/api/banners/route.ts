import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Banner } from '@/models/Banner';

const DEFAULT_BANNER_MAP: Record<string, any> = {
  hero: {
    title: 'Step Better. Feel the Comfort.',
    subtitle: 'Quality Sandals for Every Family Moment',
    imageUrl: '/images/banner.webp',
    linkUrl: '/products',
    aspectRatio: '1816/866',
    isActive: true,
  },
  secondary: {
    title: 'GRAVOZ Luxury Leather Shoes',
    subtitle: 'Crafted with premium Italian grade finish',
    imageUrl: '/images/banner1.webp',
    linkUrl: '/category/men',
    aspectRatio: '2001/786',
    isActive: true,
  },
  comfort_sandal: {
    title: 'GRAVOZ Ultra Comfort Everyday Sandal',
    subtitle: 'Ergonomic footbed with shock absorption',
    imageUrl: '/images/banner3.webp',
    linkUrl: '/category/women',
    aspectRatio: '3076/1208',
    isActive: true,
  },
  promo_strip: {
    title: 'GRAVOZ Seasonal Showcase',
    subtitle: 'New Season New Styles',
    imageUrl: '/images/banner4.webp',
    linkUrl: '/products',
    aspectRatio: '3200/1034',
    isActive: true,
  },
  daily_collection: {
    title: 'GRAVOZ Daily Collection',
    subtitle: 'Everyday elegance crafted for you',
    imageUrl: '/images/banner5.webp',
    linkUrl: '/products',
    aspectRatio: '3172/1230',
    isActive: true,
  },
  category_women: {
    title: 'Women',
    subtitle: 'Collection',
    imageUrl: '/images/women.webp',
    linkUrl: '/category/women',
    isActive: true,
  },
  category_men: {
    title: 'Men',
    subtitle: 'Collection',
    imageUrl: '/images/men.webp',
    linkUrl: '/category/men',
    isActive: true,
  },
  category_kids: {
    title: 'Kids',
    subtitle: 'Collection',
    imageUrl: '/images/kid.webp',
    linkUrl: '/category/kids',
    isActive: true,
  },
};

export async function GET(req: NextRequest) {
  try {
    try {
      await connectDB();
      const banners = await Banner.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
      if (banners && banners.length > 0) {
        const bannerMap: Record<string, any> = { ...DEFAULT_BANNER_MAP };
        banners.forEach((b) => {
          if (b.slot) {
            bannerMap[b.slot] = b;
          }
        });

        return NextResponse.json({
          success: true,
          banners: bannerMap,
          list: banners,
        });
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      banners: DEFAULT_BANNER_MAP,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to load banners' }, { status: 500 });
  }
}
