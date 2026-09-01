import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Coupon } from '@/models/Coupon';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, cartTotal } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();
    const total = Number(cartTotal) || 0;

    // Hardcoded special promo coupon support
    if (cleanCode === 'STYLE20') {
      const discountAmount = Math.round(total * 0.2);
      return NextResponse.json({
        success: true,
        discountAmount,
        coupon: {
          code: 'STYLE20',
          type: 'percentage',
          value: 20,
          description: '20% off on all footwear',
        },
      });
    }

    try {
      await connectDB();
      const coupon = await Coupon.findOne({
        code: cleanCode,
        isActive: true,
        expiryDate: { $gte: new Date() },
      });

      if (coupon) {
        if (coupon.usedCount >= coupon.totalUsageLimit) {
          return NextResponse.json({ error: 'Coupon usage limit has been reached' }, { status: 400 });
        }

        if (total < coupon.minPurchaseAmount) {
          return NextResponse.json(
            { error: `Minimum purchase of ₹${coupon.minPurchaseAmount} required for this coupon` },
            { status: 400 }
          );
        }

        let discountAmount = 0;
        if (coupon.type === 'percentage') {
          discountAmount = Math.round((total * coupon.value) / 100);
          if (coupon.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
          }
        } else if (coupon.type === 'fixed_amount') {
          discountAmount = Math.min(coupon.value, total);
        }

        return NextResponse.json({
          success: true,
          discountAmount,
          coupon: {
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            description: `${coupon.type === 'percentage' ? coupon.value + '% off' : '₹' + coupon.value + ' off'}`,
          },
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ error: 'Invalid or expired coupon code. Try STYLE20 for 20% off.' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Validation error' }, { status: 500 });
  }
}
