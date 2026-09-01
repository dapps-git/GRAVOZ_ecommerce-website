'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/admin/Modal';
import {
  Users,
  Search,
  Share2,
  Eye,
  Smartphone,
  Mail,
  Award,
  ShoppingBag,
  IndianRupee,
  Package,
  TrendingUp,
  Filter,
} from 'lucide-react';

interface ActivityLog {
  action: string;
  details?: string;
  timestamp: string;
}

interface CustomerItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  rewardPoints: number;
  referralCode: string;
  referredBy?: string;
  totalOrders: number;
  totalSpent: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  activityLogs?: ActivityLog[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [adjustPointsUser, setAdjustPointsUser] = useState<CustomerItem | null>(null);
  const [pointsInput, setPointsInput] = useState('');
  const [tierInput, setTierInput] = useState<'Silver' | 'Gold' | 'Platinum'>('Silver');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (tierFilter) params.append('tier', tierFilter);

      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, tierFilter]);

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustPointsUser) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: adjustPointsUser._id,
          rewardPoints: Number(pointsInput),
          tier: tierInput,
        }),
      });
      if (res.ok) {
        setAdjustPointsUser(null);
        fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // KPIs
  const totalCustomers = customers.length;
  const totalOrdersSum = customers.reduce((acc, c) => acc + (c.totalOrders || 0), 0);
  const totalRevenue = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const avgOrderValue = totalOrdersSum > 0 ? Math.round(totalRevenue / totalOrdersSum) : 0;

  return (
    <div className="space-y-5 font-sansation">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e2d8] pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#89591C]" /> Customer Orders & Loyalty
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track ordering customers, lifetime spend, order history, loyalty tiers, and referral bonuses
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-[#e8e2d8] shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Customers</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalCustomers}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#e8e2d8] shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Total Orders Placed</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{totalOrdersSum}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#e8e2d8] shadow-2xs">
          <span className="text-[11px] font-semibold text-[#89591C] uppercase tracking-wider block">Lifetime Total Revenue</span>
          <span className="text-2xl font-bold text-[#89591C] mt-1 block">₹{totalRevenue.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#e8e2d8] shadow-2xs">
          <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider block">Avg Order Value (AOV)</span>
          <span className="text-2xl font-bold text-purple-700 mt-1 block">₹{avgOrderValue.toLocaleString()}</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="flex-1 w-full flex items-center gap-2 bg-white border border-[#e8e2d8] rounded-xl px-3 py-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search customers by name, email, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 bg-transparent focus:outline-none placeholder-slate-400"
          />
        </div>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="h-10 px-3 rounded-xl bg-white border border-[#e8e2d8] text-xs font-semibold text-slate-700 shadow-2xs"
        >
          <option value="">All Loyalty Tiers</option>
          <option value="Silver">Silver Tier</option>
          <option value="Gold">Gold Tier</option>
          <option value="Platinum">Platinum Tier</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e8e2d8] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8f5] border-b border-[#e8e2d8] text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Orders Placed</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Reward Points</th>
                <th className="py-3 px-4">Loyalty Tier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eae1] text-xs text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customer records found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-[#faf8f5]/80 transition-colors">
                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#89591C] text-white font-bold text-xs flex items-center justify-center shadow-2xs flex-shrink-0">
                          {c.name ? c.name.substring(0, 2).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{c.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Share2 className="w-3 h-3 text-[#89591C]" /> {c.referralCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Orders Placed */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg inline-flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{c.totalOrders || 0} Orders</span>
                      </span>
                    </td>

                    {/* Lifetime Spend */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 text-sm">
                        ₹{(c.totalSpent || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Reward Points */}
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-[#89591C] text-xs">
                        {c.rewardPoints || 0} Pts
                      </span>
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                          c.tier === 'Platinum'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : c.tier === 'Gold'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {c.tier || 'Silver'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-[#faf8f5] hover:text-[#89591C] transition-colors"
                          title="View Customer Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustPointsUser(c);
                            setPointsInput(String(c.rewardPoints || 0));
                            setTierInput(c.tier || 'Silver');
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-[#faf8f5] hover:text-[#89591C] transition-colors text-[11px] font-bold"
                          title="Adjust Points & Tier"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Details */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Order Profile: ${selectedCustomer.name}`}
        >
          <div className="space-y-4 font-sansation text-xs text-slate-800">
            <div className="p-3.5 bg-[#faf8f5] rounded-xl border border-[#e8e2d8] grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Orders</span>
                <span className="font-bold text-slate-900 text-sm">{selectedCustomer.totalOrders || 0} Orders</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Spend</span>
                <span className="font-bold text-emerald-700 text-sm">₹{(selectedCustomer.totalSpent || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Reward Points</span>
                <span className="font-bold text-[#89591C]">{selectedCustomer.rewardPoints || 0} Pts</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Loyalty Tier</span>
                <span className="font-bold text-slate-900">{selectedCustomer.tier || 'Silver'}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-900 block mb-2">Customer Activity & Order Logs:</span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[#e8e2d8] rounded-xl p-2.5 bg-[#faf8f5]">
                {selectedCustomer.activityLogs && selectedCustomer.activityLogs.length > 0 ? (
                  selectedCustomer.activityLogs.map((act, i) => (
                    <div key={i} className="flex items-start justify-between text-[11px] py-1 border-b border-[#f0eae1] last:border-none">
                      <div>
                        <span className="font-semibold text-slate-800">{act.action}</span>
                        {act.details && <span className="text-slate-500 block">{act.details}</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(act.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic">No activity recorded.</span>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Adjust Reward Points & Tier */}
      {adjustPointsUser && (
        <Modal
          isOpen={!!adjustPointsUser}
          onClose={() => setAdjustPointsUser(null)}
          title={`Adjust Points & Tier — ${adjustPointsUser.name}`}
        >
          <form onSubmit={handleUpdateCustomer} className="space-y-3 font-sansation">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reward Points</label>
              <input
                type="number"
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loyalty Tier</label>
              <select
                value={tierInput}
                onChange={(e) => setTierInput(e.target.value as any)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              >
                <option value="Silver">Silver Tier</option>
                <option value="Gold">Gold Tier</option>
                <option value="Platinum">Platinum Tier</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#89591C] hover:bg-[#724a17] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Update Customer Profile
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
