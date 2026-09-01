'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/admin/MetricCard';
import StatusBadge from '@/components/admin/StatusBadge';
import Link from 'next/link';
import {
  IndianRupee,
  ShoppingCart,
  ShoppingBag,
  AlertTriangle,
  FolderTree,
  RotateCcw,
  ArrowUpRight,
  Boxes,
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
} from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  lifetimeRevenue: number;
  lifetimeOrders: number;
  totalProducts: number;
  lowStockCount: number;
  totalCategories: number;
  pendingReturns: number;
  orderStatusCounts: {
    pending: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  chartData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    customerName?: string;
    customerEmail?: string;
    customer?: { name?: string; email?: string };
    shippingAddress?: { name?: string };
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
  const [dateRange, setDateRange] = useState<'weekly' | 'monthly' | 'custom'>('monthly');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('range', dateRange);
      if (dateRange === 'custom' && customFrom && customTo) {
        params.append('from', customFrom);
        params.append('to', customTo);
      }

      const res = await fetch(`/api/admin/dashboard/stats?${params.toString()}`);
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
  }, [dateRange]);

  // Donut chart calculations
  const statusCounts = stats?.orderStatusCounts || { pending: 0, shipped: 0, delivered: 0, cancelled: 0 };
  const totalStatusOrders =
    statusCounts.pending + statusCounts.shipped + statusCounts.delivered + statusCounts.cancelled || 1;

  const deliveredPct = Math.round((statusCounts.delivered / totalStatusOrders) * 100);
  const shippedPct = Math.round((statusCounts.shipped / totalStatusOrders) * 100);
  const pendingPct = Math.round((statusCounts.pending / totalStatusOrders) * 100);
  const cancelledPct = Math.round((statusCounts.cancelled / totalStatusOrders) * 100);

  // SVG Donut calculation
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const strokeDelivered = (deliveredPct / 100) * circumference;
  const strokeShipped = (shippedPct / 100) * circumference;
  const strokePending = (pendingPct / 100) * circumference;
  const strokeCancelled = (cancelledPct / 100) * circumference;

  // Max revenue for bar scale
  const maxChartRevenue = stats?.chartData?.length
    ? Math.max(...stats.chartData.map((d) => d.revenue), 1000)
    : 1000;

  return (
    <div className="space-y-5 font-sansation">
      {/* Header & Date Range Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#e8e2d8] shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#89591C]" /> Real-Time Analytics & Revenue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store performance, revenue insights in INR (₹), and fulfillment metrics
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#faf8f5] p-1 rounded-xl border border-[#e8e2d8]">
            <button
              type="button"
              onClick={() => setDateRange('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                dateRange === 'weekly'
                  ? 'bg-[#89591C] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly (7D)
            </button>
            <button
              type="button"
              onClick={() => setDateRange('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                dateRange === 'monthly'
                  ? 'bg-[#89591C] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly (30D)
            </button>
            <button
              type="button"
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                dateRange === 'custom'
                  ? 'bg-[#89591C] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Date
            </button>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#e8e2d8] rounded-xl text-slate-700"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#e8e2d8] rounded-xl text-slate-700"
              />
              <button
                type="button"
                onClick={fetchStats}
                className="px-3 py-1.5 bg-[#89591C] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}

          <Link
            href="/admin/products/new"
            className="px-3.5 py-2 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            + Add New Shoe
          </Link>
        </div>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          title="Period Revenue"
          value={`₹${stats?.totalRevenue?.toLocaleString('en-IN') || '0'}`}
          subtitle={`${dateRange.toUpperCase()} store sales`}
          icon={IndianRupee}
          color="bronze"
          trend="+18.4%"
        />
        <MetricCard
          title="Orders Placed"
          value={stats?.totalOrders || 0}
          subtitle="Processed in period"
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

      {/* ── CHARTS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Revenue Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#e8e2d8] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue Timeline (INR ₹)</h3>
              <p className="text-[11px] text-slate-500 font-normal">
                Daily revenue breakdown for {dateRange === 'weekly' ? 'the past 7 days' : 'the past 30 days'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-semibold block">Total Period Revenue</span>
              <span className="text-lg font-bold text-[#89591C]">₹{stats?.totalRevenue?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Bar Chart Representation */}
          {stats?.chartData && stats.chartData.length > 0 ? (
            <div className="pt-4">
              <div className="h-48 flex items-end gap-2 sm:gap-3 border-b border-[#e8e2d8] pb-2">
                {stats.chartData.map((point, i) => {
                  const heightPct = Math.max(8, Math.round((point.revenue / maxChartRevenue) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-md">
                        ₹{point.revenue.toLocaleString('en-IN')} ({point.orders} orders)
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full max-w-[28px] bg-gradient-to-t from-[#89591C] to-[#d49955] rounded-t-md hover:brightness-110 transition-all cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-400 truncate max-w-full font-mono">
                        {point.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
              No sales transactions in selected period.
            </div>
          )}
        </div>

        {/* Right: Round / Donut Shaped Order Status Chart (1 col) */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-[#89591C]" /> Fulfillment Status
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">Order lifecycle breakdown</p>
            </div>
          </div>

          {/* SVG Round Donut Chart */}
          <div className="flex flex-col items-center justify-center py-2 relative">
            <svg width="170" height="170" viewBox="0 0 170 170" className="transform -rotate-90">
              <circle
                cx="85"
                cy="85"
                r={radius}
                stroke="#f1ebe3"
                strokeWidth="18"
                fill="transparent"
              />
              {/* Delivered slice (Emerald) */}
              <circle
                cx="85"
                cy="85"
                r={radius}
                stroke="#10b981"
                strokeWidth="18"
                strokeDasharray={`${strokeDelivered} ${circumference}`}
                strokeDashoffset="0"
                fill="transparent"
              />
              {/* Shipped slice (Purple) */}
              <circle
                cx="85"
                cy="85"
                r={radius}
                stroke="#8b5cf6"
                strokeWidth="18"
                strokeDasharray={`${strokeShipped} ${circumference}`}
                strokeDashoffset={-strokeDelivered}
                fill="transparent"
              />
              {/* Pending slice (Amber) */}
              <circle
                cx="85"
                cy="85"
                r={radius}
                stroke="#f59e0b"
                strokeWidth="18"
                strokeDasharray={`${strokePending} ${circumference}`}
                strokeDashoffset={-(strokeDelivered + strokeShipped)}
                fill="transparent"
              />
              {/* Cancelled slice (Rose) */}
              <circle
                cx="85"
                cy="85"
                r={radius}
                stroke="#f43f5e"
                strokeWidth="18"
                strokeDasharray={`${strokeCancelled} ${circumference}`}
                strokeDashoffset={-(strokeDelivered + strokeShipped + strokePending)}
                fill="transparent"
              />
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-900">{stats?.totalOrders || 0}</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Orders</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-slate-600">Delivered ({statusCounts.delivered})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
              <span className="text-slate-600">Shipped ({statusCounts.shipped})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="text-slate-600">Pending ({statusCounts.pending})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
              <span className="text-slate-600">Cancelled ({statusCounts.cancelled})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#e8e2d8] shadow-2xs space-y-3">
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
                  stats?.recentOrders?.map((order) => {
                    const name = order.customerName || order.customer?.name || order.shippingAddress?.name || 'Customer';
                    const email = order.customerEmail || order.customer?.email || '';
                    return (
                      <tr key={order._id} className="hover:bg-[#faf4ec]/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[#89591C]">{order.orderNumber}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{name}</div>
                          <div className="text-[10px] text-slate-400">{email}</div>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts (1 Col) */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] shadow-2xs space-y-3">
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
                  className="bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-2.5 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 font-normal">
                      SKU: {item.sku} • {item.targetAudience}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
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
