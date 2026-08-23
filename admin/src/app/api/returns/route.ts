import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ReturnRefund } from '@/models/ReturnRefund';
import { Order } from '@/models/Order';
import { backgroundQueue } from '@/lib/jobs';

// GET /api/returns
export async function GET() {
  try {
    await connectDB();
    const returns = await ReturnRefund.find().sort({ createdAt: -1 }).populate('order', 'orderNumber totalAmount').lean();
    return NextResponse.json(returns);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch return requests' }, { status: 500 });
  }
}

// PUT /api/returns (Process status update)
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { returnId, status, adminNotes } = body;

    if (!returnId || !status) {
      return NextResponse.json({ error: 'returnId and status are required' }, { status: 400 });
    }

    const returnItem = await ReturnRefund.findById(returnId);
    if (!returnItem) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    returnItem.status = status;
    if (adminNotes) returnItem.adminNotes = adminNotes;
    if (status === 'processed') returnItem.processedAt = new Date();
    await returnItem.save();

    // If status processed, update order status to refunded / returned
    if (status === 'processed') {
      await Order.findByIdAndUpdate(returnItem.order, {
        $set: { paymentStatus: 'refunded', orderStatus: 'returned' },
      });

      // Background refund processing task (Rule 15)
      await backgroundQueue.addJob('PROCESS_REFUND', {
        orderNumber: returnItem.orderNumber,
        amount: returnItem.refundAmount,
        email: returnItem.customerEmail,
      });
    }

    return NextResponse.json({ success: true, returnRefund: returnItem });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to update return status' }, { status: 500 });
  }
}
