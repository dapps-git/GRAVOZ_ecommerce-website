import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { HomeSection } from '@/models/HomeSection';
import { Product } from '@/models/Product';

// Map section key → product flag field
const SECTION_FLAG_MAP: Record<string, string> = {
  best_sellers:      'isBestSeller',
  top_selling:       'isTopSeller',
  latest_products:   'isLatest',
  featured_products: 'isFeatured',
};

const SECTION_DEFAULTS: Record<string, { title: string; subtitle: string; displayOrder: number }> = {
  best_sellers:      { title: 'Best Sellers',          subtitle: 'Our most loved and iconic designs',    displayOrder: 1 },
  top_selling:       { title: 'Top Selling',           subtitle: 'Trending styles chosen by thousands',  displayOrder: 2 },
  latest_products:   { title: 'Latest Arrivals',       subtitle: 'Fresh new season silhouettes',         displayOrder: 3 },
  featured_products: { title: 'Featured Collection',   subtitle: 'Handpicked handcrafted perfection',    displayOrder: 4 },
};

/**
 * Build a section items list from real products tagged with the relevant flag.
 * Each card uses:
 *   imageUrl      → product.images[0].url  (main lifestyle / hero photo on card)
 *   insetImageUrl → product.images[1].url  (floating inset thumbnail — falls back to images[0])
 *   sizes         → product.sizes / sizeAvailability
 *   colors        → product.colorVariants / colors
 * Clicking the card opens /products/:id which shows the full gallery (up to 6 images).
 */
async function buildItemsFromProducts(flagField: string, limit = 10) {
  try {
    const products = await Product.find({ [flagField]: true, status: 'active' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return products.map((p: any) => {
      const mainImg   = p.images?.[0]?.url   || '/products/placeholder.svg';
      const insetImg  = p.images?.[1]?.url   || p.images?.[0]?.url || '/products/placeholder.svg';
      const price     = p.discountPrice ?? p.price;
      const origPrice = p.price !== price ? p.price : undefined;

      // Sizes mapping
      let sizes: Array<{ size: string; isAvailable: boolean }> = [];
      if (Array.isArray(p.sizeAvailability) && p.sizeAvailability.length > 0) {
        sizes = p.sizeAvailability.map((s: any) => ({ size: s.size, isAvailable: s.isAvailable }));
      } else if (Array.isArray(p.sizes) && p.sizes.length > 0) {
        sizes = p.sizes.map((s: string) => ({ size: s, isAvailable: true }));
      }

      // Colors mapping
      let colors: Array<{ name: string; colorCode: string }> = [];
      if (Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
        colors = p.colorVariants.map((v: any) => ({ name: v.name, colorCode: v.colorCode || '#1a1a1a' }));
      } else if (Array.isArray(p.colors) && p.colors.length > 0) {
        colors = p.colors.map((c: string) => ({
          name: c,
          colorCode:
            c.toLowerCase() === 'black' ? '#1a1a1a' :
            c.toLowerCase() === 'brown' ? '#4a2c11' :
            c.toLowerCase() === 'tan' ? '#c28b57' :
            c.toLowerCase() === 'red' ? '#dc2626' :
            c.toLowerCase() === 'olive' ? '#556b2f' :
            c.toLowerCase() === 'pink' ? '#f4a6b8' :
            c.toLowerCase() === 'white' ? '#f8f8f8' :
            c.toLowerCase() === 'navy' ? '#1a2a40' : '#1a1a1a',
        }));
      }

      return {
        id:             String(p._id),
        title:          p.name,
        description:    p.description || '',
        price,
        originalPrice:  origPrice,
        imageUrl:       mainImg,
        insetImageUrl:  insetImg,
        sizes,
        colors,
        linkUrl:        `/products/${p._id}`,
        productId:      String(p._id),
        isAvailable:    p.stock > 0,
        displayOrder:   0,
      };
    });
  } catch {
    return [];
  }
}

export async function GET(_req: NextRequest) {
  try {
    await connectDB();

    const sectionKeys = Object.keys(SECTION_FLAG_MAP);
    const sections = [];

    for (const key of sectionKeys) {
      // 1. Try manually curated admin section first
      let dbSection = await HomeSection.findOne({ sectionKey: key }).lean();

      // 2. Determine items to use: prefer manually set if they have imageUrls, else fall back to product flags
      let items: any[] = [];

      const manualItems = (dbSection as any)?.items ?? [];
      const hasManualContent = manualItems.some((it: any) => it.imageUrl);

      if (hasManualContent) {
        items = manualItems;
      } else {
        // Auto-populate from product catalog using isBestSeller / isTopSeller / isLatest / isFeatured flags
        items = await buildItemsFromProducts(SECTION_FLAG_MAP[key], 10);
      }

      const defaults = SECTION_DEFAULTS[key];
      sections.push({
        sectionKey:   key,
        title:        (dbSection as any)?.title    || defaults.title,
        subtitle:     (dbSection as any)?.subtitle || defaults.subtitle,
        isActive:     (dbSection as any)?.isActive ?? true,
        displayOrder: (dbSection as any)?.displayOrder ?? defaults.displayOrder,
        items,
      });
    }

    // Sort by displayOrder
    sections.sort((a, b) => a.displayOrder - b.displayOrder);

    const sectionsByKey: Record<string, any> = {};
    sections.forEach((s) => { sectionsByKey[s.sectionKey] = s; });

    return NextResponse.json({ success: true, sections, sectionsByKey });
  } catch (error: any) {
    console.error('Error fetching storefront home sections:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load home sections' },
      { status: 500 }
    );
  }
}
