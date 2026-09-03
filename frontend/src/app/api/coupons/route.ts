import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Coupon } from '@/models/Coupon';

export interface CouponItem {
  code: string;
  type: string;
  value: number;
  description: string;
  minPurchaseAmount: number;
  maxDiscountAmount?: number | null;
}

export async function GET() {
  try {
    await connectDB();
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gte: now },
    })
      .select('code type value description minPurchaseAmount maxDiscountAmount')
      .sort({ createdAt: -1 })
      .lean();

    const result: CouponItem[] = coupons.map((c: any) => ({
      code: c.code,
      type: c.type,
      value: c.value,
      description:
        c.description ||
        (c.type === 'percentage'
          ? `Get ${c.value}% OFF on your order`
          : c.type === 'fixed_amount'
          ? `Flat ₹${c.value} OFF`
          : 'Free Shipping'),
      minPurchaseAmount: c.minPurchaseAmount || 0,
      maxDiscountAmount: c.maxDiscountAmount || null,
    }));

    return NextResponse.json(
      { success: true, coupons: result },
      {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
      }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Failed to fetch real coupons from DB:', err);
    return NextResponse.json({ success: true, coupons: [] });
  }
}
