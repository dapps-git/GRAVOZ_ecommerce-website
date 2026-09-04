import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { Brand } from '@/models/Brand';
import { invalidateCache } from '@/lib/redis';


// GET /api/products (Rule 8, 9, 10, 12)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);
    const targetAudience = searchParams.get('targetAudience'); // 'Men' | 'Women' | 'Babies'
    const categoryId = searchParams.get('categoryId');
    const brandId = searchParams.get('brandId');
    const status = searchParams.get('status');
    const stockStatus = searchParams.get('stockStatus');
    const categorySlug = searchParams.get('category');
    const isBestSeller = searchParams.get('isBestSeller');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';

    const query: Record<string, unknown> = {};

    if (targetAudience && targetAudience !== 'all') {
      query.targetAudience = targetAudience;
    }

    if (categoryId && categoryId !== 'all') {
      query.category = categoryId;
    }

    if (brandId && brandId !== 'all') {
      query.brand = brandId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (stockStatus) {
      if (stockStatus === 'in_stock') query.stock = { $gt: 10 };
      else if (stockStatus === 'low_stock') query.stock = { $gt: 0, $lte: 10 };
      else if (stockStatus === 'out_of_stock') query.stock = { $lte: 0 };
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

    // Lean selection returning essential fields
    const products = await Product.find(query)
      .populate('category', 'name slug targetAudience')
      .populate('brand', 'name')
      .select('name slug sku targetAudience category brand subCategory images colors colorVariants sizes price discountPrice stock isBestSeller isFeatured status createdAt')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(query);

    // Compute live inventory & status stats
    const [totalAll, activeCount, draftCount, outOfStockCount, lowStockCount] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: { $in: ['draft', 'inactive'] } }),
      Product.countDocuments({ stock: { $lte: 0 } }),
      Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
    ]);

    return NextResponse.json({
      products,
      stats: {
        total: totalAll,
        active: activeCount,
        draft: draftCount,
        outOfStock: outOfStockCount,
        lowStock: lowStockCount,
      },
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

// POST /api/products (Create new product)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      name,
      sku: inputSku,
      description,
      features,
      targetAudience,
      categoryId,
      brandId,
      subCategory,
      itemType,
      images,
      price,
      discountPrice,
      gst,
      stock,
      sizes,
      sizeAvailability,
      colors,
      colorVariants,
      material,
      ageRange,
      occasion,
      strapType,
      closureType,
      shoeType,
      manufacturer,
      hsnCode,
      packingLength,
      packingWidth,
      packingHeight,
      isBestSeller,
      isTopSeller,
      isFeatured,
      isLatest,
      badge,
      status,
      seo,
    } = body;

    if (!name || !targetAudience || !price || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required product fields: name, targetAudience, price, stock' },
        { status: 400 }
      );
    }

    // Ensure at least 1 photo provided
    const validImages = Array.isArray(images) && images.length > 0
      ? images.map((img: any) => ({
          url: typeof img === 'string' ? img : img.url,
          alt: (typeof img === 'object' && img.alt) ? img.alt : `${name} photo`,
        }))
      : [{ url: '/products/placeholder.svg', alt: `${name} photo` }];

    const generatedSlug = (seo?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) + '-' + Date.now().toString().slice(-4);
    const finalSku = inputSku || ('GRV-' + Math.random().toString(36).substring(2, 8).toUpperCase());

    const product = await Product.create({
      name,
      sku: finalSku,
      slug: generatedSlug,
      description: description || '',
      features: Array.isArray(features) ? features : [],
      targetAudience,
      category: categoryId && categoryId.length === 24 ? categoryId : undefined,
      brand: brandId && brandId.length === 24 ? brandId : undefined,
      subCategory: subCategory || 'Casual Shoes',
      itemType: itemType || 'Shoe',
      images: validImages,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      gst: gst ? Number(gst) : 12,
      stock: Number(stock),
      sizes: sizes || ['6', '7', '8', '9', '10', '11'],
      sizeAvailability: sizeAvailability || [],
      colors: colors || ['Brown', 'Black', 'Tan'],
      colorVariants: colorVariants || [],
      material: material || '',
      ageRange: ageRange || '',
      occasion: occasion || '',
      strapType: strapType || '',
      closureType: closureType || '',
      shoeType: shoeType || '',
      manufacturer: manufacturer || '',
      hsnCode: hsnCode || '',
      packingLength: packingLength ? Number(packingLength) : 0,
      packingWidth: packingWidth ? Number(packingWidth) : 0,
      packingHeight: packingHeight ? Number(packingHeight) : 0,
      seo: seo || {
        metaTitle: name,
        metaDescription: description || '',
        slug: generatedSlug,
      },
      isBestSeller: Boolean(isBestSeller),
      isTopSeller: Boolean(isTopSeller),
      isFeatured: Boolean(isFeatured),
      isLatest: Boolean(isLatest),
      badge: badge || '',
      status: status || 'draft',
    });

    // Invalidate product & dashboard cache
    await invalidateCache('admin:dashboard:stats');

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating product:', err);
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}
