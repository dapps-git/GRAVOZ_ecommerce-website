import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { ReturnRefund } from '@/models/ReturnRefund';

// GET /api/orders/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).lean();
    } else {
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
    const { status, note, returnReason, returnDescription, returnImages } = body;

    await connectDB();

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    } else {
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

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || returnReason || `Status updated to ${status}`,
    });

    await order.save();

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('Update order error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update order' }, { status: 500 });
  }
}
