import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { ReturnRefund } from '@/models/ReturnRefund';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
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

    // Aggregate filtered orders stats & daily breakdown for charts
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
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
