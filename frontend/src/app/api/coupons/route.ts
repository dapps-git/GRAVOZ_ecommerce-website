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
      .limit(20)
      .lean();

    const result: CouponItem[] = coupons.map((c: any) => ({
      code: c.code,
      type: c.type,
      value: c.value,
      description: c.description || (c.type === 'percentage' ? `Get ${c.value}% OFF on your order` : `Flat ₹${c.value} OFF`),
      minPurchaseAmount: c.minPurchaseAmount || 0,
      maxDiscountAmount: c.maxDiscountAmount || null,
    }));

    // Ensure built-in coupons appear
    const builtIn: CouponItem[] = [
      { code: 'GRAVOZ10', type: 'percentage', value: 10, description: 'Get 10% OFF on your order', minPurchaseAmount: 999, maxDiscountAmount: null },
      { code: 'GRAVOZ20', type: 'percentage', value: 20, description: 'Get 20% OFF on your order', minPurchaseAmount: 1999, maxDiscountAmount: null },
      { code: 'SAVE100', type: 'fixed_amount', value: 100, description: 'Flat ₹100 OFF', minPurchaseAmount: 799, maxDiscountAmount: null },
      { code: 'FREESHIP', type: 'free_shipping', value: 0, description: 'Free Shipping on your order', minPurchaseAmount: 499, maxDiscountAmount: null },
      { code: 'NEW200', type: 'fixed_amount', value: 200, description: 'Flat ₹200 OFF', minPurchaseAmount: 1499, maxDiscountAmount: null },
    ];

    const codes = new Set(result.map((c) => c.code));
    for (const b of builtIn) {
      if (!codes.has(b.code)) result.push(b);
    }

    return NextResponse.json({ success: true, coupons: result }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60' },
    });
  } catch {
    // Return built-in fallback
    return NextResponse.json({
      success: true,
      coupons: [
        { code: 'GRAVOZ10', type: 'percentage', value: 10, description: 'Get 10% OFF on your order', minPurchaseAmount: 999, maxDiscountAmount: null },
        { code: 'GRAVOZ20', type: 'percentage', value: 20, description: 'Get 20% OFF on your order', minPurchaseAmount: 1999, maxDiscountAmount: null },
        { code: 'SAVE100', type: 'fixed_amount', value: 100, description: 'Flat ₹100 OFF', minPurchaseAmount: 799, maxDiscountAmount: null },
        { code: 'FREESHIP', type: 'free_shipping', value: 0, description: 'Free Shipping on your order', minPurchaseAmount: 499, maxDiscountAmount: null },
        { code: 'NEW200', type: 'fixed_amount', value: 200, description: 'Flat ₹200 OFF', minPurchaseAmount: 1499, maxDiscountAmount: null },
      ],
    });
  }
}
