import mongoose from 'mongoose';
import { Influencer } from '@/models/Influencer';
import { AffiliateCommission } from '@/models/AffiliateCommission';
import { Order } from '@/models/Order';
import { Customer } from '@/models/Customer';

export async function syncAffiliateCommissionOnOrderStatusChange(
  orderId: string | mongoose.Types.ObjectId,
  {
    orderStatus,
    paymentStatus,
    reason,
  }: {
    orderStatus?: string;
    paymentStatus?: string;
    reason?: string;
  }
) {
  try {
    if (!orderId) return;

    const commission = await AffiliateCommission.findOne({ orderId });
    if (!commission) return;

    // If commission was already paid out, do not cancel unless refunded/returned
    if (commission.status === 'paid' && orderStatus !== 'refunded' && orderStatus !== 'returned') {
      return;
    }

    let newStatus: 'pending' | 'approved' | 'paid' | 'cancelled' | null = null;

    if (orderStatus === 'cancelled' || paymentStatus === 'failed') {
      newStatus = 'cancelled';
    } else if (orderStatus === 'refunded' || orderStatus === 'returned' || paymentStatus === 'refunded') {
      newStatus = 'cancelled';
    } else if (orderStatus === 'delivered' || paymentStatus === 'paid') {
      if (commission.status === 'pending') {
        newStatus = 'approved';
      }
    }

    if (newStatus && newStatus !== commission.status) {
      commission.status = newStatus;
      if (newStatus === 'cancelled') {
        commission.cancelledAt = new Date();
        commission.cancellationReason = reason || `Order changed to ${orderStatus || paymentStatus}`;
      }
      await commission.save();

      await Order.updateOne(
        { _id: orderId },
        { $set: { commissionStatus: newStatus } }
      );
    }
  } catch (err) {
    console.error('Error syncing affiliate commission in admin:', err);
  }
}

