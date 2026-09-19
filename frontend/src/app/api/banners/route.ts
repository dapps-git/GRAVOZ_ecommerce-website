import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Banner } from '@/models/Banner';
import { Product } from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const cacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    };

    await connectDB();

    // Clean up legacy duo showcase banner records from database
    await Banner.deleteMany({
      $or: [
        { slot: { $in: ['duo_product_1', 'duo_product_2'] } },
        { category: 'duo_showcase' },
      ],
    });

    const dbBanners = await Banner.find({
      isActive: true,
      slot: { $nin: ['duo_product_1', 'duo_product_2'] },
      category: { $ne: 'duo_showcase' },
    }).lean();

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

    // Direct resolution from Product collection for products with spotlightSlot
    const spotlightProducts = await Product.find({
      $or: [
        { spotlightSlot: { $in: ['duo_product_1', 'duo_product_2'] } },
        { featureInDuoSlot: { $in: ['duo_product_1', 'duo_product_2'] } },
      ],
      status: { $ne: 'archived' },
    }).lean();

    for (const p of spotlightProducts) {
      const slot = (p.spotlightSlot === 'duo_product_1' || p.spotlightSlot === 'duo_product_2')
        ? p.spotlightSlot
        : (p.featureInDuoSlot || 'duo_product_1');

      const sm = p.spotlightMockups || {};
      const rawImgs = Array.isArray(p.images) ? p.images : [];
      const img1 = sm.mainUrl || (typeof rawImgs[0] === 'string' ? rawImgs[0] : rawImgs[0]?.url) || '';
      const img2 = sm.thumbnailUrl || (typeof rawImgs[1] === 'string' ? rawImgs[1] : rawImgs[1]?.url) || img1;
      const img3 = sm.lifestyleUrl || (typeof rawImgs[2] === 'string' ? rawImgs[2] : rawImgs[2]?.url) || img1;

      bannerMap[slot] = {
        slot,
        name: p.name,
        title: p.name,
        subtitle: '',
        description: p.description || '',
        imageUrl: img1,
        thumbnailUrl: img2,
        lifestyleUrl: img3,
        price: p.discountPrice || p.price || 0,
        originalPrice: p.price || 0,
        productId: p._id.toString(),
        linkUrl: `/products/${p.slug || p._id}`,
        sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['5', '6', '7', '8', '9', '10'],
        colors: Array.isArray(p.colors) ? p.colors : [],
        isActive: true,
      };
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
