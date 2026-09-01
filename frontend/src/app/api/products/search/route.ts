import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';

// Fallback high-speed static product catalog with rich multi-field metadata
const STATIC_CATALOG = [
  {
    _id: 'p1',
    name: "Men's Casual Comfort Sandals – WGP50020 Black",
    brand: 'Gravoz',
    price: 1399,
    discountPrice: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product1.webp', alt: "Men's Casual Comfort Sandals Black" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Black', 'Dark Gray'],
    keywords: ['black', 'sandals', 'casual', 'comfort', 'leather', 'men', 'footwear', 'black shoes', 'black sandals'],
    isBestSeller: true,
    isFeatured: true,
    stock: 45,
  },
  {
    _id: 'p2',
    name: "Men's Casual Comfort Sandals – WGP50020 Tan",
    brand: 'Gravoz',
    price: 1399,
    discountPrice: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product2.webp', alt: "Men's Casual Comfort Sandals Tan" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Tan', 'Brown', 'Beige'],
    keywords: ['tan', 'brown', 'sandals', 'casual', 'comfort', 'men', 'leather'],
    isBestSeller: true,
    isFeatured: true,
    stock: 30,
  },
  {
    _id: 'p3',
    name: "Men's Casual Comfort Sandals – WGP50020 Brown",
    brand: 'Gravoz',
    price: 1399,
    discountPrice: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product3.webp', alt: "Men's Casual Comfort Sandals Brown" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Brown', 'Chocolate'],
    keywords: ['brown', 'sandals', 'casual', 'men', 'leather', 'comfort sandals'],
    isBestSeller: true,
    isFeatured: false,
    stock: 25,
  },
  {
    _id: 'p4',
    name: "Men's Casual Comfort Sandals – WGP50020 Olive",
    brand: 'Gravoz',
    price: 1399,
    discountPrice: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product4.webp', alt: "Men's Casual Comfort Sandals Olive" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Olive', 'Green', 'Khaki'],
    keywords: ['olive', 'green', 'sandals', 'casual', 'men'],
    isBestSeller: false,
    isFeatured: true,
    stock: 20,
  },
  {
    _id: 'p5',
    name: "Men's Casual Sneaker – Classic White Edition",
    brand: 'Gravoz',
    price: 1599,
    discountPrice: 1599,
    originalPrice: 1799,
    rating: 5.0,
    images: [{ url: '/products/product5.webp', alt: "Casual Shoe" }],
    targetAudience: 'Men',
    subCategory: 'Casual Shoe',
    colors: ['White', 'Off-White'],
    keywords: ['white', 'sneakers', 'shoes', 'casual shoe', 'white shoes', 'men'],
    isBestSeller: true,
    isFeatured: true,
    stock: 18,
  },
  {
    _id: 'p6',
    name: "Women's Comfort Casual Strap Sandal",
    brand: 'Gravoz',
    price: 1299,
    discountPrice: 1299,
    originalPrice: 1499,
    rating: 5.0,
    images: [{ url: '/products/product6.webp', alt: "Casual Sandal" }],
    targetAudience: 'Women',
    subCategory: 'Casual Sandal',
    colors: ['Tan', 'Beige', 'Gold'],
    keywords: ['women', 'sandals', 'strap sandal', 'casual', 'women shoes', 'ladies'],
    isBestSeller: true,
    isFeatured: true,
    stock: 22,
  },
  {
    _id: 'p7',
    name: "Men's Formal Oxford Leather Shoe – Black",
    brand: 'Gravoz',
    price: 1999,
    discountPrice: 1999,
    originalPrice: 2299,
    rating: 5.0,
    images: [{ url: '/products/product7.webp', alt: "Leather Shoe" }],
    targetAudience: 'Men',
    subCategory: 'Leather Shoe',
    colors: ['Black'],
    keywords: ['black', 'leather shoe', 'oxford', 'formal', 'shoes', 'black shoe', 'black formal'],
    isBestSeller: true,
    isFeatured: true,
    stock: 14,
  },
  {
    _id: 'p8',
    name: "Women's Elegant Leather Buckle Sandal",
    brand: 'Gravoz',
    price: 1499,
    discountPrice: 1499,
    originalPrice: 1699,
    rating: 5.0,
    images: [{ url: '/products/product.8.png', alt: "Leather Sandal" }],
    targetAudience: 'Women',
    subCategory: 'Leather Sandal',
    colors: ['Black', 'Brown'],
    keywords: ['women', 'black', 'brown', 'sandals', 'buckle', 'leather sandal', 'women shoes'],
    isBestSeller: true,
    isFeatured: true,
    stock: 16,
  },
  {
    _id: 'p9',
    name: "GRAVOZ Flagship Casual Comfort Runner – WGP50020 Black",
    brand: 'Gravoz',
    price: 1399,
    discountPrice: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product9.webp', alt: "Men's Casual Comfort Sandals" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Black'],
    keywords: ['black', 'sandals', 'runner', 'flagship', 'casual', 'comfort', 'black shoe'],
    isBestSeller: true,
    isFeatured: true,
    stock: 32,
  },
  {
    _id: 'p10',
    name: "Men's Classic Slip-on Casual Sandal – Black",
    brand: 'Gravoz',
    price: 1399,
    discountPrice: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product10.webp', alt: "Men's Casual Comfort Sandals" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Black'],
    keywords: ['black', 'sandals', 'slip on', 'black shoe', 'men'],
    isBestSeller: true,
    isFeatured: false,
    stock: 28,
  },
  {
    _id: 'p18',
    name: "GRAVOZ All-Weather Outdoor Sandal",
    brand: 'Gravoz',
    price: 1199,
    discountPrice: 1199,
    originalPrice: 1499,
    rating: 5.0,
    images: [{ url: '/products/product18.webp', alt: "Outdoor Sandal" }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
    colors: ['Black', 'Grey'],
    keywords: ['black', 'outdoor', 'sandals', 'shoes', 'waterproof'],
    isBestSeller: false,
    isFeatured: false,
    stock: 20,
  },
  {
    _id: 'p19',
    name: "GRAVOZ Urban Everyday Leather Loafer",
    brand: 'Gravoz',
    price: 1669,
    discountPrice: 1669,
    originalPrice: 1699,
    rating: 5.0,
    images: [{ url: '/products/product19.webp', alt: "Urban Loafer" }],
    targetAudience: 'Men',
    subCategory: 'Leather Shoe',
    colors: ['Brown', 'Tan'],
    keywords: ['brown', 'shoes', 'loafers', 'leather', 'men shoes'],
    isBestSeller: false,
    isFeatured: false,
    stock: 15,
  }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get('q') || searchParams.get('query') || '').trim();
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 50);

    if (!rawQuery) {
      try {
        await connectDB();
        const dbProducts = await Product.find({ status: 'active' }).limit(limit).lean();
        if (dbProducts && dbProducts.length > 0) {
          return NextResponse.json({
            success: true,
            query: '',
            total: dbProducts.length,
            products: dbProducts,
          });
        }
      } catch {
        // use static catalog
      }
      return NextResponse.json({
        success: true,
        query: '',
        total: STATIC_CATALOG.length,
        products: STATIC_CATALOG.slice(0, limit),
      });
    }

    // 1. Sanitize & escape regex characters for secure search (prevents ReDoS/injection)
    const sanitized = rawQuery.substring(0, 80);
    const escaped = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const terms = escaped.toLowerCase().split(/\s+/).filter(Boolean);

    // 2. Try MongoDB Database Search
    try {
      await connectDB();
      const regexConditions = terms.map((term) => ({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { subCategory: { $regex: term, $options: 'i' } },
          { targetAudience: { $regex: term, $options: 'i' } },
          { colors: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } },
          { 'seo.metaTitle': { $regex: term, $options: 'i' } },
          { 'seo.keywords': { $regex: term, $options: 'i' } },
          { 'seo.slug': { $regex: term, $options: 'i' } },
        ],
      }));

      const dbProducts = await Product.find({
        status: 'active',
        $and: regexConditions,
      })
        .populate('category', 'name slug targetAudience')
        .limit(limit)
        .lean();

      if (dbProducts && dbProducts.length > 0) {
        return NextResponse.json({
          success: true,
          query: sanitized,
          total: dbProducts.length,
          products: dbProducts,
        });
      }
    } catch {
      // Fallback to static catalog if DB is not populated or offline
    }

    // 3. Fallback High-Speed Multi-Field Fuzzy Match
    const matched = STATIC_CATALOG.filter((p) => {
      const searchableBlob = [
        p.name,
        p.brand,
        p.subCategory,
        p.targetAudience,
        ...(p.colors || []),
        ...(p.keywords || []),
      ]
        .join(' ')
        .toLowerCase();

      // Check if all or any keywords match
      return terms.every((term) => searchableBlob.includes(term));
    });

    // If strict match has results, return them. If not, try matching at least 1 term
    const finalResults = matched.length > 0
      ? matched
      : STATIC_CATALOG.filter((p) => {
          const searchableBlob = [
            p.name,
            p.brand,
            p.subCategory,
            p.targetAudience,
            ...(p.colors || []),
            ...(p.keywords || []),
          ]
            .join(' ')
            .toLowerCase();
          return terms.some((term) => searchableBlob.includes(term));
        });

    return NextResponse.json({
      success: true,
      query: sanitized,
      total: finalResults.length,
      products: finalResults.slice(0, limit),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Search execution failed' },
      { status: 500 }
    );
  }
}
