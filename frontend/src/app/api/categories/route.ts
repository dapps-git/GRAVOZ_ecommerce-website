import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';

export async function GET(_req: NextRequest) {
  try {
    await connectDB();
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).lean();
    return NextResponse.json({
      success: true,
      categories: (categories || []).map((c: any) => ({
        _id: String(c._id),
        key: c.slug || c.name,
        name: c.name,
        title: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
        targetAudience: c.targetAudience,
        href: `/products?category=${encodeURIComponent(c.name)}`,
        imageUrl: c.image || '/products/placeholder.svg',
      })),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: true, categories: [] });
  }
}
