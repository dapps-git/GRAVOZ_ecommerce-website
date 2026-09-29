import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { Customer } from '@/models/Customer';
import { Coupon } from '@/models/Coupon';
import { Referral } from '@/models/Referral';
import { Order } from '@/models/Order';
import { getUserSession } from '@/lib/auth';
import { getRazorpayInstance, getRazorpayKeys } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getUserSession();
    const body = await req.json();

    const {
      customerId,
      customerEmail: rawEmail,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      subtotal,
      couponCode,
      referralDiscountType,
      shippingFee,
    } = body;

    const customerEmail = (session?.email || rawEmail || '').toLowerCase().trim();
    const verifiedCustomerId = session?.userId || (customerId && mongoose.Types.ObjectId.isValid(customerId) ? customerId : undefined);

    if (!customerEmail || !items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required order details' }, { status: 400 });
    }

    // 1. Verify item stock & calculate server-authoritative subtotal
    let verifiedSubtotal = 0;
    for (const itm of items) {
      if (itm.productId && mongoose.Types.ObjectId.isValid(itm.productId)) {
        const prod = await Product.findById(itm.productId).lean();
        if (!prod || (prod.stock !== undefined && prod.stock <= 0)) {
          return NextResponse.json(
            { error: `Item "${itm.name || (prod as any)?.name || 'Product'}" is currently out of stock.` },
            { status: 400 }
          );
        }
        const unitPrice = (prod as any).price !== undefined ? Number((prod as any).price) : Number(itm.price);
        verifiedSubtotal += unitPrice * (Number(itm.quantity) || 1);
      } else {
        verifiedSubtotal += (Number(itm.price) || 0) * (Number(itm.quantity) || 1);
      }
    }

    // 2. Fetch Customer for discounts check
    const customerQuery = verifiedCustomerId
      ? { _id: verifiedCustomerId }
      : { email: customerEmail };
    const orderingCustomer = await Customer.findOne(customerQuery);

    // 3. Verify Coupon Discount
    let verifiedCouponDiscount = 0;
    if (couponCode) {
      const cleanCoupon = couponCode.toUpperCase().trim();
      if (cleanCoupon === 'FIRSTSTEP') {
        if (orderingCustomer) {
          if (orderingCustomer.referredBy || orderingCustomer.referralCodeUsed) {
            return NextResponse.json(
              { error: 'Referral accounts receive a 15% first-order discount and are not eligible for the FIRSTSTEP coupon.' },
              { status: 400 }
            );
          }
          if ((orderingCustomer.totalOrders || 0) > 0) {
            return NextResponse.json(
              { error: 'The FIRSTSTEP welcome coupon is only valid on your first order.' },
              { status: 400 }
            );
          }
        }
        const dbCoupon = await Coupon.findOne({ code: 'FIRSTSTEP', isActive: true });
        const val = dbCoupon ? dbCoupon.value : 250;
        const minReq = dbCoupon ? dbCoupon.minPurchaseAmount : 0;
        if (verifiedSubtotal >= minReq) {
          verifiedCouponDiscount = Math.min(val, verifiedSubtotal);
        }
      } else if (cleanCoupon === 'STYLE20') {
        verifiedCouponDiscount = Math.round(verifiedSubtotal * 0.2);
      } else {
        const dbCoupon = await Coupon.findOne({
          code: cleanCoupon,
          isActive: true,
          expiryDate: { $gte: new Date() },
        });
        if (dbCoupon && dbCoupon.usedCount < dbCoupon.totalUsageLimit && verifiedSubtotal >= dbCoupon.minPurchaseAmount) {
          if (dbCoupon.type === 'percentage') {
            let disc = Math.round((verifiedSubtotal * dbCoupon.value) / 100);
            if (dbCoupon.maxDiscountAmount) disc = Math.min(disc, dbCoupon.maxDiscountAmount);
            verifiedCouponDiscount = disc;
          } else {
            verifiedCouponDiscount = Math.min(dbCoupon.value, verifiedSubtotal);
          }
        }
      }
    }

    // 4. Verify Referral Discount
    let verifiedReferralDiscount = 0;
    if (referralDiscountType === 'referred_first_order_15') {
      if (
        orderingCustomer &&
        (orderingCustomer.referredBy || orderingCustomer.referralCodeUsed) &&
        !orderingCustomer.hasUsedReferralDiscount &&
        (orderingCustomer.totalOrders || 0) === 0
      ) {
        verifiedReferralDiscount = Math.round(verifiedSubtotal * 0.15);
        verifiedCouponDiscount = 0; // exclusive
      }
    } else if (referralDiscountType === 'referrer_reward_100') {
      if (orderingCustomer && (orderingCustomer.referralDiscountBalance || 0) >= 100) {
        const eligibleReturnableItems = items.filter((itm: any) => !itm.noReturnRefundExchange);
        const eligibleSubtotal = eligibleReturnableItems.reduce(
          (acc: number, itm: any) => acc + (Number(itm.price) || 0) * (Number(itm.quantity) || 1),
          0
        );
        if (eligibleSubtotal > 0) {
          const maxApplicable = Math.max(0, eligibleSubtotal - verifiedCouponDiscount);
          verifiedReferralDiscount = Math.min(100, maxApplicable);
        }
      }
    }

    const numShippingFee = Number(shippingFee) || 0;
    const verifiedTotal = Math.max(0, verifiedSubtotal - verifiedCouponDiscount - verifiedReferralDiscount + numShippingFee);

    // Minimum amount check for Razorpay (minimum ₹1 = 100 paise)
    if (verifiedTotal <= 0) {
      return NextResponse.json({
        error: 'Order amount must be greater than zero for online payment.',
      }, { status: 400 });
    }

    const { keyId, keySecret } = getRazorpayKeys();
    const razorpay = getRazorpayInstance();

    if (!razorpay || !keyId || !keySecret || keyId.includes('placeholder') || keySecret.includes('placeholder')) {
      return NextResponse.json(
        {
          error: 'Razorpay keys are not yet configured. Please paste your valid Razorpay Key ID and Secret in .env.local',
        },
        { status: 400 }
      );
    }

    const receipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 1000)}`;
    const amountInPaise = Math.round(verifiedTotal * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        customerEmail,
        customerName: customerName || shippingAddress.name || 'Customer',
        customerPhone: customerPhone || shippingAddress.phone || '',
        itemCount: items.length.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
      verifiedTotal,
      prefill: {
        name: customerName || shippingAddress.name || 'Customer',
        email: customerEmail,
        contact: customerPhone || shippingAddress.phone || '',
      },
    });
  } catch (error: any) {
    console.error('Razorpay create order error:', error);
    return NextResponse.json(
      { error: error?.error?.description || error?.message || 'Failed to initialize Razorpay order' },
      { status: 500 }
    );
  }
}
