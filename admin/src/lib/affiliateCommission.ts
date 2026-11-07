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

    // Fetch order to verify paymentMethod and current status
    const order = await Order.findById(orderId).lean();
    const effectivePaymentMethod = String((order && (order as any).paymentMethod) || '').trim().toUpperCase();
    const effectiveOrderStatus = orderStatus || (order && (order as any).orderStatus) || '';
    const effectivePaymentStatus = paymentStatus || (order && (order as any).paymentStatus) || '';
    const isCOD = effectivePaymentMethod === 'COD';

    // If commission was already paid out, do not cancel unless refunded/returned
    if (commission.status === 'paid' && effectiveOrderStatus !== 'refunded' && effectiveOrderStatus !== 'returned') {
      return;
    }

    let newStatus: 'pending' | 'approved' | 'paid' | 'cancelled' | null = null;

    if (effectiveOrderStatus === 'cancelled' || effectivePaymentStatus === 'failed') {
      newStatus = 'cancelled';
    } else if (
      effectiveOrderStatus === 'refunded' ||
      effectiveOrderStatus === 'returned' ||
      effectiveOrderStatus === 'return_received' ||
      effectivePaymentStatus === 'refunded'
    ) {
      newStatus = 'cancelled';
    } else if (isCOD) {
      // Rule: For COD orders, benefits go to the influencer ONLY when product status is changed to 'delivered'
      if (effectiveOrderStatus === 'delivered') {
        newStatus = 'approved';
      } else {
        // Any intermediate status (ordered, confirmed, processing, shipped, out_for_delivery) remains pending
        newStatus = 'pending';
      }
    } else {
      // For prepaid orders (Razorpay, UPI, Card)
      if (effectiveOrderStatus === 'delivered' || effectivePaymentStatus === 'paid') {
        if (commission.status === 'pending') {
          newStatus = 'approved';
        }
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

