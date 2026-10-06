import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';
import { Referral } from '@/models/Referral';
import { Order } from '@/models/Order';
import { getUserSession } from '@/lib/auth';
import { checkAndGrantReferralEligibility } from '@/lib/referral';

// Helper to mask name/email for privacy (e.g. "Rahul S." -> "Ra*** S.", "user@gmail.com" -> "u***@gmail.com")
function maskName(name: string): string {
  if (!name) return 'Friend';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length <= 2 ? p : `${p[0]}***${p[p.length - 1]}`))
    .join(' ');
}

// GET /api/referrals/status
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();

    let customer = await Customer.findById(session.userId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // If customer is not yet marked referral-eligible, check if they have a qualifying first order
    if (!customer.referralEligible || !customer.referralCode) {
      const qualifyingOrder = await Order.findOne({
        $and: [
          {
            $or: [
              { customerId: customer._id.toString() },
              { customerEmail: customer.email.toLowerCase().trim() },
            ],
          },
          {
            orderStatus: { $nin: ['cancelled', 'return_rejected'] },
          },
          {
            $or: [
              { paymentStatus: 'paid' },
              { orderStatus: 'delivered' },
            ],
          },
        ],
      }).sort({ createdAt: 1 });

      if (qualifyingOrder) {
        await checkAndGrantReferralEligibility(qualifyingOrder);
        customer = await Customer.findById(session.userId);
      }
    }

    const isReferralEligible = Boolean(customer?.referralEligible && customer?.referralCode);

    // Fetch referral history where this customer is the referrer
    const referrals = await Referral.find({ referrer: customer?._id })
      .populate('referredUser', 'name email createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const formattedHistory = referrals.map((r: any) => ({
      id: r._id.toString(),
      friendName: r.referredUser?.name ? maskName(r.referredUser.name) : 'Referred Friend',
      status: r.status, // 'pending' | 'purchased' | 'delivered' | 'completed' | 'cancelled'
      date: r.createdAt,
      rewardAmount: r.rewardAmount || r.referrerDiscountAmount || 100,
      rewardAvailable: r.referrerDiscountAvailable || r.rewardIssued || false,
      rewardUsed: r.referrerDiscountUsed || false,
    }));

    const totalReferred = referrals.length;
    const completedOrders = referrals.filter(
      (r) => r.status === 'completed' || r.status === 'reward_issued' || r.rewardIssued
    ).length;
    const totalDiscountEarned = completedOrders * 100;

    // Check if customer is eligible for 15% first order discount (strictly single-use on first purchase)
    const priorOrdersCount = await Order.countDocuments({
      $or: [
        { customerId: customer?._id.toString() },
        { customerEmail: customer?.email.toLowerCase().trim() },
      ],
      orderStatus: { $ne: 'cancelled' },
    });

    const existingUsedRef = await Referral.findOne({
      referredUser: customer?._id,
      $or: [{ referredDiscountUsed: true }, { referredDiscountApplied: true }],
    });

    const isFirstOrderEligible =
      Boolean(customer?.referredBy || customer?.referralCodeUsed) &&
      !customer?.hasUsedReferralDiscount &&
      (customer?.totalOrders || 0) === 0 &&
      priorOrdersCount === 0 &&
      !existingUsedRef;

    // Build the dynamic base URL for shareable referral link
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
    const protocol = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
    const baseUrl = `${protocol}://${host}`;
    const referralLink = isReferralEligible
      ? `${baseUrl}/register?ref=${customer?.referralCode}`
      : null;

    return NextResponse.json({
      success: true,
      referralEligible: isReferralEligible,
      referralCode: isReferralEligible ? customer?.referralCode : null,
      referralLink,
      availableDiscount: customer?.referralDiscountBalance || 0,
      availableDiscountRupees: customer?.referralDiscountBalance || 0,
      referralDiscountBalance: customer?.referralDiscountBalance || 0,
      isFirstOrderEligible,
      eligibleForFirstOrderDiscount: isFirstOrderEligible,
      firstOrderDiscountPercent: isFirstOrderEligible ? 15 : 0,
      hasUsedReferralDiscount: customer?.hasUsedReferralDiscount || false,
      referredBy: customer?.referredBy || '',
      referralCodeUsed: customer?.referralCodeUsed || '',
      stats: {
        totalReferred,
        totalReferrals: totalReferred,
        completedOrders,
        completedReferrals: completedOrders,
        pendingReferrals: totalReferred - completedOrders,
        totalDiscountEarned,
        totalRewardsEarned: totalDiscountEarned,
      },
      history: formattedHistory.map((h) => ({
        ...h,
        referredName: h.friendName,
        rewardEarned: h.status === 'completed' || h.rewardAvailable ? 100 : 0,
      })),
    });
  } catch (error: any) {
    console.error('Referral status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch referral status' },
      { status: 500 }
    );
  }
}
