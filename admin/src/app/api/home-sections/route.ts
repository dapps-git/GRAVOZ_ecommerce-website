import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { HomeSection } from '@/models/HomeSection';

const DEFAULT_SECTIONS = [
  {
    sectionKey: 'best_sellers',
    title: 'Best Sellers',
    subtitle: 'Our most loved and iconic designs',
    isActive: true,
    displayOrder: 1,
    items: [],
  },
  {
    sectionKey: 'top_selling',
    title: 'Top Selling',
    subtitle: 'Trending styles chosen by thousands',
    isActive: true,
    displayOrder: 2,
    items: [],
  },
  {
    sectionKey: 'latest_products',
    title: 'Latest Arrivals',
    subtitle: 'Fresh new season silhouettes',
    isActive: true,
    displayOrder: 3,
    items: [],
  },
  {
    sectionKey: 'featured_products',
    title: 'Featured Collection',
    subtitle: 'Handpicked handcrafted perfection',
    isActive: true,
    displayOrder: 4,
    items: [],
  },
];

export async function GET() {
  try {
    await connectDB();

    let sections = await HomeSection.find().sort({ displayOrder: 1 }).lean();

    // If database has no sections yet, initialize default sections
    if (!sections || sections.length === 0) {
      for (const def of DEFAULT_SECTIONS) {
        await HomeSection.findOneAndUpdate(
          { sectionKey: def.sectionKey },
          { $setOnInsert: def },
          { upsert: true, new: true }
        );
      }
      sections = await HomeSection.find().sort({ displayOrder: 1 }).lean();
    } else {
      // Ensure all 4 keys exist
      for (const def of DEFAULT_SECTIONS) {
        if (!sections.some((s) => s.sectionKey === def.sectionKey)) {
          await HomeSection.create(def);
        }
      }
      sections = await HomeSection.find().sort({ displayOrder: 1 }).lean();
    }

    return NextResponse.json({
      success: true,
      sections,
    });
  } catch (error: any) {
    console.error('Error fetching home sections:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch home sections' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { sectionKey, title, subtitle, isActive, displayOrder, items } = body;

    if (!sectionKey) {
      return NextResponse.json(
        { success: false, error: 'Section key is required' },
        { status: 400 }
      );
    }

    // Limit to max 10 items
    const sanitizedItems = Array.isArray(items) ? items.slice(0, 10) : [];

    const updated = await HomeSection.findOneAndUpdate(
      { sectionKey },
      {
        $set: {
          title: title || 'Curated Showcase',
          subtitle: subtitle || '',
          isActive: typeof isActive === 'boolean' ? isActive : true,
          displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
          items: sanitizedItems,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      section: updated,
      message: 'Home section saved successfully',
    });
  } catch (error: any) {
    console.error('Error updating home section:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update home section' },
      { status: 500 }
    );
  }
}
