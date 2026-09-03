import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Banner } from '@/models/Banner';

const DEFAULT_BANNER_LIST = [
  {
    slot: 'hero',
    name: 'Top Hero Banner (Banner 1)',
    category: 'home_banner',
    imageUrl: '/images/banner.webp',
    title: 'Step Better. Feel the Comfort.',
    subtitle: 'Quality Sandals for Every Family Moment',
    linkUrl: '/products',
    aspectRatio: '1816/866',
    isActive: true,
    displayOrder: 1,
  },
  {
    slot: 'secondary',
    name: 'Secondary Promo Banner (Banner 2)',
    category: 'home_banner',
    imageUrl: '/images/banner1.webp',
    title: 'GRAVOZ Luxury Leather Shoes',
    subtitle: 'Crafted with premium Italian grade finish',
    linkUrl: '/category/men',
    aspectRatio: '2001/786',
    isActive: true,
    displayOrder: 2,
  },
  {
    slot: 'comfort_sandal',
    name: 'Comfort Sandal Banner (Banner 3)',
    category: 'home_banner',
    imageUrl: '/images/banner3.webp',
    title: 'GRAVOZ Ultra Comfort Everyday Sandal',
    subtitle: 'Ergonomic footbed with shock absorption',
    linkUrl: '/category/women',
    aspectRatio: '3076/1208',
    isActive: true,
    displayOrder: 3,
  },
  {
    slot: 'promo_strip',
    name: 'Promotion Showcase Banner (Banner 4)',
    category: 'home_banner',
    imageUrl: '/images/banner4.webp',
    title: 'GRAVOZ Seasonal Showcase',
    subtitle: 'New Season New Styles',
    linkUrl: '/products',
    aspectRatio: '3200/1034',
    isActive: true,
    displayOrder: 4,
  },
  {
    slot: 'daily_collection',
    name: 'Handpicked Collection Banner (Banner 5)',
    category: 'home_banner',
    imageUrl: '/images/banner5.webp',
    title: 'GRAVOZ Daily Collection',
    subtitle: 'Everyday elegance crafted for you',
    linkUrl: '/products',
    aspectRatio: '3172/1230',
    isActive: true,
    displayOrder: 5,
  },
  {
    slot: 'category_women',
    name: "Women's Footwear Category Card",
    category: 'category_banner',
    imageUrl: '/images/women.webp',
    title: 'Women',
    subtitle: 'Footwear Collection',
    linkUrl: '/category/women',
    aspectRatio: '3/4',
    isActive: true,
    displayOrder: 6,
  },
  {
    slot: 'category_men',
    name: "Men's Footwear Category Card",
    category: 'category_banner',
    imageUrl: '/images/men.webp',
    title: 'Men',
    subtitle: 'Footwear Collection',
    linkUrl: '/category/men',
    aspectRatio: '3/4',
    isActive: true,
    displayOrder: 7,
  },
  {
    slot: 'category_kids',
    name: "Kids' Footwear Category Card",
    category: 'category_banner',
    imageUrl: '/images/kid.webp',
    title: 'Kids',
    subtitle: 'Footwear Collection',
    linkUrl: '/category/kids',
    aspectRatio: '3/4',
    isActive: true,
    displayOrder: 8,
  },
  {
    slot: 'duo_product_1',
    name: 'Duo Spotlight Product 1 (Below Best Sellers)',
    category: 'duo_showcase',
    imageUrl: '',
    thumbnailUrl: '',
    lifestyleUrl: '',
    title: "Men's Casual Comfort Sandals",
    subtitle: '',
    price: 1399,
    originalPrice: 1429,
    productId: '',
    linkUrl: '/products',
    aspectRatio: '4/3',
    isActive: true,
    displayOrder: 9,
  },
  {
    slot: 'duo_product_2',
    name: 'Duo Spotlight Product 2 (Below Best Sellers)',
    category: 'duo_showcase',
    imageUrl: '',
    thumbnailUrl: '',
    lifestyleUrl: '',
    title: "Women's Casual Comfort Sandals",
    subtitle: '',
    price: 1399,
    originalPrice: 1429,
    productId: '',
    linkUrl: '/products',
    aspectRatio: '4/3',
    isActive: true,
    displayOrder: 10,
  },
];

// GET /api/banners
export async function GET() {
  try {
    await connectDB();
    let banners = await Banner.find().sort({ displayOrder: 1 }).lean();

    // Auto-seed defaults if collection is empty or missing duo showcase slots
    if (!banners || banners.length === 0) {
      await Banner.insertMany(DEFAULT_BANNER_LIST);
      banners = await Banner.find().sort({ displayOrder: 1 }).lean();
    } else {
      // Ensure duo slots exist
      const hasDuo1 = banners.some((b) => b.slot === 'duo_product_1');
      const hasDuo2 = banners.some((b) => b.slot === 'duo_product_2');
      if (!hasDuo1 || !hasDuo2) {
        if (!hasDuo1) await Banner.create(DEFAULT_BANNER_LIST.find((b) => b.slot === 'duo_product_1'));
        if (!hasDuo2) await Banner.create(DEFAULT_BANNER_LIST.find((b) => b.slot === 'duo_product_2'));
        banners = await Banner.find().sort({ displayOrder: 1 }).lean();
      }
    }

    return NextResponse.json({ success: true, banners });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch banners' }, { status: 500 });
  }
}

// PUT /api/banners (Update single or batch banners)
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // If single banner update
    if (body.slot) {
      const {
        slot, imageUrl, thumbnailUrl, lifestyleUrl,
        title, subtitle, description,
        price, originalPrice, productId, linkUrl,
        sizes, colors, isActive,
      } = body;
      const updated = await Banner.findOneAndUpdate(
        { slot },
        {
          $set: {
            ...(imageUrl !== undefined && { imageUrl }),
            ...(thumbnailUrl !== undefined && { thumbnailUrl }),
            ...(lifestyleUrl !== undefined && { lifestyleUrl }),
            ...(title !== undefined && { title }),
            ...(subtitle !== undefined && { subtitle }),
            ...(description !== undefined && { description }),
            ...(price !== undefined && { price: Number(price) }),
            ...(originalPrice !== undefined && { originalPrice: Number(originalPrice) }),
            ...(productId !== undefined && { productId }),
            ...(linkUrl !== undefined && { linkUrl }),
            ...(Array.isArray(sizes) && { sizes }),
            ...(Array.isArray(colors) && { colors }),
            ...(isActive !== undefined && { isActive }),
          },
        },
        { new: true, upsert: true }
      );
      return NextResponse.json({ success: true, banner: updated });
    }

    // If array of banners
    if (Array.isArray(body.banners)) {
      for (const item of body.banners) {
        if (item.slot) {
          await Banner.findOneAndUpdate(
            { slot: item.slot },
            { $set: item },
            { upsert: true }
          );
        }
      }
      const allUpdated = await Banner.find().sort({ displayOrder: 1 }).lean();
      return NextResponse.json({ success: true, banners: allUpdated });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to update banner' }, { status: 500 });
  }
}
