import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Addon } from '@/models/Addon';

// GET /api/addons/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const addon = await Addon.findById(id).lean();
    if (!addon) return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    return NextResponse.json({ success: true, addon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch addon' }, { status: 500 });
  }
}

// PUT /api/addons/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await req.json();

    // Normalize sku to uppercase if provided
    if (body.sku) body.sku = body.sku.trim().toUpperCase();

    const updated = await Addon.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updated) return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    return NextResponse.json({ success: true, addon: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update addon' }, { status: 500 });
  }
}

// DELETE /api/addons/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await Addon.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Addon deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete addon' }, { status: 500 });
  }
}
