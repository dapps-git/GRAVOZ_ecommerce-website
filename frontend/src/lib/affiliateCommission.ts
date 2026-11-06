import mongoose from 'mongoose';
import { Influencer } from '@/models/Influencer';
import { AffiliateCommission } from '@/models/AffiliateCommission';
import { Order } from '@/models/Order';
import { Customer } from '@/models/Customer';

/**
 * Calculates and records the affiliate commission for an order.
 * - Retrieves the influencer ObjectId from the customer's database record.
 * - Snapshots influencer details, commission type, rate, and amount on the order.
 * - Prevents duplicate commission generation for the same order (idempotent).
 * - Calculates commission on the eligible product subtotal after discounts (excluding delivery charges).
 */
export async function calculateAndRecordAffiliateCommission({
  order,
  customer,
  customerId,
  customerEmail,
}: {
  order: any;
  customer?: any;
  customerId?: string | mongoose.Types.ObjectId;
  customerEmail?: string;
}) {
  try {
    if (!order || !order._id) return null;

    // Prevent duplicate commission record for the same order
    const existingCommission = await AffiliateCommission.findOne({ orderId: order._id });
    if (existingCommission) {
      return existingCommission;
    }

    // Resolve customer from database if not already provided
    let dbCustomer = customer;
    if (!dbCustomer) {
      const cId = customerId || order.customerId;
      const cEmail = (customerEmail || order.customerEmail || '').toLowerCase().trim();

      if (cId && mongoose.Types.ObjectId.isValid(String(cId))) {
        dbCustomer = await Customer.findById(cId);
      } else if (cEmail) {
        dbCustomer = await Customer.findOne({ email: cEmail });
      }
    }

    // Must have an associated influencer on customer record
    if (!dbCustomer || !dbCustomer.influencerId) {
      return null;
    }

    // Fetch influencer configuration at time of order
    const influencer = await Influencer.findById(dbCustomer.influencerId);
    if (!influencer) {
      return null;
    }

    // Calculate eligible product subtotal after discounts (excluding shipping fee)
    const rawSubtotal = Number(order.subtotal) || 0;
    const discountAmount = Number(order.discountAmount) || 0;
    const referralDiscount = Number(order.referralDiscountAmount) || 0;
    const eligibleSubtotal = Math.max(0, rawSubtotal - discountAmount - referralDiscount);

    const commissionType = influencer.commissionType === 'fixed' ? 'fixed' : 'percentage';
    const commissionRate = typeof influencer.commissionValue === 'number' && influencer.commissionValue >= 0
      ? influencer.commissionValue
      : 5; // default 5%

    let commissionAmount = 0;
    if (commissionType === 'percentage') {
      commissionAmount = Math.round(((eligibleSubtotal * commissionRate) / 100) * 100) / 100;
    } else {
      commissionAmount = Math.min(eligibleSubtotal, commissionRate);
    }

    // Determine initial commission status based on payment / order status
    let status: 'pending' | 'approved' | 'paid' | 'cancelled' = 'pending';
    if (order.paymentStatus === 'paid' || order.orderStatus === 'delivered') {
      status = 'approved';
    } else if (order.paymentStatus === 'failed' || order.orderStatus === 'cancelled') {
      status = 'cancelled';
    }

    // Create the commission record
    const commission = await AffiliateCommission.create({
      influencerId: influencer._id,
      influencerName: influencer.name,
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: dbCustomer._id,
      customerName: dbCustomer.name || order.customerName || 'Customer',
      customerEmail: (dbCustomer.email || order.customerEmail || '').toLowerCase().trim(),
      orderSubtotal: eligibleSubtotal,
      orderTotal: Number(order.totalAmount) || 0,
      commissionType,
      commissionRate,
      commissionAmount,
      status,
    });

    // Snapshot commission details onto the Order document
    await Order.updateOne(
      { _id: order._id },
      {
        $set: {
          influencerId: influencer._id,
          influencerName: influencer.name,
          commissionType,
          commissionRate,
          commissionAmount,
          commissionStatus: status,
        },
      }
    );

    return commission;
  } catch (error) {
    console.error('Error calculating affiliate commission:', error);
    return null;
  }
}

/**
 * Syncs commission status when order status changes (cancellation, refunds, delivery, payment)
 */
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

    // If commission was already paid out, don't overwrite paid status unless refunded
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
    console.error('Error syncing affiliate commission on order status change:', err);
  }
}

