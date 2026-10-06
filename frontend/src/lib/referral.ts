import mongoose from 'mongoose';
import { Customer } from '@/models/Customer';
import { Referral } from '@/models/Referral';
import { Order } from '@/models/Order';

/**
 * Generates a unique, URL-safe referral code (e.g. GRVZ842, AIF109)
 * and guarantees database uniqueness.
 */
export async function generateUniqueReferralCode(name: string): Promise<string> {
  const cleanName = (name || 'GRVZ')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 4) || 'GRVZ';
  const prefix = cleanName.padEnd(4, 'X');

  let code = `${prefix}${Math.floor(100 + Math.random() * 900)}`;
  let attempts = 0;

  while ((await Customer.findOne({ referralCode: code })) && attempts < 20) {
    code = `${prefix}${Math.floor(100 + Math.random() * 900)}`;
    attempts++;
  }

  if (attempts >= 20) {
    code = `REF${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
  }

  return code;
}

/**
 * Check and Grant Referral Eligibility for User A:
 * 
 * Rules:
 * 1. Only a NEW customer can become eligible.
 * 2. It must be their FIRST qualifying purchase.
 * 3. Qualifying purchase amount: ₹999 or above (totalAmount or subtotal >= 999).
 * 4. Online Payment (UPI, Card, Razorpay): Generated immediately after payment is successful.
 * 5. COD: Generated ONLY after the COD order status is DELIVERED.
 * 6. If first order is cancelled / failed / rejected: DO NOT generate referral link.
 * 7. Once legitimately granted, the referral code is permanently preserved.
 */
export async function checkAndGrantReferralEligibility(order: any): Promise<{
  eligible: boolean;
  code?: string;
  reason?: string;
}> {
  try {
    if (!order) return { eligible: false, reason: 'Invalid order' };

    // 1. Resolve ordering customer
    let customer: any = null;
    if (order.customerId && mongoose.Types.ObjectId.isValid(order.customerId)) {
      customer = await Customer.findById(order.customerId);
    }
    if (!customer && order.customerEmail) {
      customer = await Customer.findOne({ email: order.customerEmail.toLowerCase().trim() });
    }

    if (!customer) {
      return { eligible: false, reason: 'Customer not found' };
    }

    // If customer already has an active referral link, preserve it permanently!
    if (customer.referralEligible && customer.referralCode) {
      return { eligible: true, code: customer.referralCode, reason: 'Already referral eligible' };
    }

    // 2. Check if customer has already completed a previous purchase
    // "A customer who has already made a previous purchase cannot become referral-eligible from a later order."
    const orderIdStr = order._id ? order._id.toString() : '';

    // Check complete order history in DB for prior non-cancelled orders
    const priorCompletedOrders = await Order.countDocuments({
      $and: [
        { _id: { $ne: order._id } },
        {
          $or: [
            { customerId: customer._id.toString() },
            { customerEmail: customer.email.toLowerCase().trim() },
          ],
        },
        { orderStatus: { $nin: ['cancelled', 'return_rejected'] } },
        {
          $or: [
            { paymentStatus: 'paid' },
            { orderStatus: 'delivered' },
            { createdAt: { $lt: order.createdAt || new Date() } },
          ],
        },
      ],
    });

    if (priorCompletedOrders > 0 || customer.firstPurchaseCompleted) {
      if (!customer.firstPurchaseCompleted) {
        customer.firstPurchaseCompleted = true;
        await customer.save();
      }
      return {
        eligible: false,
        reason: 'Customer has prior completed orders. Referral link is only for first purchase.',
      };
    }

    // 3. Verify qualifying order amount: ₹999 or above
    const orderTotal = Number(order.totalAmount) || 0;
    const orderSubtotal = Number(order.subtotal) || 0;
    const qualifyingAmount = Math.max(orderTotal, orderSubtotal);

    if (qualifyingAmount < 999) {
      // If this first order is completed/delivered but under ₹999, mark firstPurchaseCompleted
      if (
        (order.paymentMethod !== 'COD' && order.paymentStatus === 'paid') ||
        order.orderStatus === 'delivered'
      ) {
        customer.firstPurchaseCompleted = true;
        await customer.save();
      }
      return {
        eligible: false,
        reason: `First order amount (₹${qualifyingAmount}) is below qualifying threshold of ₹999`,
      };
    }

    // 4. Payment method handling:
    const isCOD = order.paymentMethod === 'COD';
    const isOnlinePaid = !isCOD && order.paymentStatus === 'paid';
    const isCODelivered = isCOD && order.orderStatus === 'delivered';

    if (!isOnlinePaid && !isCODelivered) {
      if (isCOD) {
        return {
          eligible: false,
          reason: 'COD order placed. Referral link will be generated upon delivery.',
        };
      }
      return {
        eligible: false,
        reason: 'Online payment not completed yet.',
      };
    }

    // 5. Conditions met! Generate unique referral code for User A
    const newReferralCode = await generateUniqueReferralCode(customer.name);

    customer.referralCode = newReferralCode;
    customer.referralEligible = true;
    customer.firstPurchaseCompleted = true;
    customer.referralEligibleOrderId = order._id;

    if (!customer.activityLogs) customer.activityLogs = [];
    customer.activityLogs.push({
      action: 'Referral Link Unlocked',
      details: `Unlocked referral code ${newReferralCode} on first qualifying order #${order.orderNumber} (₹${qualifyingAmount})`,
      timestamp: new Date(),
    });

    await customer.save();

    console.log(`🎉 Referral link unlocked for User A (${customer.email}): ${newReferralCode}`);

    return {
      eligible: true,
      code: newReferralCode,
      reason: 'First qualifying purchase successfully completed.',
    };
  } catch (error: any) {
    console.error('checkAndGrantReferralEligibility error:', error);
    return { eligible: false, reason: error.message };
  }
}

