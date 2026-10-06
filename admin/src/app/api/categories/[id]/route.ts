import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import { invalidateCache } from '@/lib/redis';

// GET /api/categories/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    await connectDB();
    const category = await Category.findById(id).lean();
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch category' }, { status: 500 });
  }
}

// PUT /api/categories/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    await connectDB();
    const body = await req.json();
    const { name, targetAudience, image, discountPercentage, subCategories, displayOrder, isActive } = body;

    const updateData: Record<string, any> = {};
    if (name !== undefined) {
      updateData.name = name.trim();
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
    if (image !== undefined) updateData.image = image;
    if (discountPercentage !== undefined) updateData.discountPercentage = Number(discountPercentage) || 0;
    if (subCategories !== undefined) updateData.subCategories = Array.isArray(subCategories) ? subCategories : [];
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder) || 0;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    await invalidateCache('categories:all');
    return NextResponse.json({ success: true, category: updated });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/categories/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    await connectDB();
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    await invalidateCache('categories:all');
    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to delete category' }, { status: 500 });
  }
}
