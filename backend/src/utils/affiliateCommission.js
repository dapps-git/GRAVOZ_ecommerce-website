const mongoose = require('mongoose');
const Influencer = require('../models/Influencer');
const AffiliateCommission = require('../models/AffiliateCommission');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

async function calculateAndRecordAffiliateCommission({ order, customer, customerId, customerEmail }) {
  try {
    if (!order || !order._id) return null;

    const existingCommission = await AffiliateCommission.findOne({ orderId: order._id });
    if (existingCommission) return existingCommission;

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

    if (!dbCustomer || !dbCustomer.influencerId) return null;

    const influencer = await Influencer.findById(dbCustomer.influencerId);
    if (!influencer) return null;

    const rawSubtotal = Number(order.subtotal) || 0;
    const discountAmount = Number(order.discountAmount) || 0;
    const referralDiscount = Number(order.referralDiscountAmount) || 0;
    const eligibleSubtotal = Math.max(0, rawSubtotal - discountAmount - referralDiscount);

    const commissionType = influencer.commissionType === 'fixed' ? 'fixed' : 'percentage';
    const commissionRate = typeof influencer.commissionValue === 'number' && influencer.commissionValue >= 0
      ? influencer.commissionValue
      : 5;

    let commissionAmount = 0;
    if (commissionType === 'percentage') {
      commissionAmount = Math.round(((eligibleSubtotal * commissionRate) / 100) * 100) / 100;
    } else {
      commissionAmount = Math.min(eligibleSubtotal, commissionRate);
    }

    let status = 'pending';
    if (order.paymentStatus === 'paid' || order.orderStatus === 'delivered') {
      status = 'approved';
    } else if (order.paymentStatus === 'failed' || order.orderStatus === 'cancelled') {
      status = 'cancelled';
    }

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
  } catch (err) {
    console.error('Error calculating affiliate commission (backend):', err);
    return null;
  }
}

async function syncAffiliateCommissionOnOrderStatusChange(orderId, { orderStatus, paymentStatus, reason } = {}) {
  try {
    if (!orderId) return;

    const commission = await AffiliateCommission.findOne({ orderId });
    if (!commission) return;

    if (commission.status === 'paid' && orderStatus !== 'refunded' && orderStatus !== 'returned') {
      return;
    }

    let newStatus = null;
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
    console.error('Error syncing affiliate commission in backend:', err);
  }
}

module.exports = {
  calculateAndRecordAffiliateCommission,
  syncAffiliateCommissionOnOrderStatusChange,
};

