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
 * Check and Grant Referral Eligibility for User A on first qualifying purchase ≥ ₹999.
 * Online payment: Immediate after payment success.
 * COD: Only after DELIVERED.
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
    if (order.customerId && mongoose.Types.ObjectId.isValid(String(order.customerId))) {
      customer = await Customer.findById(order.customerId);
    }
    if (!customer && order.customerEmail) {
      customer = await Customer.findOne({ email: order.customerEmail.toLowerCase().trim() });
    }

    if (!customer) {
      return { eligible: false, reason: 'Customer not found' };
    }

    // If already eligible with a code, preserve permanently
    if (customer.referralEligible && customer.referralCode) {
      return { eligible: true, code: customer.referralCode, reason: 'Already referral eligible' };
    }

    // 2. Check if customer has already completed a previous purchase
    const priorCompletedOrders = await Order.countDocuments({
      $and: [
        { _id: { $ne: order._id } },
        {
          $or: [
            { customerId: customer._id.toString() },
            { customerEmail: customer.email.toLowerCase().trim() },
          ],
        },
        { orderStatus: { $nin: ['cancelled'] } },
        {
          $or: [
            { paymentStatus: 'paid' },
            { orderStatus: 'delivered' },
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

    // 4. Payment method handling
    const isCOD = order.paymentMethod === 'COD';
    const isOnlinePaid = !isCOD && order.paymentStatus === 'paid';
    const isCODelivered = isCOD && order.orderStatus === 'delivered';

    if (!isOnlinePaid && !isCODelivered) {
      if (isCOD) {
        return { eligible: false, reason: 'COD order placed. Referral link will be generated upon delivery.' };
      }
      return { eligible: false, reason: 'Online payment not completed yet.' };
    }

    // 5. All conditions met — generate unique referral code for User A
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
    console.log(`[REFERRAL] Eligibility granted for ${customer.email}: ${newReferralCode}`);

    return { eligible: true, code: newReferralCode, reason: 'First qualifying purchase completed.' };
  } catch (error: any) {
    console.error('checkAndGrantReferralEligibility error:', error);
    return { eligible: false, reason: error.message };
  }
}

/**
 * Process ₹100 Referral Reward for the Referrer (User A) when User B completes a qualifying purchase.
 * Online payment: Immediate.
 * COD: Only after DELIVERED.
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
    if (order.customerId && mongoose.Types.ObjectId.isValid(String(order.customerId))) {
      buyerCustomer = await Customer.findById(order.customerId);
    }
    if (!buyerCustomer && order.customerEmail) {
      buyerCustomer = await Customer.findOne({ email: order.customerEmail.toLowerCase().trim() });
    }

    if (!buyerCustomer) return { rewarded: false, rewardAmount: 0, reason: 'Buyer customer not found' };

    // 2. Check if buyer was referred by anyone
    const referral = await Referral.findOne({ referredUser: buyerCustomer._id });
    if (!referral) return { rewarded: false, rewardAmount: 0, reason: 'Buyer is not a referred customer' };

    // 3. Idempotency check — reward only once
    if (referral.rewardIssued || referral.referrerDiscountAvailable) {
      return { rewarded: false, rewardAmount: 0, reason: 'Reward already issued for this referral' };
    }

    const isCOD = order.paymentMethod === 'COD';
    const isOnlinePaid = !isCOD && order.paymentStatus === 'paid';
    const isCODelivered = isCOD && order.orderStatus === 'delivered';

    // 4. COD order placed but not delivered yet — mark as purchased, wait
    if (isCOD && !isCODelivered) {
      if (['cancelled', 'return_received', 'returned'].includes(order.orderStatus)) {
        referral.status = 'cancelled';
        await referral.save();
        return { rewarded: false, rewardAmount: 0, reason: 'COD order cancelled. No reward.' };
      }
      if (referral.status === 'pending') {
        referral.status = 'purchased';
        referral.qualifyingOrderId = order._id;
        referral.referredOrderId = order._id;
        referral.referredDiscountUsed = true;
        await referral.save();
      }
      return { rewarded: false, rewardAmount: 0, reason: 'COD order placed. User A reward pending delivery.' };
    }

    // 5. Must be online paid or COD delivered
    if (!isOnlinePaid && !isCODelivered) {
      return { rewarded: false, rewardAmount: 0, reason: 'Order payment not verified or COD not delivered yet.' };
    }

    // 6. Issue ₹100 Reward to User A (Referrer)
    const referrer = await Customer.findById(referral.referrer);
    if (!referrer) return { rewarded: false, rewardAmount: 0, reason: 'Referrer not found' };

    // Self-referral safety check
    if (referrer._id.toString() === buyerCustomer._id.toString()) {
      return { rewarded: false, rewardAmount: 0, reason: 'Self-referral rejected' };
    }

    const REWARD_AMOUNT = 100;

    referrer.referralDiscountBalance = (referrer.referralDiscountBalance || 0) + REWARD_AMOUNT;
    if (!referrer.activityLogs) referrer.activityLogs = [];
    referrer.activityLogs.push({
      action: 'Referral Reward Earned',
      details: `Earned ₹${REWARD_AMOUNT} referral reward for friend (${buyerCustomer.name || 'Friend'}) on order #${order.orderNumber}`,
      timestamp: new Date(),
    });
    await referrer.save();

    referral.status = 'completed';
    referral.qualifyingOrderId = order._id;
    referral.referredOrderId = order._id;
    referral.rewardIssued = true;
    referral.rewardIssuedAt = new Date();
    referral.referrerDiscountAvailable = true;
    referral.rewardAmount = REWARD_AMOUNT;
    referral.referredDiscountUsed = true;
    await referral.save();

    console.log(`[REFERRAL] ₹${REWARD_AMOUNT} reward credited to ${referrer.email} for order #${order.orderNumber}`);
    return { rewarded: true, rewardAmount: REWARD_AMOUNT, reason: 'Referral reward issued successfully.' };
  } catch (error: any) {
    console.error('processReferralRewardForReferrer error:', error);
    return { rewarded: false, rewardAmount: 0, reason: error.message };
  }
}

/**
 * Sync referral lifecycle when order status changes (from admin or customer).
 */
export async function syncReferralLifecycleOnStatusChange(order: any, newStatus: string): Promise<void> {
  try {
    if (!order) return;

    if (newStatus === 'delivered') {
      await checkAndGrantReferralEligibility(order);
      await processReferralRewardForReferrer(order);
    }

    if (newStatus === 'cancelled' || newStatus === 'refunded') {
      const custQuery = order.customerId && mongoose.Types.ObjectId.isValid(String(order.customerId))
        ? { _id: order.customerId }
        : { email: (order.customerEmail || '').toLowerCase().trim() };

      if (order.referralDiscountType === 'referrer_reward_100') {
        await Customer.findOneAndUpdate(custQuery, { $inc: { referralDiscountBalance: 100 } });
        await Referral.findOneAndUpdate(
          { referrerOrderId: order._id },
          { referrerDiscountUsed: false, referrerOrderId: null }
        );
      }

      if (order.referralDiscountType === 'referred_first_order_15') {
        await Customer.findOneAndUpdate(custQuery, { hasUsedReferralDiscount: false });
        await Referral.findOneAndUpdate(
          { referredOrderId: order._id },
          { referredDiscountUsed: false, referredDiscountApplied: false, referredOrderId: null }
        );
      }

      const pendingRef = await Referral.findOne({
        referredOrderId: order._id,
        rewardIssued: false,
      });
      if (pendingRef) {
        pendingRef.status = 'cancelled';
        await pendingRef.save();
      }

      const earnedRef = await Referral.findOne({
        referredOrderId: order._id,
        rewardIssued: true,
        referrerDiscountUsed: false,
      });
      if (earnedRef) {
        await Customer.findByIdAndUpdate(earnedRef.referrer, {
          $inc: { referralDiscountBalance: -100 },
        });
        earnedRef.referrerDiscountAvailable = false;
        earnedRef.rewardIssued = false;
        earnedRef.status = 'cancelled';
        await earnedRef.save();
      }
    }
  } catch (err) {
    console.error('syncReferralLifecycleOnStatusChange error:', err);
  }
}
