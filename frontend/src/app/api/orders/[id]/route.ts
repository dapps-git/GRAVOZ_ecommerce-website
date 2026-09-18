import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Customer } from '@/models/Customer';
import { Referral } from '@/models/Referral';
import { ReturnRefund } from '@/models/ReturnRefund';

// GET /api/orders/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    let order = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      order = await Order.findById(id).lean();
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id }).lean();
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('Fetch single order error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch order' }, { status: 500 });
  }
}

// PATCH /api/orders/[id] — cancel or request return
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status: inputStatus, action, note, location, returnReason, returnDescription, returnImages } = body;
    const status = inputStatus || (action === 'cancel' ? 'cancelled' : undefined);

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    await connectDB();

    let order = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const cancellableStatuses = ['ordered', 'confirmed', 'processing'];
    const returnableStatuses = ['delivered'];

    if (status === 'cancelled' && !cancellableStatuses.includes(order.orderStatus)) {
      return NextResponse.json({ error: 'Order cannot be cancelled at this stage' }, { status: 400 });
    }
    if (status === 'return_requested' && !returnableStatuses.includes(order.orderStatus)) {
      return NextResponse.json({ error: 'Return can only be requested after delivery' }, { status: 400 });
    }

    order.orderStatus = status;

    // Handle referral discount restoration or reward revocation on cancellation/refund
    if (status === 'cancelled' || status === 'refunded') {
      try {
        const customerLookup =
          order.customerId && mongoose.Types.ObjectId.isValid(order.customerId)
            ? { _id: order.customerId }
            : { email: order.customerEmail.toLowerCase().trim() };

        // 1. If customer used ₹100 referral discount on this order, restore their balance
        if (order.referralDiscountType === 'referrer_reward_100') {
          await Customer.findOneAndUpdate(customerLookup, {
            $inc: { referralDiscountBalance: 100 },
          });
          await Referral.findOneAndUpdate(
            { referrerOrderId: order._id },
            { referrerDiscountUsed: false, referrerOrderId: null }
          );
        }

        // 2. If customer used 15% first order discount, restore eligibility
        if (order.referralDiscountType === 'referred_first_order_15') {
          await Customer.findOneAndUpdate(customerLookup, {
            hasUsedReferralDiscount: false,
          });
          await Referral.findOneAndUpdate(
            { referredOrderId: order._id },
            { referredDiscountUsed: false, referredOrderId: null }
          );
        }

        // 3. If this order generated a ₹100 reward for the referrer and referrer hasn't used it yet, revoke it
        const pendingOrCompletedRef = await Referral.findOne({
          referredOrderId: order._id,
          referrerDiscountAvailable: true,
          referrerDiscountUsed: false,
        });

        if (pendingOrCompletedRef) {
          await Customer.findByIdAndUpdate(pendingOrCompletedRef.referrer, {
            $inc: { referralDiscountBalance: -100 },
          });
          pendingOrCompletedRef.referrerDiscountAvailable = false;
          pendingOrCompletedRef.status = 'cancelled';
          await pendingOrCompletedRef.save();
        }
      } catch (revErr) {
        console.warn('Referral discount reversal warning:', revErr);
      }
    }

    if (status === 'return_requested') {
      order.returnDetails = {
        reason: returnReason || 'Return requested by customer',
        description: returnDescription || '',
        images: Array.isArray(returnImages) ? returnImages : [],
        status: 'return_requested',
        requestedAt: new Date(),
      };

      // Also upsert into ReturnRefund collection for Admin Return Management
      try {
        await ReturnRefund.findOneAndUpdate(
          { order: order._id },
          {
            $set: {
              order: order._id,
              orderNumber: order.orderNumber,
              customerName: order.customerName || order.shippingAddress?.name || 'Customer',
              customerEmail: order.customerEmail || 'customer@gravoz.com',
              customerPhone: order.customerPhone || order.shippingAddress?.phone || '',
              reason: returnReason || 'Other Reason',
              description: returnDescription || '',
              images: Array.isArray(returnImages) ? returnImages : [],
              refundAmount: order.totalAmount || 0,
              status: 'return_requested',
            },
          },
          { upsert: true, new: true }
        );
      } catch (rrErr) {
        console.error('Error upserting ReturnRefund record:', rrErr);
      }
    }

    if (location !== undefined && location.trim()) {
      order.currentLocation = location.trim();
    }

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      location: location ? location.trim() : (order.currentLocation || ''),
      note: note || returnReason || `Status updated to ${status}`,
    });

    await order.save();

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('Update order error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update order' }, { status: 500 });
  }
}
