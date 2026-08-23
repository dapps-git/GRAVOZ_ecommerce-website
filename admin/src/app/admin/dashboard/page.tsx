'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/admin/MetricCard';
import StatusBadge from '@/components/admin/StatusBadge';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingCart,
  ShoppingBag,
  AlertTriangle,
  FolderTree,
  RotateCcw,
  ArrowUpRight,
  Boxes,
} from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockCount: number;
  totalCategories: number;
  pendingReturns: number;
  orderStatusCounts: {
    pending: number;
    shipped: number;
    delivered: number;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    customer: { name: string; email: string };
    totalAmount: number;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  lowStockItems: Array<{
    _id: string;
    name: string;
    sku: string;
    stock: number;
    price: number;
    targetAudience: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard/stats');
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500 animate-pulse font-light">
        Loading Aggregated Admin Analytics...
      </div>
    );
  }

  return (
    <div className="space-y-4 font-light">
      {/* Action Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-md border border-[#e8e2d8]">
        <p className="text-xs text-slate-500 font-normal">
          Real-time analytics & catalog status for Men, Women & Baby shoe collections
        </p>
        <Link
          href="/admin/products/new"
          className="px-3.5 py-1.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-md shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          + Add New Shoe Product
        </Link>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`}
          subtitle="Lifetime store sales"
          icon={DollarSign}
          color="bronze"
          trend="+18.4%"
        />
        <MetricCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          subtitle="Processed orders"
          icon={ShoppingCart}
          color="indigo"
          trend="+12%"
        />
        <MetricCard
          title="Shoe Products"
          value={stats?.totalProducts || 0}
          subtitle="Active catalog items"
          icon={ShoppingBag}
          color="cyan"
        />
        <MetricCard
          title="Low Stock Warning"
          value={stats?.lowStockCount || 0}
          subtitle="Stock ≤ 5 pairs"
          icon={AlertTriangle}
          color={stats?.lowStockCount && stats.lowStockCount > 0 ? 'rose' : 'emerald'}
        />
        <MetricCard
          title="Categories"
          value={stats?.totalCategories || 0}
          subtitle="Men, Women, Babies"
          icon={FolderTree}
          color="amber"
        />
        <MetricCard
          title="Pending Returns"
          value={stats?.pendingReturns || 0}
          subtitle="Refund requests"
          icon={RotateCcw}
          color="rose"
        />
      </div>

      {/* Main Grid: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-md p-4 border border-[#e8e2d8] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Customer Orders</h3>
              <p className="text-[11px] text-slate-500 font-normal">Latest transactions across Men, Women & Baby shoes</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#89591C] hover:underline flex items-center gap-1"
            >
              View All Orders <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="text-slate-600 font-semibold uppercase tracking-wider border-b border-[#e8e2d8] bg-[#faf8f5]">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ebd9]">
                {stats?.recentOrders?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 font-normal">
                      No recent orders.
                    </td>
                  </tr>
                ) : (
                  stats?.recentOrders?.map((order) => (
                    <tr key={order._id} className="hover:bg-[#faf4ec]/60 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#89591C]">{order.orderNumber}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{order.customer.name}</div>
                        <div className="text-[10px] text-slate-400">{order.customer.email}</div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">${order.totalAmount.toFixed(2)}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={order.orderStatus} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="text-xs font-semibold text-slate-600 hover:text-[#89591C] underline"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts (1 Col) */}
        <div className="bg-white rounded-md p-4 border border-[#e8e2d8] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-[#89591C]" />
              <h3 className="text-sm font-bold text-slate-900">Low Stock Watch</h3>
            </div>
            <Link
              href="/admin/stock"
              className="text-xs font-semibold text-[#89591C] hover:underline"
            >
              Stock Control
            </Link>
          </div>

          <div className="space-y-2">
            {stats?.lowStockItems?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 font-normal">All shoe stocks healthy!</p>
            ) : (
              stats?.lowStockItems?.map((item) => (
                <div
                  key={item._id}
                  className="bg-[#faf8f5] border border-[#e8e2d8] rounded-md p-2.5 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 font-normal">
                      SKU: {item.sku} • {item.targetAudience}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm border border-rose-200">
                      {item.stock} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
