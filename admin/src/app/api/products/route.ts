import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { invalidateCache } from '@/lib/redis';

// GET /api/products (Rule 8, 9, 10, 12)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 50);
    const targetAudience = searchParams.get('targetAudience'); // 'Men' | 'Women' | 'Babies'
    const categorySlug = searchParams.get('category');
    const isBestSeller = searchParams.get('isBestSeller');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';

    const query: Record<string, unknown> = {};

    if (targetAudience) {
      query.targetAudience = targetAudience;
    }

    if (categorySlug) {
      const catObj = await Category.findOne({ slug: categorySlug }).select('_id');
      if (catObj) {
        query.category = catObj._id;
      }
    }

    if (isBestSeller === 'true') {
      query.isBestSeller = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subCategory: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price-low') sortOptions = { price: 1 };
    if (sort === 'price-high') sortOptions = { price: -1 };
    if (sort === 'stock-low') sortOptions = { stock: 1 };

    const skip = (page - 1) * limit;

    // Lean selection returning essential fields only (Rule 12)
    const products = await Product.find(query)
      .populate('category', 'name slug targetAudience')
      .select('name slug sku targetAudience category subCategory images price discountPrice stock isBestSeller isFeatured status createdAt')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(query);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products (Create new product with 3 photos requirement)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      name,
      description,
      targetAudience,
      categoryId,
      subCategory,
      images, // Expected array of 1 to 6 photos [{ url, alt }]
      price,
      discountPrice,
      stock,
      sizes,
      sizeAvailability,
      colors,
      colorVariants,
      isBestSeller,
      isTopSeller,
      isFeatured,
      isLatest,
      badge,
      status,
      seo,
    } = body;

    if (!name || !targetAudience || !categoryId || !price || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required product fields: name, targetAudience, categoryId, price, stock' },
        { status: 400 }
      );
    }

    // Ensure 1 to 6 photos provided
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Product must include at least 1 image (up to 6 photos max)' }, { status: 400 });
    }

    if (images.length > 6) {
      return NextResponse.json({ error: 'Maximum 6 photos allowed per product' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();
    const sku = 'GRV-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const product = await Product.create({
      name,
      slug,
      sku,
      description: description || '',
      targetAudience,
      category: categoryId,
      subCategory: subCategory || 'Casual Sandals',
      images,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      stock: Number(stock),
      sizes: sizes || ['4', '5', '6', '7', '9', '10'],
      sizeAvailability: sizeAvailability || [],
      colors: colors || ['Brown', 'Black', 'Tan'],
      colorVariants: colorVariants || [],
      seo: seo || undefined,
      isBestSeller: Boolean(isBestSeller),
      isTopSeller: Boolean(isTopSeller),
      isFeatured: Boolean(isFeatured),
      isLatest: Boolean(isLatest),
      badge: badge || '',
      status: status || 'active',
    });

    // Invalidate product & dashboard cache
    await invalidateCache('admin:dashboard:stats');

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}
