import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { AffiliateCommission } from '@/models/AffiliateCommission';
import { Order } from '@/models/Order';
import { requireAdmin } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/affiliates/commissions/[id] - Update commission status (e.g. mark paid)
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { id } = await props.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid commission ID' }, { status: 400 });
    }

    await connectDB();
    const body = await req.json();
    const { status, notes } = body;

    const validStatuses = ['pending', 'approved', 'paid', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, approved, paid, or cancelled.' },
        { status: 400 }
      );
    }

    const commission = await AffiliateCommission.findById(id);
    if (!commission) {
      return NextResponse.json({ error: 'Commission record not found' }, { status: 404 });
    }

    // Safeguard: For COD orders, benefits go to the influencer only when product status is changed to delivered
    if (status === 'approved' || status === 'paid') {
      const order = await Order.findById(commission.orderId).lean();
      const isCOD = String((order && (order as any).paymentMethod) || '').trim().toUpperCase() === 'COD';
      if (isCOD && order && (order as any).orderStatus !== 'delivered') {
        return NextResponse.json(
          {
            error:
              'For Cash on Delivery (COD) orders, commission benefits can only be approved or paid after the product status is changed to "delivered".',
          },
          { status: 400 }
        );
      }
    }

    commission.status = status;
    if (notes) commission.notes = notes;

    if (status === 'paid') {
      commission.paidAt = new Date();
    } else if (status === 'cancelled') {
      commission.cancelledAt = new Date();
    }

    await commission.save();

    // Sync to Order snapshot as well
    if (commission.orderId) {
      await Order.updateOne(
        { _id: commission.orderId },
        { $set: { commissionStatus: status } }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Commission status updated to ${status}`,
      commission,
    });
  } catch (error: any) {
    console.error('Update commission status error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update commission' }, { status: 500 });
  }
}