/**
 * Process Referral Reward for Referrer (User A):
 * 
 * Rules:
 * 1. User B must complete their purchase.
 * 2. ONLINE PAYMENT: User A receives ₹100 reward immediately after successful payment.
 * 3. COD: User A receives ₹100 reward ONLY after COD order is DELIVERED.
 * 4. COD Cancelled / Rejected / Failed: User A receives NOTHING.
 * 5. Idempotent: Reward is issued strictly ONCE per qualifying referral.
 */
export async function processReferralRewardForReferrer(order: any): Promise<{
  rewarded: boolean;
  rewardAmount: number;
  reason?: string;
}> {
  try {
    if (!order) return { rewarded: false, rewardAmount: 0, reason: 'Invalid order' };

    // 1. Resolve buyer (User B)
    let buyerCustomer: any = null;
    if (order.customerId && mongoose.Types.ObjectId.isValid(order.customerId)) {
      buyerCustomer = await Customer.findById(order.customerId);
    }
    if (!buyerCustomer && order.customerEmail) {
      buyerCustomer = await Customer.findOne({ email: order.customerEmail.toLowerCase().trim() });
    }

    if (!buyerCustomer) {
      return { rewarded: false, rewardAmount: 0, reason: 'Buyer customer not found' };
    }

    // 2. Check if buyer was referred by anyone
    const referral = await Referral.findOne({ referredUser: buyerCustomer._id });
    if (!referral) {
      return { rewarded: false, rewardAmount: 0, reason: 'Buyer is not a referred customer' };
    }

    // 3. Idempotency Check: guarantee reward is given strictly once
    if (referral.rewardIssued || referral.referrerDiscountAvailable) {
      return { rewarded: false, rewardAmount: 0, reason: 'Reward already issued for this referral' };
    }

    const isCOD = order.paymentMethod === 'COD';
    const isOnlinePaid = !isCOD && order.paymentStatus === 'paid';
    const isCODelivered = isCOD && order.orderStatus === 'delivered';

    // 4. Handle COD placement vs delivery
    if (isCOD && !isCODelivered) {
      if (order.orderStatus === 'cancelled' || order.orderStatus === 'return_received' || order.orderStatus === 'returned') {
        referral.status = 'cancelled';
        await referral.save();
        return { rewarded: false, rewardAmount: 0, reason: 'COD order cancelled/failed. No reward.' };
      }

      // COD order in progress -> mark status as 'purchased', wait for delivery
      referral.status = 'purchased';
      referral.qualifyingOrderId = order._id;
      referral.referredOrderId = order._id;
      referral.referredDiscountUsed = true;
      referral.rewardIssued = false;
      referral.referrerDiscountAvailable = false;
      await referral.save();

      return {
        rewarded: false,
        rewardAmount: 0,
        reason: 'COD order placed. User A reward pending delivery.',
      };
    }

    // 5. Must be Online Paid or COD Delivered to trigger the ₹100 reward
    if (!isOnlinePaid && !isCODelivered) {
      return {
        rewarded: false,
        rewardAmount: 0,
        reason: 'Order payment not verified or COD not delivered yet.',
      };
    }

    // 6. Issue ₹100 Reward to Referrer (User A)
    const referrer = await Customer.findById(referral.referrer);
    if (!referrer) {
      return { rewarded: false, rewardAmount: 0, reason: 'Referrer not found' };
    }

    // Self-referral prevention safety check
    if (referrer._id.toString() === buyerCustomer._id.toString()) {
      return { rewarded: false, rewardAmount: 0, reason: 'Self-referral rejected' };
    }

    const REWARD_AMOUNT = 100;

    // Credit ₹100 to User A's referral discount balance
    referrer.referralDiscountBalance = (referrer.referralDiscountBalance || 0) + REWARD_AMOUNT;

    if (!referrer.activityLogs) referrer.activityLogs = [];
    referrer.activityLogs.push({
      action: 'Referral Reward Earned',
      details: `Earned ₹${REWARD_AMOUNT} referral reward for referred friend (${buyerCustomer.name || 'Friend'}) on order #${order.orderNumber}`,
      timestamp: new Date(),
    });

    await referrer.save();

    // Mark referral record as completed & reward issued
    referral.status = 'completed';
    referral.qualifyingOrderId = order._id;
    referral.referredOrderId = order._id;
    referral.rewardIssued = true;
    referral.rewardIssuedAt = new Date();
    referral.referrerDiscountAvailable = true;
    referral.rewardAmount = REWARD_AMOUNT;
    referral.referredDiscountUsed = true;
    await referral.save();

    console.log(
      `🎁 Successfully credited ₹${REWARD_AMOUNT} referral reward to User A (${referrer.email}) for order #${order.orderNumber}`
    );

    return {
      rewarded: true,
      rewardAmount: REWARD_AMOUNT,
      reason: 'Referral reward issued successfully.',
    };
  } catch (error: any) {
    console.error('processReferralRewardForReferrer error:', error);
    return { rewarded: false, rewardAmount: 0, reason: error.message };
  }
}

