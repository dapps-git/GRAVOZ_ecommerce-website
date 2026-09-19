import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Coupon } from '@/models/Coupon';
import { Order } from '@/models/Order';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, cartTotal, email, phone, customerId } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();
    const total = Number(cartTotal) || 0;

    await connectDB();

    // ── 1. 1-Time Welcome Offer Rule for FIRSTSTEP (₹250 OFF) ──
    if (cleanCode === 'FIRSTSTEP') {
      const queryOr: any[] = [];
      if (email && typeof email === 'string' && email.trim()) {
        queryOr.push({ customerEmail: email.toLowerCase().trim() });
      }
      if (phone && typeof phone === 'string' && phone.trim()) {
        const digitsOnly = phone.replace(/\D/g, '').slice(-10);
        if (digitsOnly) {
          queryOr.push({ customerPhone: { $regex: digitsOnly + '$' } });
        }
      }
      if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
        queryOr.push({ customerId: customerId });
      }

      if (queryOr.length > 0) {
        const alreadyUsed = await Order.findOne({
          $or: queryOr,
          couponCode: { $regex: /^FIRSTSTEP$/i },
          orderStatus: { $ne: 'cancelled' },
        });

        if (alreadyUsed) {
          return NextResponse.json(
            { error: 'You have already redeemed the FIRSTSTEP welcome offer on a previous order.' },
            { status: 400 }
          );
        }
      }

      // Find in DB or fallback to ₹250 welcome offer
      const dbCoupon = await Coupon.findOne({ code: 'FIRSTSTEP', isActive: true });
      const discountValue = dbCoupon ? dbCoupon.value : 250;
      const minPurchase = dbCoupon ? dbCoupon.minPurchaseAmount : 0;

      if (total < minPurchase) {
        return NextResponse.json(
          { error: `Minimum purchase of ₹${minPurchase} required for FIRSTSTEP` },
          { status: 400 }
        );
      }

      const discountAmount = Math.min(discountValue, total);

      return NextResponse.json({
        success: true,
        discountAmount,
        coupon: {
          code: 'FIRSTSTEP',
          type: 'fixed_amount',
          value: discountValue,
          description: `₹${discountValue} OFF Welcome Offer`,
        },
      });
    }

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

    // ── 2. Database Coupons Validation ──
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

    return NextResponse.json(
      { error: 'Invalid or expired coupon code. Try FIRSTSTEP for ₹250 off your first order!' },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Validation error' }, { status: 500 });
  }
}
