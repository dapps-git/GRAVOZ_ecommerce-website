import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Customer } from '@/models/Customer';
import { Product } from '@/models/Product';
import { Referral } from '@/models/Referral';
import { ReturnRefund } from '@/models/ReturnRefund';
import { getUserSession } from '@/lib/auth';
import { syncReferralLifecycleOnStatusChange } from '@/lib/referral';
import { requestRazorpayRefund } from '@/lib/razorpay';

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
    const session = await getUserSession();
    const body = await req.json();
    const { status: inputStatus, action, note, location, returnReason, returnDescription, returnImages, customerEmail: rawEmail } = body;
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

    // Security check: verify caller ownership
    if (session) {
      const isOwner =
        (order.customerId && order.customerId.toString() === session.userId) ||
        (order.customerEmail && order.customerEmail.toLowerCase().trim() === session.email.toLowerCase().trim());
      if (!isOwner) {
        return NextResponse.json(
          { error: 'You are not authorized to modify this order.' },
          { status: 403 }
        );
      }
    } else if (rawEmail && typeof rawEmail === 'string' && rawEmail.trim()) {
      if (!order.customerEmail || order.customerEmail.toLowerCase().trim() !== rawEmail.toLowerCase().trim()) {
        return NextResponse.json(
          { error: 'Customer verification failed for this order.' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Authentication or verified customer email required to modify order.' },
        { status: 401 }
      );
    }

    const cancellableStatuses = ['ordered', 'confirmed', 'processing'];
    const returnableStatuses = ['delivered'];

    if (status === 'cancelled' && !cancellableStatuses.includes(order.orderStatus)) {
      return NextResponse.json({ error: 'Order cannot be cancelled at this stage' }, { status: 400 });
    }
    if (status === 'return_requested' && !returnableStatuses.includes(order.orderStatus)) {
      return NextResponse.json({ error: 'Return can only be requested after delivery' }, { status: 400 });
    }

    const previousOrderStatus = order.orderStatus;
    order.orderStatus = status;

    // Restore inventory when order is cancelled
    if (status === 'cancelled' && previousOrderStatus !== 'cancelled' && Array.isArray(order.items)) {
      try {
        for (const itm of order.items) {
          const itemAny = itm as any;
          const pid = itemAny.productId || itemAny.product || itemAny._id || itemAny.id;
          if (pid && mongoose.Types.ObjectId.isValid(pid)) {
            const qty = Number(itm.quantity || 1);
            const itemSize = String(itm.size || '').trim();
            const itemColor = String(itm.color || '').trim().toLowerCase();
            const prodDoc = await Product.findById(pid);
            if (prodDoc) {
              prodDoc.stock = (prodDoc.stock || 0) + qty;

              if (itemSize && Array.isArray(prodDoc.sizeAvailability)) {
                const sObj = prodDoc.sizeAvailability.find((s: any) => String(s.size).trim() === itemSize);
                if (sObj) {
                  sObj.stock = (sObj.stock || 0) + qty;
                  if (sObj.stock > 0) sObj.isAvailable = true;
                }
                prodDoc.markModified('sizeAvailability');
              }

              if (itemColor && Array.isArray(prodDoc.colorVariants)) {
                const vObj = prodDoc.colorVariants.find(
                  (v: any) => String(v.name || '').trim().toLowerCase() === itemColor
                );
                if (vObj) {
                  vObj.stock = (vObj.stock !== undefined ? vObj.stock : 0) + qty;
                  if (vObj.stock > 0) vObj.isAvailable = true;

                  if (itemSize && Array.isArray(vObj.sizes)) {
                    const vsObj = vObj.sizes.find((s: any) => String(s.size).trim() === itemSize);
                    if (vsObj) {
                      vsObj.stock = (vsObj.stock !== undefined ? vsObj.stock : 0) + qty;
                      if (vsObj.stock > 0) vsObj.isAvailable = true;
                    }
                  }
                }
                prodDoc.markModified('colorVariants');
              }

              await prodDoc.save();
            }
          }
        }
      } catch (restockErr) {
        console.warn('Order cancellation stock restore warning:', restockErr);
      }
    }

    // Handle automated UPI / Razorpay refund if an online order is cancelled
    if (status === 'cancelled') {
      const isOnlinePaid = order.paymentMethod !== 'COD' && order.paymentStatus === 'paid';
      const paymentId = order.razorpayPaymentId || (order as any).transactionId;
      const alreadyRefundedOrInitiated =
        order.paymentDetails?.refundId ||
        order.paymentStatus === 'refund_initiated' ||
        order.paymentStatus === 'refund_processing' ||
        order.paymentStatus === 'refunded';

      if (isOnlinePaid && paymentId && !alreadyRefundedOrInitiated) {
        const refundResult = await requestRazorpayRefund({
          paymentId,
          amountInRupees: order.totalAmount,
          notes: {
            orderNumber: order.orderNumber,
            reason: note || 'Order cancelled by customer before dispatch',
          },
        });

        if (refundResult.success && refundResult.refundId) {
          order.paymentStatus = 'refund_initiated';
          if (!order.paymentDetails) order.paymentDetails = {};
          order.paymentDetails.refundId = refundResult.refundId;
          order.paymentDetails.refundStatus = refundResult.status || 'initiated';
          order.paymentDetails.refundAmount = order.totalAmount;
          order.paymentDetails.refundInitiatedAt = new Date();
          order.markModified('paymentDetails');

          if (!order.statusHistory) order.statusHistory = [];
          order.statusHistory.push({
            status: 'cancelled',
            timestamp: new Date(),
            location: location ? location.trim() : (order.currentLocation || ''),
            note: `Order cancelled. UPI refund of ₹${order.totalAmount} initiated via Razorpay (Refund ID: ${refundResult.refundId}). Reversal to customer UPI-linked account typically takes 2–7 business days.`,
          });
        } else {
          console.error('[Razorpay Refund] Error during cancellation:', refundResult.error);
          order.paymentStatus = 'refund_failed';
          if (!order.paymentDetails) order.paymentDetails = {};
          order.paymentDetails.refundError = refundResult.error;
          order.markModified('paymentDetails');

          if (!order.statusHistory) order.statusHistory = [];
          order.statusHistory.push({
            status: 'cancelled',
            timestamp: new Date(),
            location: location ? location.trim() : (order.currentLocation || ''),
            note: `Order cancelled. Online refund could not be automatically initiated: ${refundResult.error || 'Gateway issue'}. Store admin alerted for manual processing.`,
          });
        }
      } else if (order.paymentMethod === 'COD') {
        if (!order.statusHistory) order.statusHistory = [];
        order.statusHistory.push({
          status: 'cancelled',
          timestamp: new Date(),
          location: location ? location.trim() : (order.currentLocation || ''),
          note: 'Order cancelled by customer. COD order — no monetary refund required.',
        });
      }
    }

    // Handle referral discount restoration or reward/eligibility sync
    try {
      await syncReferralLifecycleOnStatusChange(order, status);
    } catch (refErr) {
      console.warn('syncReferralLifecycleOnStatusChange error:', refErr);
    }

    if (status === 'return_requested') {
      order.returnDetails = {
        reason: returnReason || 'Return requested by customer',
        description: returnDescription || '',
        images: Array.isArray(returnImages) ? returnImages : [],
        status: 'return_requested',
        requestedAt: new Date(),
      };

      try {
        await ReturnRefund.findOneAndUpdate(
          { order: order._id },
          {
            $set: {
              order: order._id,
              orderNumber: order.orderNumber,
              customerName: order.customerName || order.shippingAddress?.name || 'Customer',
              customerEmail: (order.customerEmail || session?.email || '').toLowerCase().trim(),
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
