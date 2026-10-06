import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
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
    const { orderStatus, paymentStatus, location, note } = body;

    const existingOrder = await Order.findById(params.id);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousStatus = existingOrder.orderStatus;

    if (orderStatus) existingOrder.orderStatus = orderStatus;
    if (paymentStatus) existingOrder.paymentStatus = paymentStatus;
    if (location !== undefined && location.trim()) existingOrder.currentLocation = location.trim();

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
