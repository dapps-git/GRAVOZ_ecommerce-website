import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';

const PRODUCT_CATALOG: Record<string, any> = {
  'p1': {
    _id: 'p1',
    name: "Men's Casual Comfort Sandals – Brown",
    brand: 'Gravoz',
    price: 1399,
    discountPrice: 1399,
    originalPrice: 1429,
    rating: 5.0,
    reviewsCount: 128,
    targetAudience: 'Men',
    categoryName: 'Footwear',
    subCategory: 'Casual Sandals',
    sku: 'GRV-SNDL-BRW01',
    stock: 45,
    sizes: ['5', '4', '6', '7', '9', '10'],
    sizeAvailability: [
      { size: '5', isAvailable: true, stock: 12 },
      { size: '4', isAvailable: false, stock: 0 },
      { size: '6', isAvailable: true, stock: 15 },
      { size: '7', isAvailable: true, stock: 8 },
      { size: '9', isAvailable: true, stock: 6 },
      { size: '10', isAvailable: false, stock: 0 },
    ],
    colors: ['Brown', 'Black', 'Tan', 'Olive'],
    images: [
      { url: '/products/product3.webp', alt: "Men's Casual Comfort Sandals – Brown Front View" },
      { url: '/products/product1.webp', alt: "Men's Casual Comfort Sandals – Angle View" },
      { url: '/products/product2.webp', alt: "Men's Casual Comfort Sandals – Side Profile" },
      { url: '/products/product4.webp', alt: "Men's Casual Comfort Sandals – Top Footbed" },
      { url: '/products/p1.webp', alt: "Men's Casual Comfort Sandals – Lifestyle Look" },
    ],
    description: `Experience unparalleled every-day luxury with the GRAVOZ Men's Casual Comfort Sandals in classic Brown. Handcrafted from premium grade artisan leather with precision stitching, these sandals feature an anatomically molded ergonomic footbed designed to provide maximum shock absorption, arch support, and breathability all day long.`,
    additionalInfo: {
      'Material': '100% Genuine Artisan Finished Leather',
      'Sole Material': 'Ultra-Grip Anti-Skid Thermoplastic Rubber (TPR)',
      'Closure': 'Adjustable Ergonomic Hook & Loop Strap',
      'Insole': 'Cushioned Orthopedic Memory Foam Footbed',
      'Country of Origin': 'India (Handcrafted)',
      'Care Instructions': 'Wipe clean with a soft dry cloth. Use neutral leather conditioner periodically.',
    },
    shippingAndReturn: {
      'Free Delivery': 'Complimentary standard express shipping across India on all prepaid & COD orders.',
      'Estimated Delivery': '2 to 4 business days to metro cities; 4 to 6 days to rest of India.',
      'Easy Returns & Exchanges': '7-day hassle-free return and exchange policy with doorstep pickup.',
      'Warranty': '6-month comprehensive manufacturing warranty covering stitching & sole adhesion.',
    },
  },
  'p2': {
    _id: 'p2',
    name: "Men's Casual Comfort Sandals – Tan",
    brand: 'Gravoz',
    price: 1399,
    discountPrice: 1399,
    originalPrice: 1429,
    rating: 5.0,
    reviewsCount: 94,
    targetAudience: 'Men',
    categoryName: 'Footwear',
    subCategory: 'Casual Sandals',
    sku: 'GRV-SNDL-TAN02',
    stock: 30,
    sizes: ['5', '4', '6', '7', '9', '10'],
    sizeAvailability: [
      { size: '5', isAvailable: true, stock: 10 },
      { size: '4', isAvailable: true, stock: 5 },
      { size: '6', isAvailable: true, stock: 8 },
      { size: '7', isAvailable: false, stock: 0 },
      { size: '9', isAvailable: true, stock: 4 },
      { size: '10', isAvailable: true, stock: 3 },
    ],
    colors: ['Tan', 'Brown', 'Black'],
    images: [
      { url: '/products/product2.webp', alt: "Men's Casual Comfort Sandals Tan" },
      { url: '/products/product1.webp', alt: "Men's Casual Comfort Sandals Side" },
      { url: '/products/product3.webp', alt: "Men's Casual Comfort Sandals Angle" },
      { url: '/products/product4.webp', alt: "Men's Casual Comfort Sandals Top" },
      { url: '/products/p2.webp', alt: "Men's Casual Comfort Sandals Texture" },
    ],
    description: `Elegantly designed for modern versatile wear, the GRAVOZ Tan Casual Comfort Sandals blend breathable craftsmanship with heavy-duty comfort. Ideal for leisure, casual gatherings, and active weekend strolls.`,
    additionalInfo: {
      'Material': 'Soft-touch Genuine Leather',
      'Sole Material': 'TPR Lightweight Flexible Sole',
      'Insole': 'High-Density Dual Layer Cushioning',
      'Country of Origin': 'India',
    },
    shippingAndReturn: {
      'Free Delivery': 'All India Free Shipping available.',
      'Easy Returns': '7-day doorstep replacement and refund guarantee.',
    },
  },
  'p3': {
    _id: 'p3',
    name: "Men's Casual Comfort Sandals – Black",
    brand: 'Gravoz',
    price: 1399,
    discountPrice: 1399,
    originalPrice: 1429,
    rating: 5.0,
    reviewsCount: 112,
    targetAudience: 'Men',
    categoryName: 'Footwear',
    subCategory: 'Casual Sandals',
    sku: 'GRV-SNDL-BLK03',
    stock: 35,
    sizes: ['5', '4', '6', '7', '9', '10'],
    sizeAvailability: [
      { size: '5', isAvailable: true, stock: 8 },
      { size: '4', isAvailable: false, stock: 0 },
      { size: '6', isAvailable: true, stock: 12 },
      { size: '7', isAvailable: true, stock: 10 },
      { size: '9', isAvailable: false, stock: 0 },
      { size: '10', isAvailable: true, stock: 5 },
    ],
    colors: ['Black', 'Tan', 'Brown'],
    images: [
      { url: '/products/product1.webp', alt: "Men's Casual Comfort Sandals Black" },
      { url: '/products/product2.webp', alt: "Men's Casual Comfort Sandals Side" },
      { url: '/products/product3.webp', alt: "Men's Casual Comfort Sandals Sole" },
      { url: '/products/product4.webp', alt: "Men's Casual Comfort Sandals Top" },
      { url: '/products/product9.webp', alt: "Men's Casual Comfort Sandals Detail" },
    ],
    description: `Bold, timeless, and effortlessly comfortable. The GRAVOZ Men's Casual Comfort Sandals in Jet Black feature deep cushioned comfort beds and water-resistant finish for everyday rugged elegance.`,
    additionalInfo: {
      'Material': 'Premium Full Grain Matte Leather',
      'Sole Material': 'Anti-slip Shock Absorbing TPR',
      'Country of Origin': 'India',
    },
    shippingAndReturn: {
      'Free Delivery': 'Fast track 2-4 business day delivery.',
      'Easy Returns': '7 days easy returns with 100% refund.',
    },
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lookupId = decodeURIComponent(id).trim();

    // 1. Try DB first
    try {
      await connectDB();
      const product = await Product.findOne({
        $or: [{ _id: lookupId.match(/^[0-9a-fA-F]{24}$/) ? lookupId : null }, { slug: lookupId }, { sku: lookupId }],
      })
        .populate('category', 'name slug targetAudience')
        .lean();

      if (product) {
        // Ensure 3 to 6 images exist for gallery
        const images = Array.isArray(product.images) && product.images.length > 0
          ? product.images
          : [{ url: '/products/product3.webp', alt: product.name }];

        const galleryImages = [...images];
        while (galleryImages.length < 5) {
          const fallbackUrls = ['/products/product1.webp', '/products/product2.webp', '/products/product4.webp', '/products/product9.webp', '/products/p1.webp'];
          const nextUrl = fallbackUrls[galleryImages.length % fallbackUrls.length];
          galleryImages.push({ url: nextUrl, alt: `${product.name} view ${galleryImages.length + 1}` });
        }

        // Build size availability list
        let sizeAvail = product.sizeAvailability;
        if (!Array.isArray(sizeAvail) || sizeAvail.length === 0) {
          const sizesArr = product.sizes && product.sizes.length > 0 ? product.sizes : ['5', '4', '6', '7', '9', '10'];
          sizeAvail = sizesArr.map((s: string) => ({ size: s, isAvailable: true, stock: 10 }));
        }

        return NextResponse.json({
          success: true,
          product: {
            ...product,
            images: galleryImages.slice(0, 6),
            sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['5', '4', '6', '7', '9', '10'],
            sizeAvailability: sizeAvail,
            originalPrice: product.discountPrice ? product.price : Math.round(product.price * 1.05),
            price: product.discountPrice || product.price,
            brand: 'Gravoz',
            additionalInfo: {
              'Material': '100% Genuine Artisan Finished Leather',
              'Sole Material': 'Ultra-Grip Anti-Skid Thermoplastic Rubber (TPR)',
              'Closure': 'Adjustable Ergonomic Hook & Loop Strap',
              'Insole': 'Cushioned Orthopedic Memory Foam Footbed',
              'Country of Origin': 'India (Handcrafted)',
              'Care Instructions': 'Wipe clean with a soft dry cloth. Use neutral leather conditioner periodically.',
            },
            shippingAndReturn: {
              'Free Delivery': 'Complimentary standard express shipping across India on all prepaid & COD orders.',
              'Estimated Delivery': '2 to 4 business days to metro cities; 4 to 6 days to rest of India.',
              'Easy Returns & Exchanges': '7-day hassle-free return and exchange policy with doorstep pickup.',
              'Warranty': '6-month comprehensive manufacturing warranty covering stitching & sole adhesion.',
            },
          },
        });
      }
    } catch {
      // DB offline / fallback
    }

    // 2. Return from rich catalog
    const staticItem = PRODUCT_CATALOG[lookupId] || PRODUCT_CATALOG['p1'];

    return NextResponse.json({
      success: true,
      product: staticItem,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to load product' }, { status: 500 });
  }
}
