import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import { getCache, setCache, invalidateCache } from '@/lib/redis';

// GET /api/categories
export async function GET() {
  try {
    const cacheKey = 'categories:all';
    const cached = await getCache<unknown[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    await connectDB();
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).lean();

    await setCache(cacheKey, categories, 600); // 10 minutes cache
    return NextResponse.json(categories);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/categories
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, targetAudience, image, subCategories, displayOrder } = body;

    if (!name || !targetAudience) {
      return NextResponse.json({ error: 'Name and targetAudience (Men, Women, Babies, All) are required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newCat = await Category.create({
      name,
      slug,
      targetAudience,
      image: image || '',
      subCategories: subCategories || [],
      displayOrder: displayOrder || 0,
    });

    await invalidateCache('categories:all');
    return NextResponse.json({ success: true, category: newCat }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to create category' }, { status: 500 });
  }
}
