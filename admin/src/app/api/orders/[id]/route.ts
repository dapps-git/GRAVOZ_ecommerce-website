import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { invalidateCache } from '@/lib/redis';
import { syncReferralLifecycleOnStatusChange } from '@/lib/referral';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectDB();
    const order = await Order.findById(params.id).populate('items.product', 'name images price').lean();
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectDB();
    const body = await req.json();
    const { orderStatus, paymentStatus, location, note, estimatedDelivery } = body;

    const existingOrder = await Order.findById(params.id);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousStatus = existingOrder.orderStatus;

    if (orderStatus) existingOrder.orderStatus = orderStatus;
    if (paymentStatus) {
      existingOrder.paymentStatus = paymentStatus;
    } else if (orderStatus === 'delivered' && existingOrder.paymentMethod === 'COD') {
      existingOrder.paymentStatus = 'paid';
    }

    // Restore inventory when admin cancels the order
    if (orderStatus === 'cancelled' && previousStatus !== 'cancelled' && Array.isArray(existingOrder.items)) {
      try {
        for (const itm of existingOrder.items) {
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
        console.warn('Admin order cancellation stock restore warning:', restockErr);
      }
    }
    if (location !== undefined && location.trim()) existingOrder.currentLocation = location.trim();
    if (estimatedDelivery !== undefined) {
      existingOrder.estimatedDelivery = estimatedDelivery ? new Date(estimatedDelivery) : undefined;
    }

    if (orderStatus) {
      if (!existingOrder.statusHistory) existingOrder.statusHistory = [];
      existingOrder.statusHistory.push({
        status: orderStatus,
        timestamp: new Date(),
        location: location ? location.trim() : (existingOrder.currentLocation || ''),
        note: note ? note.trim() : `Status updated to ${orderStatus}`,
      });
    }

    await existingOrder.save();
    await invalidateCache('admin:dashboard:stats');

    // Trigger referral lifecycle when status changes (especially delivered/cancelled)
    if (orderStatus && orderStatus !== previousStatus) {
      try {
        await syncReferralLifecycleOnStatusChange(existingOrder, orderStatus);
      } catch (refErr) {
        console.error('[REFERRAL] Lifecycle sync error in admin order PUT:', refErr);
        // Non-fatal — order update already saved
      }
    }

    return NextResponse.json({ success: true, order: existingOrder });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to update order status' }, { status: 500 });
  }
}
