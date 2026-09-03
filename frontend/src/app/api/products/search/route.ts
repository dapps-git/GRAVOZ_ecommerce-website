import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();
    const audience = searchParams.get('audience');
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 30);

    if (!query && !audience && !category) {
      return NextResponse.json({
        success: true,
        products: [],
        suggestions: [],
        total: 0,
      });
    }

    await connectDB();

    const dbQuery: Record<string, any> = { status: 'active' };

    if (audience) {
      dbQuery.targetAudience = new RegExp(`^${audience}$`, 'i');
    }

    if (query) {
      const regex = new RegExp(query, 'i');
      dbQuery.$or = [
        { name: regex },
        { subCategory: regex },
        { description: regex },
        { colors: regex },
        { 'seo.keywords': regex },
      ];
    }

    const products = await Product.find(dbQuery)
      .populate('category', 'name slug targetAudience')
      .populate('brand', 'name slug logoUrl')
      .limit(limit)
      .lean();

    // Generate search suggestions from names and subCategories
    const suggestionsSet = new Set<string>();
    products.forEach((p: any) => {
      if (p.name) suggestionsSet.add(p.name);
      if (p.subCategory) suggestionsSet.add(p.subCategory);
    });

    return NextResponse.json({
      success: true,
      products: products || [],
      suggestions: Array.from(suggestionsSet).slice(0, 6),
      total: products.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message, products: [], suggestions: [], total: 0 }, { status: 500 });
  }
}
