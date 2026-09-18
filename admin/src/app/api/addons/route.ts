import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Addon } from '@/models/Addon';

// GET /api/addons - List all addons (admin)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');
    const category = searchParams.get('category');

    const query: Record<string, any> = {};
    if (isActive === 'true') query.isActive = true;
    if (isActive === 'false') query.isActive = false;
    if (category && category !== 'all') {
      query.applicableCategories = { $in: [category, 'all'] };
    }

    const addons = await Addon.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, addons });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch addons' },
      { status: 500 }
    );
  }
}

// POST /api/addons - Create new addon (admin)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, description, price, imageUrl, sku, stock, applicableCategories, isActive, displayOrder } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Addon name is required' }, { status: 400 });
    }
    if (!sku || !sku.trim()) {
      return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }

    const existing = await Addon.findOne({ sku: sku.trim().toUpperCase() });
    if (existing) {
      return NextResponse.json({ error: `SKU "${sku}" already exists` }, { status: 400 });
    }

    const addon = await Addon.create({
      name: name.trim(),
      description: description?.trim() || '',
      price: Number(price),
      imageUrl: imageUrl?.trim() || '',
      sku: sku.trim().toUpperCase(),
      stock: stock !== undefined ? Number(stock) : 99999,
      applicableCategories: Array.isArray(applicableCategories) && applicableCategories.length > 0
        ? applicableCategories
        : ['all'],
      isActive: isActive !== false,
      displayOrder: Number(displayOrder) || 0,
    });

    return NextResponse.json({ success: true, addon }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create addon' },
      { status: 500 }
    );
  }
}
