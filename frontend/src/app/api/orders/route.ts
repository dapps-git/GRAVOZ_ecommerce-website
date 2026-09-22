import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Customer } from '@/models/Customer';
import { Cart } from '@/models/Cart';
import { Product } from '@/models/Product';
import { Referral } from '@/models/Referral';
import { Coupon } from '@/models/Coupon';
import { getUserSession } from '@/lib/auth';

// GET /api/orders - Securely fetch orders for authenticated customer
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email');
    const customerIdParam = searchParams.get('customerId');

    await connectDB();

    // Enforce authorization: if logged in, enforce matching session user; otherwise require email/customerId query
    let query: Record<string, any> = {};

    if (session) {
      // Logged-in user: only allow viewing their own orders
      query = {
        $or: [
          { customerId: session.userId },
          { customerEmail: session.email.toLowerCase().trim() },
        ],
      };
    } else if (emailParam) {
      query.customerEmail = emailParam.toLowerCase().trim();
    } else if (customerIdParam && mongoose.Types.ObjectId.isValid(customerIdParam)) {
      query.customerId = customerIdParam;
    } else {
      return NextResponse.json(
        { error: 'Authentication required to view orders' },
        { status: 401 }
      );
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    console.error('Fetch orders error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders (Place Order)
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
      discountAmount,
      couponCode,
      shippingFee,
      totalAmount,
      paymentMethod,
      referralDiscountType,
    } = body;

    // Determine secure customer email and ID (prefer verified session if present)
    const customerEmail = (session?.email || rawEmail || '').toLowerCase().trim();
    const verifiedCustomerId = session?.userId || (customerId && mongoose.Types.ObjectId.isValid(customerId) ? customerId : undefined);

    if (!customerEmail || !items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required order details' }, { status: 400 });
    }

    // Verify all items exist and are in stock
    for (const itm of items) {
      if (itm.productId && mongoose.Types.ObjectId.isValid(itm.productId)) {
        const prod = await Product.findById(itm.productId).lean();
        if (!prod || (prod.stock !== undefined && prod.stock <= 0)) {
          return NextResponse.json(
            { error: `Item "${itm.name || prod?.name || 'Product'}" is currently out of stock.` },
            { status: 400 }
          );
        }
      }
    }

    const customerQuery = verifiedCustomerId
      ? { _id: verifiedCustomerId }
      : { email: customerEmail };

    let orderingCustomer = await Customer.findOne(customerQuery);

    // ── Backend Validation of Coupon Discount (Server Source of Truth) ──
    let verifiedCouponDiscount = 0;
    const numSubtotal = Number(subtotal) || 0;

    if (couponCode) {
      const cleanCoupon = couponCode.toUpperCase().trim();
      if (cleanCoupon === 'FIRSTSTEP') {
        // Disallow FIRSTSTEP for referral customers (they receive 15% referral discount instead)
        if (orderingCustomer) {
          if (orderingCustomer.referredBy || orderingCustomer.referralCodeUsed) {
            return NextResponse.json(
              { error: 'Referral accounts receive a 15% first-order discount and are not eligible for the FIRSTSTEP welcome coupon.' },
              { status: 400 }
            );
          }
          if ((orderingCustomer.totalOrders || 0) > 0) {
            return NextResponse.json(
              { error: 'The FIRSTSTEP welcome coupon is only valid on your first order.' },
              { status: 400 }
            );
          }

          const existingRef = await Referral.findOne({ referredUser: orderingCustomer._id });
          if (existingRef) {
            return NextResponse.json(
              { error: 'Referral accounts receive a 15% first-order discount and are not eligible for the FIRSTSTEP welcome coupon.' },
              { status: 400 }
            );
          }
        }

        const queryOr: any[] = [{ customerEmail }];
        if (customerPhone) {
          const digitsOnly = customerPhone.replace(/\D/g, '').slice(-10);
          if (digitsOnly) {
            queryOr.push({ customerPhone: { $regex: digitsOnly + '$' } });
          }
        }
        if (verifiedCustomerId) {
          queryOr.push({ customerId: verifiedCustomerId });
        }

        const alreadyUsed = await Order.findOne({
          $or: queryOr,
          couponCode: { $regex: /^FIRSTSTEP$/i },
          orderStatus: { $ne: 'cancelled' },
        });

        if (alreadyUsed) {
          return NextResponse.json(
            { error: 'The FIRSTSTEP welcome coupon has already been redeemed by this account.' },
            { status: 400 }
          );
        }

        const dbCoupon = await Coupon.findOne({ code: 'FIRSTSTEP', isActive: true });
        const val = dbCoupon ? dbCoupon.value : 250;
        const minReq = dbCoupon ? dbCoupon.minPurchaseAmount : 0;
        if (numSubtotal >= minReq) {
          verifiedCouponDiscount = Math.min(val, numSubtotal);
        }
      } else if (cleanCoupon === 'STYLE20') {
        verifiedCouponDiscount = Math.round(numSubtotal * 0.2);
      } else {
        const dbCoupon = await Coupon.findOne({
          code: cleanCoupon,
          isActive: true,
          expiryDate: { $gte: new Date() },
        });
        if (dbCoupon && dbCoupon.usedCount < dbCoupon.totalUsageLimit && numSubtotal >= dbCoupon.minPurchaseAmount) {
          if (dbCoupon.type === 'percentage') {
            let disc = Math.round((numSubtotal * dbCoupon.value) / 100);
            if (dbCoupon.maxDiscountAmount) disc = Math.min(disc, dbCoupon.maxDiscountAmount);
            verifiedCouponDiscount = disc;
          } else {
            verifiedCouponDiscount = Math.min(dbCoupon.value, numSubtotal);
          }
        }
      }
    }

    // ── Backend Validation of Referral Discount ──
    let verifiedReferralDiscount = 0;
    let verifiedReferralType: string | null = null;
    const numShippingFee = Number(shippingFee) || 0;

    if (referralDiscountType === 'referred_first_order_15') {
      if (
        orderingCustomer &&
        (orderingCustomer.referredBy || orderingCustomer.referralCodeUsed) &&
        !orderingCustomer.hasUsedReferralDiscount &&
        (orderingCustomer.totalOrders || 0) === 0
      ) {
        // Strict DB-level order count to guarantee single-use on first purchase
        const priorOrdersCount = await Order.countDocuments({
          $or: [
            { customerId: orderingCustomer._id.toString() },
            { customerEmail },
          ],
          orderStatus: { $ne: 'cancelled' },
        });

        const existingUsedRef = await Referral.findOne({
          referredUser: orderingCustomer._id,
          referredDiscountUsed: true,
        });

        if (priorOrdersCount === 0 && !existingUsedRef) {
          // Exactly 15% discount on subtotal
          verifiedReferralDiscount = Math.round(numSubtotal * 0.15);
          verifiedReferralType = 'referred_first_order_15';
          // On first referral order, the 15% referral discount is exclusive
          verifiedCouponDiscount = 0;
        }
      }
    } else if (referralDiscountType === 'referrer_reward_100') {
      if (orderingCustomer && (orderingCustomer.referralDiscountBalance || 0) >= 100) {
        // Exclude products marked as No Return • No Refund • No Exchange from referral cashback eligibility
        const eligibleReturnableItems = items.filter((itm: any) => !itm.noReturnRefundExchange);
        const eligibleSubtotal = eligibleReturnableItems.reduce(
          (acc: number, itm: any) => acc + (Number(itm.price) || 0) * (Number(itm.quantity) || 1),
          0
        );

        if (eligibleSubtotal > 0) {
          const maxApplicable = Math.max(0, eligibleSubtotal - verifiedCouponDiscount);
          verifiedReferralDiscount = Math.min(100, maxApplicable);
          if (verifiedReferralDiscount > 0) {
            verifiedReferralType = 'referrer_reward_100';
          }
        }
      }
    }

    // Backend Source of Truth calculation of final total
    const verifiedTotalAmount = Math.max(
      0,
      numSubtotal - verifiedCouponDiscount - verifiedReferralDiscount + numShippingFee
    );

    // Generate unique human-readable order number
    const orderNumber =
      'GRV-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const paymentStatus = paymentMethod === 'COD' ? 'pending' : 'paid';

    const cleanPostalCode =
      (typeof shippingAddress.postalCode === 'string' && shippingAddress.postalCode.trim()) ||
      (shippingAddress.pinCode && String(shippingAddress.pinCode).trim()) ||
      (shippingAddress.pincode && String(shippingAddress.pincode).trim()) ||
      (typeof shippingAddress.street === 'string' && (shippingAddress.street.match(/\b\d{6}\b/) || [])[0]) ||
      '';

    const sanitizedAddress = {
      name: shippingAddress.name || customerName || 'Customer',
      phone: shippingAddress.phone || customerPhone || '',
      street: shippingAddress.street || shippingAddress.address || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      postalCode: cleanPostalCode,
      country: shippingAddress.country || 'India',
    };

    const newOrder = await Order.create({
      orderNumber,
      customerId: verifiedCustomerId || (orderingCustomer ? orderingCustomer._id.toString() : ''),
      customerEmail,
      customerName: customerName || sanitizedAddress.name,
      customerPhone: customerPhone || sanitizedAddress.phone,
      shippingAddress: sanitizedAddress,
      items,
      subtotal: numSubtotal,
      discountAmount: verifiedCouponDiscount,
      referralDiscountAmount: verifiedReferralDiscount,
      referralDiscountType: verifiedReferralType,
      referralCodeUsed: orderingCustomer?.referralCodeUsed || '',
      couponCode: couponCode || '',
      shippingFee: numShippingFee,
      totalAmount: verifiedTotalAmount,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus,
      orderStatus: 'ordered',
      estimatedDelivery,
      statusHistory: [
        {
          status: 'ordered',
          timestamp: new Date(),
          note: `Order placed via ${paymentMethod || 'COD'}${verifiedReferralDiscount > 0 ? ` with ₹${verifiedReferralDiscount} referral discount` : ''}`,
        },
      ],
    });

    // ── Update Referral States & Decrement Referrer Balance if Used ──
    try {
      if (orderingCustomer) {
        if (verifiedReferralType === 'referred_first_order_15') {
          orderingCustomer.hasUsedReferralDiscount = true;
          await Customer.updateOne(
            { _id: orderingCustomer._id },
            { $set: { hasUsedReferralDiscount: true } }
          );
          await Referral.findOneAndUpdate(
            { referredUser: orderingCustomer._id },
            {
              referredDiscountUsed: true,
              referredOrderId: newOrder._id,
            }
          );
        } else if (verifiedReferralType === 'referrer_reward_100') {
          orderingCustomer.referralDiscountBalance = Math.max(
            0,
            (orderingCustomer.referralDiscountBalance || 0) - 100
          );
          await Customer.updateOne(
            { _id: orderingCustomer._id },
            { $inc: { referralDiscountBalance: -100 } }
          );
          await Referral.findOneAndUpdate(
            {
              referrer: orderingCustomer._id,
              referrerDiscountAvailable: true,
              referrerDiscountUsed: false,
            },
            {
              referrerDiscountUsed: true,
              referrerOrderId: newOrder._id,
            }
          );
        }

        orderingCustomer.totalOrders = (orderingCustomer.totalOrders || 0) + 1;
        orderingCustomer.totalSpent = (orderingCustomer.totalSpent || 0) + verifiedTotalAmount;
        orderingCustomer.activityLogs.push({
          action: 'Order Placed',
          details: `Order #${orderNumber} for ₹${verifiedTotalAmount}${verifiedReferralDiscount > 0 ? ` (Referral discount: ₹${verifiedReferralDiscount})` : ''}`,
          timestamp: new Date(),
        });
        await orderingCustomer.save();
      }
    } catch (custErr) {
      console.warn('Customer referral discount update warning:', custErr);
    }

    // ── Reward Original Referrer with ₹100 Discount on Completed First Purchase ──
    try {
      if (orderingCustomer) {
        const pendingReferral = await Referral.findOne({
          referredUser: orderingCustomer._id,
          referrerDiscountAvailable: false,
        });

        if (pendingReferral) {
          const referrerCust = await Customer.findById(pendingReferral.referrer);
          if (referrerCust) {
            referrerCust.referralDiscountBalance = (referrerCust.referralDiscountBalance || 0) + 100;
            referrerCust.activityLogs.push({
              action: 'Referral Discount Earned',
              details: `Earned ₹100 referral discount for friend order #${orderNumber}`,
              timestamp: new Date(),
            });
            await referrerCust.save();

            pendingReferral.referrerDiscountAvailable = true;
            pendingReferral.status = 'completed';
            pendingReferral.referredOrderId = newOrder._id;
            await pendingReferral.save();
          }
        }
      }
    } catch (refRewardErr) {
      console.warn('Referral reward credit warning:', refRewardErr);
    }

    // Increment coupon usage count if coupon was applied
    try {
      if (couponCode) {
        await Coupon.updateOne(
          { code: couponCode.toUpperCase().trim() },
          { $inc: { usedCount: 1 } }
        );
      }
    } catch {}

    // Clear cart for this user
    try {
      const guestIdCookie = req.cookies.get('gravoz_guest_id')?.value;
      if (guestIdCookie) {
        await Cart.deleteOne({ guestId: guestIdCookie });
      }
      if (verifiedCustomerId) {
        await Cart.deleteOne({ userId: verifiedCustomerId });
      }
    } catch (e) {
      console.warn('Cart clear warning:', e);
    }

    // Atomic product stock decrement
    try {
      for (const itm of items) {
        if (itm.productId && mongoose.Types.ObjectId.isValid(itm.productId)) {
          await Product.findByIdAndUpdate(itm.productId, {
            $inc: { stock: -Number(itm.quantity || 1) },
          });
        }
      }
    } catch (e) {
      console.warn('Stock decrement warning:', e);
    }

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
