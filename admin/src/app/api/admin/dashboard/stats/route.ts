import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { ReturnRefund } from '@/models/ReturnRefund';
import { getCache, setCache } from '@/lib/redis';

export async function GET() {
  try {
    // Check Redis cache first (Rule 11)
    const cacheKey = 'admin:dashboard:stats';
    const cachedStats = await getCache<Record<string, unknown>>(cacheKey);
    if (cachedStats) {
      return NextResponse.json(cachedStats);
    }

    await connectDB();

    // Aggregation pipeline for order statistics (Rule 18)
    const orderStatsPipeline = await Order.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$totalAmount' },
                totalOrders: { $sum: 1 },
                paidOrders: {
                  $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
                },
                pendingOrders: {
                  $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] },
                },
                shippedOrders: {
                  $sum: { $cond: [{ $eq: ['$orderStatus', 'shipped'] }, 1, 0] },
                },
                deliveredOrders: {
                  $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] },
                },
              },
            },
          ],
          recentOrders: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                orderNumber: 1,
                'customer.name': 1,
                'customer.email': 1,
                totalAmount: 1,
                orderStatus: 1,
                paymentStatus: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]);

    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ stock: { $lte: 5 } });
    const totalCategories = await Category.countDocuments();
    const pendingReturns = await ReturnRefund.countDocuments({ status: 'requested' });

    const totals = orderStatsPipeline[0]?.totals[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
    };

    const recentOrders = orderStatsPipeline[0]?.recentOrders || [];

    // Low stock items list (lean select)
    const lowStockItems = await Product.find({ stock: { $lte: 5 } })
      .select('name sku stock price targetAudience category images')
      .limit(5)
      .lean();

    const responseData = {
      totalRevenue: totals.totalRevenue,
      totalOrders: totals.totalOrders,
      totalProducts,
      lowStockCount: lowStockProducts,
      totalCategories,
      pendingReturns,
      orderStatusCounts: {
        pending: totals.pendingOrders,
        shipped: totals.shippedOrders,
        delivered: totals.deliveredOrders,
      },
      recentOrders,
      lowStockItems,
    };

    // Cache for 60 seconds
    await setCache(cacheKey, responseData, 60);

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
