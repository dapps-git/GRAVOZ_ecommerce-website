import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Coupon } from '@/models/Coupon';

// GET /api/coupons
export async function GET() {
  try {
    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, coupons });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch coupons' }, { status: 500 });
  }
}

// POST /api/coupons
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      code,
      type,
      value,
      description,
      minPurchaseAmount,
      maxDiscountAmount,
      totalUsageLimit,
      startDate,
      expiryDate,
      isActive,
    } = body;

    if (!code || value === undefined || !expiryDate) {
      return NextResponse.json(
        { error: 'Coupon code, discount value, and expiry date are required' },
        { status: 400 }
      );
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return NextResponse.json({ error: `Coupon code "${cleanCode}" already exists` }, { status: 400 });
    }

    const newCoupon = await Coupon.create({
      code: cleanCode,
      type: type || 'percentage',
      value: Number(value),
      description: description || '',
      minPurchaseAmount: Number(minPurchaseAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      totalUsageLimit: Number(totalUsageLimit) || 100,
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: new Date(expiryDate),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to create coupon' }, { status: 500 });
  }
}
