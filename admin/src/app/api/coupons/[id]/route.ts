import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Coupon } from '@/models/Coupon';

// PUT /api/coupons/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const updateData: any = {};
    if (body.code) updateData.code = body.code.toUpperCase().trim();
    if (body.type) updateData.type = body.type;
    if (body.value !== undefined) updateData.value = Number(body.value);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.minPurchaseAmount !== undefined) updateData.minPurchaseAmount = Number(body.minPurchaseAmount);
    if (body.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null;
    if (body.totalUsageLimit !== undefined) updateData.totalUsageLimit = Number(body.totalUsageLimit);
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.expiryDate) updateData.expiryDate = new Date(body.expiryDate);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const updated = await Coupon.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon: updated });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to update coupon' }, { status: 500 });
  }
}

// DELETE /api/coupons/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to delete coupon' }, { status: 500 });
  }
}
