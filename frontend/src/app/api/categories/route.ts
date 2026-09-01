import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';

const DEFAULT_CATEGORIES = [
  { key: 'women', title: 'Women', href: '/category/women', imageUrl: '/images/women.webp' },
  { key: 'men', title: 'Men', href: '/category/men', imageUrl: '/images/men.webp' },
  { key: 'kids', title: 'Kids', href: '/category/kids', imageUrl: '/images/kid.webp' },
];

export async function GET(req: NextRequest) {
  try {
    try {
      await connectDB();
      const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
      if (categories && categories.length > 0) {
        return NextResponse.json({
          success: true,
          categories: categories.map((c) => ({
            key: c.slug,
            title: c.name,
            href: `/category/${c.slug}`,
            imageUrl: c.image || '/images/women.webp',
          })),
        });
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      categories: DEFAULT_CATEGORIES,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to load categories' }, { status: 500 });
  }
}
