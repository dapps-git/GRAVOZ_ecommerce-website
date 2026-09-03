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

    const now = new Date();
    const orderUpdate: Record<string, any> = {};

    if (status === 'under_review') {
      orderUpdate['orderStatus'] = 'under_review';
      orderUpdate['returnDetails.status'] = 'under_review';
    } else if (status === 'approved') {
      returnItem.approvedAt = now;
      orderUpdate['orderStatus'] = 'return_approved';
      orderUpdate['returnDetails.status'] = 'approved';
      orderUpdate['returnDetails.approvedAt'] = now;
    } else if (status === 'pickup_scheduled') {
      returnItem.pickupScheduledAt = now;
      orderUpdate['orderStatus'] = 'pickup_scheduled';
      orderUpdate['returnDetails.status'] = 'pickup_scheduled';
      orderUpdate['returnDetails.pickupScheduledAt'] = now;
    } else if (status === 'received') {
      returnItem.receivedAt = now;
      orderUpdate['orderStatus'] = 'return_received';
      orderUpdate['returnDetails.status'] = 'received';
      orderUpdate['returnDetails.receivedAt'] = now;
    } else if (status === 'refund_initiated') {
      returnItem.refundInitiatedAt = now;
      orderUpdate['orderStatus'] = 'refund_initiated';
      orderUpdate['returnDetails.status'] = 'refund_initiated';
      orderUpdate['returnDetails.refundInitiatedAt'] = now;
    } else if (status === 'refunded' || status === 'processed') {
      returnItem.status = 'refunded';
      returnItem.refundedAt = now;
      returnItem.processedAt = now;
      orderUpdate['orderStatus'] = 'refunded';
      orderUpdate['paymentStatus'] = 'refunded';
      orderUpdate['returnDetails.status'] = 'refunded';
      orderUpdate['returnDetails.refundedAt'] = now;

      // Background refund processing task
      try {
        await backgroundQueue.addJob('PROCESS_REFUND', {
          orderNumber: returnItem.orderNumber,
          amount: returnItem.refundAmount,
          email: returnItem.customerEmail,
        });
      } catch (bgErr) {
        console.error('Background refund job error:', bgErr);
      }
    } else if (status === 'rejected') {
      returnItem.rejectedAt = now;
      orderUpdate['orderStatus'] = 'return_rejected';
      orderUpdate['returnDetails.status'] = 'rejected';
      orderUpdate['returnDetails.rejectedAt'] = now;
      if (adminNotes) orderUpdate['returnDetails.rejectionReason'] = adminNotes;
    }

    await returnItem.save();

    if (returnItem.order && Object.keys(orderUpdate).length > 0) {
      await Order.findByIdAndUpdate(returnItem.order, {
        $set: orderUpdate,
        $push: {
          statusHistory: {
            status: orderUpdate['orderStatus'] || status,
            timestamp: now,
            note: adminNotes || `Return status updated to ${status}`,
          },
        },
      });
    }

    return NextResponse.json({ success: true, returnRefund: returnItem });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to update return status' }, { status: 500 });
  }
}
