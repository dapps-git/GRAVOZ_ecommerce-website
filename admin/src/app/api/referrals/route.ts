import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Referral from '@/models/Referral';
import Customer from '@/models/Customer';
import Order from '@/models/Order';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const statusFilter = searchParams.get('status')?.trim() || ''; // 'purchased' | 'pending' | 'all'

    // 1. Fetch all Referral documents populated with Customer data
    const referralDocs = await Referral.find()
      .populate('referrer', 'name email phone referralCode referralDiscountBalance rewardPoints tier')
      .populate('referredUser', 'name email phone referralCode totalOrders totalSpent createdAt isActive tier')
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch all customers with referredBy or referralCodeUsed to catch any non-indexed links
    const allReferredCustomers = await Customer.find({
      $or: [
        { referredBy: { $exists: true, $ne: '' } },
        { referralCodeUsed: { $exists: true, $ne: '' } },
      ],
    })
      .select('name email phone referralCode referredBy referralCodeUsed totalOrders totalSpent createdAt isActive tier')
      .lean();

    // 3. Fetch all orders that might belong to referred customers
    const allOrders = await Order.find({
      orderStatus: { $ne: 'cancelled' },
    })
      .select('orderNumber customerId customerEmail customerPhone totalAmount items paymentMethod paymentStatus orderStatus createdAt referralDiscount referralDiscountType')
      .sort({ createdAt: -1 })
      .lean();

    // Map orders by customer ID & email
    const ordersByCustomerId = new Map<string, any[]>();
    const ordersByCustomerEmail = new Map<string, any[]>();

    allOrders.forEach((ord: any) => {
      if (ord.customerId) {
        const idKey = String(ord.customerId);
        if (!ordersByCustomerId.has(idKey)) ordersByCustomerId.set(idKey, []);
        ordersByCustomerId.get(idKey)?.push(ord);
      }
      if (ord.customerEmail) {
        const emailKey = String(ord.customerEmail).toLowerCase().trim();
        if (!ordersByCustomerEmail.has(emailKey)) ordersByCustomerEmail.set(emailKey, []);
        ordersByCustomerEmail.get(emailKey)?.push(ord);
      }
    });

    // 4. Build unified list of referral records
    const processedReferralMap = new Map<string, any>();

    for (const ref of referralDocs) {
      if (!ref.referrer || !ref.referredUser) continue;
      const refUserId = String((ref.referredUser as any)._id);
      const refUserEmail = ((ref.referredUser as any).email || '').toLowerCase().trim();

      // Find all orders placed by this referred user
      const userOrders = [
        ...(ordersByCustomerId.get(refUserId) || []),
        ...(ordersByCustomerEmail.get(refUserEmail) || []),
      ].filter((v, idx, arr) => arr.findIndex((t) => String(t._id) === String(v._id)) === idx);

      const hasPurchased = userOrders.length > 0;
      const firstOrder = userOrders.length > 0 ? userOrders[userOrders.length - 1] : null;
      const latestOrder = userOrders.length > 0 ? userOrders[0] : null;
      const totalPurchasedAmount = userOrders.reduce((sum, ord) => sum + (Number(ord.totalAmount) || 0), 0);

      const itemDetails = userOrders.flatMap((ord) =>
        (ord.items || []).map((itm: any) => ({
          orderNumber: ord.orderNumber,
          name: itm.name,
          size: itm.size,
          color: itm.color,
          quantity: itm.quantity,
          price: itm.price,
          imageUrl: itm.imageUrl || itm.image || '',
        }))
      );

      const key = `${String((ref.referrer as any)._id)}_${refUserId}`;
      processedReferralMap.set(key, {
        _id: String(ref._id),
        referralCode: ref.referralCode,
        referrer: ref.referrer,
        referredUser: ref.referredUser,
        status: hasPurchased ? 'completed' : ref.status || 'pending',
        referredDiscountPercent: ref.referredDiscountPercent || 15,
        referredDiscountUsed: ref.referredDiscountUsed || hasPurchased,
        referrerDiscountAmount: ref.referrerDiscountAmount || 100,
        referrerDiscountAvailable: ref.referrerDiscountAvailable || hasPurchased,
        referrerDiscountUsed: ref.referrerDiscountUsed || false,
        hasPurchased,
        ordersCount: userOrders.length,
        totalPurchasedAmount,
        firstOrder: firstOrder
          ? {
              orderNumber: firstOrder.orderNumber,
              totalAmount: firstOrder.totalAmount,
              paymentMethod: firstOrder.paymentMethod || 'COD',
              orderStatus: firstOrder.orderStatus,
              createdAt: firstOrder.createdAt,
            }
          : null,
        latestOrder: latestOrder
          ? {
              orderNumber: latestOrder.orderNumber,
              totalAmount: latestOrder.totalAmount,
              paymentMethod: latestOrder.paymentMethod || 'COD',
              orderStatus: latestOrder.orderStatus,
              createdAt: latestOrder.createdAt,
            }
          : null,
        purchasedItems: itemDetails,
        ordersList: userOrders.map((o) => ({
          orderNumber: o.orderNumber,
          totalAmount: o.totalAmount,
          paymentMethod: o.paymentMethod || 'COD',
          orderStatus: o.orderStatus,
          createdAt: o.createdAt,
          itemCount: (o.items || []).length,
        })),
        createdAt: ref.createdAt,
      });
    }

    // 5. Catch referred customers who registered with referral code but might not have a Referral document
    for (const cust of allReferredCustomers) {
      const custId = String(cust._id);
      const custEmail = (cust.email || '').toLowerCase().trim();

      // Check if already processed
      let alreadyIncluded = false;
      for (const item of processedReferralMap.values()) {
        if (String(item.referredUser?._id) === custId) {
          alreadyIncluded = true;
          break;
        }
      }
      if (alreadyIncluded) continue;

      // Find the referrer customer by referral code or ID
      let referrerCust: any = null;
      if (cust.referredBy) {
        referrerCust = await Customer.findById(cust.referredBy)
          .select('name email phone referralCode referralDiscountBalance rewardPoints tier')
          .lean();
      }
      if (!referrerCust && cust.referralCodeUsed) {
        referrerCust = await Customer.findOne({ referralCode: cust.referralCodeUsed.toUpperCase() })
          .select('name email phone referralCode referralDiscountBalance rewardPoints tier')
          .lean();
      }

      if (referrerCust) {
        const userOrders = [
          ...(ordersByCustomerId.get(custId) || []),
          ...(ordersByCustomerEmail.get(custEmail) || []),
        ].filter((v, idx, arr) => arr.findIndex((t) => String(t._id) === String(v._id)) === idx);

        const hasPurchased = userOrders.length > 0;
        const firstOrder = userOrders.length > 0 ? userOrders[userOrders.length - 1] : null;
        const latestOrder = userOrders.length > 0 ? userOrders[0] : null;
        const totalPurchasedAmount = userOrders.reduce((sum, ord) => sum + (Number(ord.totalAmount) || 0), 0);

        const itemDetails = userOrders.flatMap((ord) =>
          (ord.items || []).map((itm: any) => ({
            orderNumber: ord.orderNumber,
            name: itm.name,
            size: itm.size,
            color: itm.color,
            quantity: itm.quantity,
            price: itm.price,
            imageUrl: itm.imageUrl || itm.image || '',
          }))
        );

        const key = `synth_${String(referrerCust._id)}_${custId}`;
        processedReferralMap.set(key, {
          _id: key,
          referralCode: referrerCust.referralCode,
          referrer: referrerCust,
          referredUser: cust,
          status: hasPurchased ? 'completed' : 'pending',
          referredDiscountPercent: 15,
          referredDiscountUsed: hasPurchased,
          referrerDiscountAmount: 100,
          referrerDiscountAvailable: hasPurchased,
          referrerDiscountUsed: false,
          hasPurchased,
          ordersCount: userOrders.length,
          totalPurchasedAmount,
          firstOrder: firstOrder
            ? {
                orderNumber: firstOrder.orderNumber,
                totalAmount: firstOrder.totalAmount,
                paymentMethod: firstOrder.paymentMethod || 'COD',
                orderStatus: firstOrder.orderStatus,
                createdAt: firstOrder.createdAt,
              }
            : null,
          latestOrder: latestOrder
            ? {
                orderNumber: latestOrder.orderNumber,
                totalAmount: latestOrder.totalAmount,
                paymentMethod: latestOrder.paymentMethod || 'COD',
                orderStatus: latestOrder.orderStatus,
                createdAt: latestOrder.createdAt,
              }
            : null,
          purchasedItems: itemDetails,
          ordersList: userOrders.map((o) => ({
            orderNumber: o.orderNumber,
            totalAmount: o.totalAmount,
            paymentMethod: o.paymentMethod || 'COD',
            orderStatus: o.orderStatus,
            createdAt: o.createdAt,
            itemCount: (o.items || []).length,
          })),
          createdAt: cust.createdAt,
        });
      }
    }

    let referrals = Array.from(processedReferralMap.values());

    // 6. Apply Search Query Filter
    if (q) {
      const lowerQ = q.toLowerCase();
      referrals = referrals.filter((r) => {
        const referrerName = r.referrer?.name?.toLowerCase() || '';
        const referrerEmail = r.referrer?.email?.toLowerCase() || '';
        const referrerCode = r.referrer?.referralCode?.toLowerCase() || '';
        const refereeName = r.referredUser?.name?.toLowerCase() || '';
        const refereeEmail = r.referredUser?.email?.toLowerCase() || '';
        const refereePhone = r.referredUser?.phone?.toLowerCase() || '';
        const refCode = r.referralCode?.toLowerCase() || '';
        const orderNum = r.firstOrder?.orderNumber?.toLowerCase() || '';

        return (
          referrerName.includes(lowerQ) ||
          referrerEmail.includes(lowerQ) ||
          referrerCode.includes(lowerQ) ||
          refereeName.includes(lowerQ) ||
          refereeEmail.includes(lowerQ) ||
          refereePhone.includes(lowerQ) ||
          refCode.includes(lowerQ) ||
          orderNum.includes(lowerQ)
        );
      });
    }

    // 7. Apply Status Filter
    if (statusFilter === 'purchased') {
      referrals = referrals.filter((r) => r.hasPurchased);
    } else if (statusFilter === 'pending') {
      referrals = referrals.filter((r) => !r.hasPurchased);
    }

    // 8. Calculate Overall Referral Performance KPIs
    const allReferralsArray = Array.from(processedReferralMap.values());
    const totalReferredUsers = allReferralsArray.length;
    const purchasedReferrals = allReferralsArray.filter((r) => r.hasPurchased);
    const totalPurchasedUsers = purchasedReferrals.length;
    const conversionRate =
      totalReferredUsers > 0 ? ((totalPurchasedUsers / totalReferredUsers) * 100).toFixed(1) : '0';
    const totalReferralRevenue = purchasedReferrals.reduce((sum, r) => sum + r.totalPurchasedAmount, 0);
    const totalRewardsCredited = purchasedReferrals.length * 100; // ₹100 per successful purchased referral

    // 9. Aggregate Top Referrers Leaderboard
    const referrerStatsMap = new Map<string, any>();
    for (const item of allReferralsArray) {
      if (!item.referrer) continue;
      const refId = String(item.referrer._id);
      if (!referrerStatsMap.has(refId)) {
        referrerStatsMap.set(refId, {
          _id: refId,
          name: item.referrer.name,
          email: item.referrer.email,
          phone: item.referrer.phone,
          referralCode: item.referrer.referralCode,
          referralDiscountBalance: item.referrer.referralDiscountBalance || 0,
          rewardPoints: item.referrer.rewardPoints || 0,
          tier: item.referrer.tier || 'Silver',
          totalFriendsInvited: 0,
          totalPurchasedFriends: 0,
          totalRevenueDriven: 0,
        });
      }
      const stat = referrerStatsMap.get(refId);
      stat.totalFriendsInvited += 1;
      if (item.hasPurchased) {
        stat.totalPurchasedFriends += 1;
        stat.totalRevenueDriven += item.totalPurchasedAmount;
      }
    }

    const topReferrers = Array.from(referrerStatsMap.values()).sort(
      (a, b) => b.totalPurchasedFriends - a.totalPurchasedFriends || b.totalFriendsInvited - a.totalFriendsInvited
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalReferredUsers,
        totalPurchasedUsers,
        pendingPurchases: totalReferredUsers - totalPurchasedUsers,
        conversionRate,
        totalReferralRevenue,
        totalRewardsCredited,
        activeReferrersCount: topReferrers.length,
      },
      topReferrers,
      referrals,
    });
  } catch (error: any) {
    console.error('Admin referrals fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch referrals' }, { status: 500 });
  }
}
