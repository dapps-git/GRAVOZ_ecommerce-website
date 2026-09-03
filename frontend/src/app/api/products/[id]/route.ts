import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { Brand } from '@/models/Brand';
import { Banner } from '@/models/Banner';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    await connectDB();

    // Ensure models are registered to avoid strictPopulate error
    void Brand;
    void Category;

    let product: any = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id)
        .populate({ path: 'category', select: 'name slug targetAudience', strictPopulate: false })
        .populate({ path: 'brand', select: 'name slug logoUrl', strictPopulate: false })
        .lean();
    }

    if (!product) {
      // Search by slug, sku, or seo.slug
      product = await Product.findOne({
        $or: [
          { slug: id },
          { 'seo.slug': id },
          { sku: id },
          { name: new RegExp(`^${id.replace(/-/g, ' ')}$`, 'i') },
        ],
      })
        .populate({ path: 'category', select: 'name slug targetAudience', strictPopulate: false })
        .populate({ path: 'brand', select: 'name slug logoUrl', strictPopulate: false })
        .lean();
    }

    // If still not found, check if it's a Duo Showcase product from Banner collection
    if (!product) {
      const banner = await Banner.findOne({
        $or: [
          { slot: id },
          { linkUrl: `/products/${id}` },
          { linkUrl: id },
        ],
        category: 'duo_showcase',
      }).lean();

      if (banner) {
        // Build 3 showcase images (Main, Thumbnail Inset, Lifestyle)
        const bannerImages: Array<{ url: string; alt: string }> = [];
        if (banner.imageUrl) bannerImages.push({ url: banner.imageUrl, alt: `${banner.title} - Main View` });
        if (banner.thumbnailUrl) bannerImages.push({ url: banner.thumbnailUrl, alt: `${banner.title} - Inset Angle View` });
        if (banner.lifestyleUrl) bannerImages.push({ url: banner.lifestyleUrl, alt: `${banner.title} - Lifestyle Look` });

        if (bannerImages.length === 0) {
          bannerImages.push({ url: '/products/placeholder.svg', alt: banner.title || 'Product' });
        }

        const sizeList = Array.isArray(banner.sizes) && banner.sizes.length > 0 ? banner.sizes : ['5', '6', '7', '8', '9', '10'];
        const colorList = Array.isArray(banner.colors) && banner.colors.length > 0
          ? banner.colors
          : [
              { name: 'Beige', colorCode: '#d8c7b5', imageUrl: banner.imageUrl || '/products/placeholder.svg' },
              { name: 'Cream', colorCode: '#f3ede2', imageUrl: banner.thumbnailUrl || '/products/placeholder.svg' },
              { name: 'Sand', colorCode: '#c2b29f', imageUrl: banner.lifestyleUrl || '/products/placeholder.svg' },
            ];

        product = {
          _id: banner.slot,
          name: banner.title || "Women's Casual Comfort Sandals",
          brand: 'Gravoz',
          price: banner.price || 1399,
          originalPrice: banner.originalPrice || 1429,
          rating: 5.0,
          reviewsCount: 38,
          targetAudience: banner.slot.includes('women') || (banner.title && banner.title.toLowerCase().includes('women')) ? 'Women' : 'Men',
          subCategory: 'Casual Sandals',
          stock: 45,
          sizes: sizeList,
          sizeAvailability: sizeList.map((s: string) => ({ size: s, isAvailable: true, stock: 12 })),
          colors: colorList.map((c: any) => c.name || c),
          colorVariants: colorList.map((c: any, idx: number) => ({
            name: typeof c === 'object' ? c.name : c,
            colorCode: typeof c === 'object' ? c.colorCode || '#c28b57' : '#c28b57',
            imageUrl: typeof c === 'object' && c.imageUrl ? c.imageUrl : (bannerImages[idx % bannerImages.length]?.url || '/products/placeholder.svg'),
            isAvailable: true,
          })),
          images: bannerImages,
          description: banner.description || `Experience unparalleled everyday luxury with the GRAVOZ ${banner.title || "Casual Comfort Sandals"}. Handcrafted from premium-grade artisan materials with precision stitching.`,
          additionalInfo: {
            'Material': 'Artisan Finished Premium Leather / High-Grade Vegan Strap',
            'Sole Material': 'Ultra-Grip Anti-Skid Shock-Absorbing Rubber (TPR)',
            'Closure': 'Adjustable Ergonomic Buckle Strap',
            'Insole': 'Cushioned Orthopedic Memory Foam Footbed',
            'Country of Origin': 'India (Handcrafted)',
            'Care Instructions': 'Wipe clean with a soft dry cloth.',
          },
          shippingAndReturn: {
            'Free Delivery': 'Complimentary express shipping across India on all prepaid & COD orders.',
            'Estimated Delivery': '2 to 4 business days to metro cities; 4 to 6 days to rest of India.',
            'Easy Returns & Exchanges': '7-day hassle-free return and exchange policy with doorstep pickup.',
            'Warranty': '6-month comprehensive manufacturing warranty covering stitching & sole adhesion.',
          },
        };
      }
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Collect all available images (from root images and colorVariants)
    const collectedImages: Array<{ url: string; alt?: string }> = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img: any) => {
        if (img?.url && !img.url.includes('placeholder.svg')) {
          collectedImages.push({ url: img.url, alt: img.alt || product.name });
        }
      });
    }

    if (Array.isArray(product.colorVariants)) {
      product.colorVariants.forEach((v: any) => {
        if (Array.isArray(v.images)) {
          v.images.forEach((img: any) => {
            if (img?.url && !img.url.includes('placeholder.svg') && !collectedImages.some(i => i.url === img.url)) {
              collectedImages.push({ url: img.url, alt: img.alt || `${v.name || product.name} photo` });
            }
          });
        } else if (v.imageUrl && !collectedImages.some(i => i.url === v.imageUrl)) {
          collectedImages.push({ url: v.imageUrl, alt: `${v.name || product.name} photo` });
        }
      });
    }

    if (collectedImages.length === 0) {
      collectedImages.push({ url: '/products/placeholder.svg', alt: product.name });
    }

    // Format selling price and MRP correctly
    const finalSellingPrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : (product.price || 0);
    const originalMrpPrice = product.discountPrice && product.discountPrice > 0 ? (product.price || product.discountPrice) : (product.originalPrice || product.price || 0);

    // Format specifications
    const additionalInfoObj: Record<string, string> = {
      'Material': product.material || 'Genuine Artisan Leather',
      'Occasion': product.occasion || 'Casual & Daily Wear',
      'Closure Type': product.closureType || 'Slip-On',
      'Strap Type': product.strapType || 'No Strap',
      'Shoe Type': product.shoeType || product.subCategory || 'Casual Shoes',
      'Target Gender': product.targetAudience || 'Men',
      'Age Range': product.ageRange || 'Adults',
      'Manufacturer': product.manufacturer || 'GRAVOZ Artisans Pvt. Ltd.',
      'HSN Code': product.hsnCode || '64032000',
      'GST': product.gst ? `${product.gst}%` : '12%',
      'Origin': 'India (Handcrafted)',
    };

    // Format features as string
    let formattedFeatures = '';
    if (Array.isArray(product.features)) {
      formattedFeatures = product.features.join('\n');
    } else if (typeof product.features === 'string') {
      formattedFeatures = product.features;
    }

    const formattedProduct = {
      ...product,
      brand: typeof product.brand === 'object' && product.brand !== null ? product.brand.name : (product.brand || 'GRAVOZ'),
      categoryName: typeof product.category === 'object' && product.category !== null ? product.category.name : (product.category || 'Footwear'),
      price: finalSellingPrice,
      originalPrice: originalMrpPrice,
      rating: product.rating || 5.0,
      reviewsCount: product.reviewsCount || 0,
      images: collectedImages,
      features: formattedFeatures,
      additionalInfo: product.additionalInfo || additionalInfoObj,
      shippingAndReturn: product.shippingAndReturn || {
        'Free Delivery': 'Complimentary express shipping across India on all prepaid & COD orders.',
        'Estimated Delivery': '2 to 4 business days to metro cities; 4 to 6 days to rest of India.',
        'Easy Returns & Exchanges': '7-day hassle-free return and exchange policy with doorstep pickup.',
        'Warranty': '6-month comprehensive manufacturing warranty covering stitching & sole adhesion.',
      },
    };

    return NextResponse.json(
      {
        success: true,
        product: formattedProduct,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('Failed to fetch product by id:', error);
    return NextResponse.json({ error: error.message || 'Failed to load product' }, { status: 500 });
  }
}
