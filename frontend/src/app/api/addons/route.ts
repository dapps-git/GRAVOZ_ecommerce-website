import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Addon } from '@/models/Addon';

/**
 * GET /api/addons
 * Public endpoint to fetch active add-ons.
 * Query: ?category=shoes (or 'all', 'formal', 'casual', 'sports', 'sandals', 'boots', 'babies')
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';

    // Match addons that apply to 'all' OR match the specific category
    const query: Record<string, any> = {
      isActive: true,
    };

    if (category !== 'all') {
      query.applicableCategories = { $in: [category.toLowerCase(), 'all'] };
    }

    const count = await Addon.countDocuments();
    if (count === 0) {
      await Addon.create([
        {
          name: 'Extra Laces',
          description: 'Durable & stylish laces',
          price: 22,
          imageUrl: '/images/addons/extra-laces.jpg',
          sku: 'ADDON-LACES-01',
          stock: 500,
          applicableCategories: ['all'],
          isActive: true,
          displayOrder: 1,
        },
        {
          name: 'Shoe Polish Kit',
          description: 'Keep your shoes fresh & shiny',
          price: 100,
          imageUrl: '/images/addons/shoe-polish-kit.jpg',
          sku: 'ADDON-POLISH-01',
          stock: 500,
          applicableCategories: ['all'],
          isActive: true,
          displayOrder: 2,
        },
      ]);
    }

    const addons = await Addon.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .select('_id name description price imageUrl sku stock applicableCategories displayOrder')
      .lean();

    return NextResponse.json({
      success: true,
      addons,
    });
  } catch (err: any) {
    console.error('Addons public fetch error:', err);
    return NextResponse.json(
      { success: false, addons: [], error: err.message || 'Failed to fetch addons' },
      { status: 500 }
    );
  }
}
