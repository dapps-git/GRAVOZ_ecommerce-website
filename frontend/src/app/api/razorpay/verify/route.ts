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
import { verifyRazorpaySignature, getRazorpayInstance } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getUserSession();
    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerId,
      customerEmail: rawEmail,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      subtotal,
      discountAmount,
      referralDiscountType,
      referralDiscountAmount,
      couponCode,
      shippingFee,
      totalAmount,
      paymentMethod,
    } = body;

    // 1. Validate required Razorpay signature fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay payment identification or signature' },
        { status: 400 }
      );
    }

    // 2. Cryptographic timing-safe signature verification
    const isValidSignature = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      console.error('❌ Razorpay signature verification failed for:', {
        razorpay_order_id,
        razorpay_payment_id,
      });
      return NextResponse.json(
        { error: 'Payment signature verification failed. Fraud attempt or invalid transaction.' },
        { status: 400 }
      );
    }

    // 3. Idempotency Check: Check if an order already exists for this payment
    const existingOrder = await Order.findOne({
      $or: [
        { razorpayPaymentId: razorpay_payment_id },
        { razorpayOrderId: razorpay_order_id },
      ],
    });
    if (existingOrder) {
      return NextResponse.json({
        success: true,
        order: existingOrder,
        message: 'Order already processed',
      });
    }

    // 4. Resolve customer info
    const customerEmail = (session?.email || rawEmail || '').toLowerCase().trim();
    const verifiedCustomerId =
      session?.userId ||
      (customerId && mongoose.Types.ObjectId.isValid(customerId) ? customerId : undefined);

    const customerQuery = verifiedCustomerId
      ? { _id: verifiedCustomerId }
      : { email: customerEmail };

    let orderingCustomer = await Customer.findOne(customerQuery);

    // 5. Fetch extended payment details from Razorpay SDK
    let paymentDetails: Record<string, any> = {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    };
    let resolvedMethod = paymentMethod || 'UPI';

    const razorpay = getRazorpayInstance();
    if (razorpay) {
      try {
        const paymentInfo: any = await razorpay.payments.fetch(razorpay_payment_id);
        if (paymentInfo) {
          paymentDetails = {
            ...paymentDetails,
            method: paymentInfo.method,
            bank: paymentInfo.bank,
            wallet: paymentInfo.wallet,
            vpa: paymentInfo.vpa,
            email: paymentInfo.email,
            contact: paymentInfo.contact,
            fee: paymentInfo.fee ? paymentInfo.fee / 100 : undefined,
            tax: paymentInfo.tax ? paymentInfo.tax / 100 : undefined,
            status: paymentInfo.status,
          };

          if (paymentInfo.method === 'upi') resolvedMethod = 'UPI';
          else if (paymentInfo.method === 'card') resolvedMethod = 'Card';
          else if (paymentInfo.method === 'netbanking') resolvedMethod = 'NetBanking';
          else if (paymentInfo.method === 'wallet') resolvedMethod = 'Wallet';
        }
      } catch (fetchErr) {
        console.warn('Could not fetch detailed payment info from Razorpay API:', fetchErr);
      }
    }

    // 6. Address Sanitization
    const cleanPostalCode =
      (typeof shippingAddress?.postalCode === 'string' && shippingAddress.postalCode.trim()) ||
      (shippingAddress?.pinCode && String(shippingAddress.pinCode).trim()) ||
      (shippingAddress?.pincode && String(shippingAddress.pincode).trim()) ||
      (typeof shippingAddress?.street === 'string' &&
        (shippingAddress.street.match(/\b\d{6}\b/) || [])[0]) ||
      '';

    const sanitizedAddress = {
      name: shippingAddress?.name || customerName || 'Customer',
      phone: shippingAddress?.phone || customerPhone || '',
      street: shippingAddress?.street || shippingAddress?.address || '',
      city: shippingAddress?.city || '',
      state: shippingAddress?.state || '',
      postalCode: cleanPostalCode,
      country: shippingAddress?.country || 'India',
    };

    // 7. Generate unique human-readable order number
    const orderNumber =
      'GRV-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    // 8. Create Order Document in MongoDB
    const newOrder = await Order.create({
      orderNumber,
      customerId: verifiedCustomerId || (orderingCustomer ? orderingCustomer._id.toString() : ''),
      customerEmail,
      customerName: customerName || sanitizedAddress.name,
      customerPhone: customerPhone || sanitizedAddress.phone,
      shippingAddress: sanitizedAddress,
      items,
      subtotal: Number(subtotal) || 0,
      discountAmount: Number(discountAmount) || 0,
      referralDiscountAmount: Number(referralDiscountAmount) || 0,
      referralDiscountType: referralDiscountType || null,
      referralCodeUsed: orderingCustomer?.referralCodeUsed || '',
      couponCode: couponCode || '',
      shippingFee: Number(shippingFee) || 0,
      totalAmount: Number(totalAmount) || 0,
      paymentMethod: resolvedMethod,
      paymentStatus: 'paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentDetails,
      orderStatus: 'ordered',
      estimatedDelivery,
      statusHistory: [
        {
          status: 'ordered',
          timestamp: new Date(),
          note: `Payment verified successfully via Razorpay (${resolvedMethod}). Payment ID: ${razorpay_payment_id}`,
        },
      ],
    });

    // 9. Update Referral States & Decrement Referrer Balance if Used
    try {
      if (orderingCustomer) {
        if (referralDiscountType === 'referred_first_order_15') {
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
        } else if (referralDiscountType === 'referrer_reward_100') {
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
        orderingCustomer.totalSpent = (orderingCustomer.totalSpent || 0) + (Number(totalAmount) || 0);
        orderingCustomer.activityLogs.push({
          action: 'Order Placed (Razorpay Paid)',
          details: `Order #${orderNumber} for ₹${totalAmount} paid via Razorpay (ID: ${razorpay_payment_id})`,
          timestamp: new Date(),
        });
        await orderingCustomer.save();
      }
    } catch (custErr) {
      console.warn('Customer referral discount update warning:', custErr);
    }

    // 10. Reward Original Referrer with ₹100 on Completed First Purchase
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

    // 11. Increment coupon usage
    try {
      if (couponCode) {
        await Coupon.updateOne(
          { code: couponCode.toUpperCase().trim() },
          { $inc: { usedCount: 1 } }
        );
      }
    } catch {}

    // 12. Clear Cart
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

    // 13. Atomic stock decrement
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

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: 'Payment verified and order created successfully',
    });
  } catch (error: any) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