/**
 * Handle Order Status Updates (Delivered, Cancelled, Refunded, etc.):
 * Centralized idempotency coordinator for both User A eligibility and User B rewards.
 */
export async function syncReferralLifecycleOnStatusChange(order: any, newStatus: string): Promise<void> {
  try {
    if (!order) return;

    // If order transitioned to 'delivered':
    if (newStatus === 'delivered') {
      // 1. Check if User A (author of order) becomes referral eligible on COD delivery
      await checkAndGrantReferralEligibility(order);

      // 2. Check if User B (buyer) completed COD order -> grant User A ₹100 reward
      await processReferralRewardForReferrer(order);
    }

    // If order was cancelled / refunded:
    if (newStatus === 'cancelled' || newStatus === 'refunded') {
      // If customer used ₹100 referral discount on this order, restore their balance
      if (order.referralDiscountType === 'referrer_reward_100') {
        const custQuery = order.customerId && mongoose.Types.ObjectId.isValid(order.customerId)
          ? { _id: order.customerId }
          : { email: order.customerEmail.toLowerCase().trim() };
        await Customer.findOneAndUpdate(custQuery, {
          $inc: { referralDiscountBalance: 100 },
        });
        await Referral.findOneAndUpdate(
          { referrerOrderId: order._id },
          { referrerDiscountUsed: false, referrerOrderId: null }
        );
      }

      // If customer used 15% referral discount, restore eligibility
      if (order.referralDiscountType === 'referred_first_order_15') {
        const custQuery = order.customerId && mongoose.Types.ObjectId.isValid(order.customerId)
          ? { _id: order.customerId }
          : { email: order.customerEmail.toLowerCase().trim() };
        await Customer.findOneAndUpdate(custQuery, {
          hasUsedReferralDiscount: false,
        });
        await Referral.findOneAndUpdate(
          { referredOrderId: order._id },
          { referredDiscountUsed: false, referredOrderId: null }
        );
      }

      // If this order was pending referral reward, mark referral cancelled
      const pendingRef = await Referral.findOne({
        referredOrderId: order._id,
        rewardIssued: false,
      });
      if (pendingRef) {
        pendingRef.status = 'cancelled';
        await pendingRef.save();
      }
    }
  } catch (err) {
    console.error('syncReferralLifecycleOnStatusChange error:', err);
  }
}
