import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { ReturnRefund } from '@/models/ReturnRefund';
import { Customer } from '@/models/Customer';
import { Referral } from '@/models/Referral';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    // Ensure models are registered
    void Customer;
    void Referral;

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'monthly';
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const now = new Date();
    let startDate = new Date();

    if (range === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === 'monthly') {
      startDate.setDate(now.getDate() - 30);
    } else if (range === 'custom' && fromParam && toParam) {
      startDate = new Date(fromParam);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    const endDate = range === 'custom' && toParam ? new Date(toParam) : now;

    // Filter query for orders in date range
    const dateQuery = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Aggregate filtered orders stats & daily breakdown for charts & referrals
    const [
      totalProducts,
      lowStockProducts,
      totalCategories,
      pendingReturns,
      periodStats,
      dailyBreakdown,
      allTimeTotals,
      recentOrders,
      lowStockItems,
      recentReferralsRaw,
      totalReferralsCount,
      completedReferralRewardsAgg,
      referredCustomersRaw,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ stock: { $lte: 5 } }),
      Category.countDocuments(),
      ReturnRefund.countDocuments({ status: 'requested' }),

      // Filtered period orders stats
      Order.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            pendingOrders: {
              $sum: { $cond: [{ $in: ['$orderStatus', ['ordered', 'pending', 'confirmed', 'processing']] }, 1, 0] },
            },
            shippedOrders: {
              $sum: { $cond: [{ $in: ['$orderStatus', ['shipped', 'out_for_delivery']] }, 1, 0] },
            },
            deliveredOrders: {
              $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] },
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] },
            },
          },
        },
      ]),

      // Daily breakdown for graph
      Order.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            ordersCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Lifetime Totals
      Order.aggregate([
        {
          $group: {
            _id: null,
            lifetimeRevenue: { $sum: '$totalAmount' },
            lifetimeOrders: { $sum: 1 },
          },
        },
      ]),

      // Recent 5 orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber customer customerName customerEmail shippingAddress totalAmount orderStatus paymentStatus createdAt')
        .lean(),

      // Low stock items
      Product.find({ stock: { $lte: 5 } })
        .select('name sku stock price targetAudience category images')
        .limit(5)
        .lean(),

      // Recent Referrals from Referral model
      Referral.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('referrer', 'name email referralCode referralDiscountBalance phone')
        .populate('referredUser', 'name email referralCode totalOrders createdAt phone')
        .lean(),

      // Total Referrals Count
      Referral.countDocuments(),

      // Completed referral rewards total
      Referral.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$referrerDiscountAmount' } } },
      ]),

      // Fallback: Customers who used referral codes
      Customer.find({
        $or: [
          { referredBy: { $exists: true, $ne: '' } },
          { referralCodeUsed: { $exists: true, $ne: '' } },
          { referralDiscountBalance: { $gt: 0 } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email referralCode referredBy referralCodeUsed referralDiscountBalance hasUsedReferralDiscount totalOrders createdAt')
        .lean(),
    ]);

    const period = periodStats[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      pendingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
    };

    const lifetime = allTimeTotals[0] || {
      lifetimeRevenue: 0,
      lifetimeOrders: 0,
    };

    // Build rich referral list combining Referral documents and Customer referral records
    const formattedReferrals: any[] = [];
    const seenReferredUserIds = new Set<string>();

    if (Array.isArray(recentReferralsRaw) && recentReferralsRaw.length > 0) {
      recentReferralsRaw.forEach((r: any) => {
        const referrerObj = r.referrer || {};
        const referredObj = r.referredUser || {};
        if (referredObj._id) seenReferredUserIds.add(referredObj._id.toString());

        formattedReferrals.push({
          id: r._id.toString(),
          referrerName: referrerObj.name || 'Referrer',
          referrerEmail: referrerObj.email || '',
          referrerCode: r.referralCode || referrerObj.referralCode || '—',
          referrerRewardAmount: r.referrerDiscountAmount || 100,
          referrerRewardStatus: r.status === 'completed'
            ? 'Credited (₹100)'
            : r.referrerDiscountAvailable
            ? 'Available'
            : 'Pending First Order',
          referredUserName: referredObj.name || 'Referred Friend',
          referredUserEmail: referredObj.email || '',
          referredDiscountPercent: r.referredDiscountPercent || 15,
          referredDiscountBenefit: `${r.referredDiscountPercent || 15}% OFF First Order`,
          referredDiscountUsed: Boolean(r.referredDiscountUsed),
          status: r.status || 'pending',
          createdAt: r.createdAt || new Date(),
        });
      });
    }

    // Supplement from referred customers if needed
    if (Array.isArray(referredCustomersRaw)) {
      for (const cust of referredCustomersRaw) {
        if (!seenReferredUserIds.has(cust._id.toString())) {
          seenReferredUserIds.add(cust._id.toString());
          const codeUsed = cust.referredBy || cust.referralCodeUsed || '';
          // Find referrer by code
          let referrerDoc: any = null;
          if (codeUsed) {
            referrerDoc = await Customer.findOne({ referralCode: codeUsed.toUpperCase() })
              .select('name email referralCode referralDiscountBalance')
              .lean();
          }

          formattedReferrals.push({
            id: cust._id.toString(),
            referrerName: referrerDoc?.name || (codeUsed ? `Code: ${codeUsed}` : 'Direct Referral'),
            referrerEmail: referrerDoc?.email || '',
            referrerCode: codeUsed || '—',
            referrerRewardAmount: 100,
            referrerRewardStatus: (cust.totalOrders || 0) > 0 ? 'Credited (₹100)' : 'Pending First Order',
            referredUserName: cust.name || 'Customer',
            referredUserEmail: cust.email || '',
            referredDiscountPercent: 15,
            referredDiscountBenefit: '15% OFF First Order',
            referredDiscountUsed: Boolean(cust.hasUsedReferralDiscount || (cust.totalOrders || 0) > 0),
            status: (cust.totalOrders || 0) > 0 ? 'completed' : 'pending',
            createdAt: cust.createdAt || new Date(),
          });
        }
      }
    }

    const totalReferrerRewardsAmount = completedReferralRewardsAgg[0]?.total ||
      formattedReferrals.filter(r => r.status === 'completed').length * 100;

    const responseData = {
      totalRevenue: period.totalRevenue || 0,
      totalOrders: period.totalOrders || 0,
      lifetimeRevenue: lifetime.lifetimeRevenue || 0,
      lifetimeOrders: lifetime.lifetimeOrders || 0,
      totalProducts,
      lowStockCount: lowStockProducts,
      totalCategories,
      pendingReturns,
      orderStatusCounts: {
        pending: period.pendingOrders || 0,
        shipped: period.shippedOrders || 0,
        delivered: period.deliveredOrders || 0,
        cancelled: period.cancelledOrders || 0,
      },
      chartData: dailyBreakdown.map((d) => ({
        date: d._id,
        revenue: d.revenue,
        orders: d.ordersCount,
      })),
      recentOrders,
      lowStockItems,
      // Referral Analytics & Feed
      referralStats: {
        totalReferrals: Math.max(totalReferralsCount, formattedReferrals.length),
        completedReferrals: formattedReferrals.filter(r => r.status === 'completed').length,
        pendingReferrals: formattedReferrals.filter(r => r.status === 'pending').length,
        totalReferrerRewardsGiven: totalReferrerRewardsAmount,
        standardReferredDiscountPercent: 15,
        standardReferrerRewardRupees: 100,
        recentReferrals: formattedReferrals.slice(0, 8),
      },
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
