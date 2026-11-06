'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Users,
  ShoppingCart,
  IndianRupee,
  Link as LinkIcon,
  Copy,
  Check,
  Plus,
  Search,
  ExternalLink,
  ChevronRight,
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Percent,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface InfluencerItem {
  _id: string;
  name: string;
  affiliateCode: string;
  affiliateLink: string;
  email?: string;
  phone?: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  totalCustomers: number;
  totalOrders: number;
  totalSales: number;
  pendingCommission: number;
  approvedCommission: number;
  paidCommission: number;
}

interface AffiliateStats {
  totalInfluencers: number;
  totalAffiliateCustomers: number;
  totalAffiliateOrders: number;
  totalAffiliateSales: number;
  totalPendingCommission: number;
  totalApprovedCommission: number;
  totalPaidCommission: number;
}

interface DetailCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  tier?: string;
}

interface DetailOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  subtotal: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  commissionAmount: number;
  commissionRate: number;
  commissionType: string;
  commissionStatus: string;
  createdAt: string;
}

interface DetailCommission {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderSubtotal: number;
  orderTotal: number;
  commissionType: string;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paidAt?: string;
  createdAt: string;
}

export default function AdminAffiliatesPage() {
  const [loading, setLoading] = useState(true);
  const [influencers, setInfluencers] = useState<InfluencerItem[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add / Edit Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    affiliateCode: '',
    commissionType: 'percentage' as 'percentage' | 'fixed',
    commissionValue: 5,
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  // Drawer / View Details state
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<{
    influencer: InfluencerItem;
    stats: any;
    customers: DetailCustomer[];
    orders: DetailOrder[];
    commissions: DetailCommission[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'customers' | 'orders'>('customers');
  const [updatingCommId, setUpdatingCommId] = useState<string | null>(null);

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/affiliates');
      const data = await res.json();
      if (res.ok && data.success) {
        setInfluencers(data.influencers || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Error loading affiliates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCreateInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name.trim()) {
      setFormError('Influencer name is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          affiliateCode: '',
          commissionType: 'percentage',
          commissionValue: 5,
          email: '',
          phone: '',
          status: 'active',
          notes: '',
        });
        await fetchAffiliates();
      } else {
        setFormError(data.error || 'Failed to create influencer');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const openInfluencerDetails = async (id: string) => {
    setSelectedInfluencerId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDetailData(data);
      }
    } catch (err) {
      console.error('Error fetching influencer details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateCommissionStatus = async (commissionId: string, newStatus: string) => {
    setUpdatingCommId(commissionId);
    try {
      const res = await fetch(`/api/admin/affiliates/commissions/${commissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        // Refresh details and overview
        if (selectedInfluencerId) {
          const detailRes = await fetch(`/api/admin/affiliates/${selectedInfluencerId}`);
          const detailJson = await detailRes.json();
          if (detailRes.ok && detailJson.success) {
            setDetailData(detailJson);
          }
        }
        fetchAffiliates();
      }
    } catch (err) {
      console.error('Error updating commission status:', err);
    } finally {
      setUpdatingCommId(null);
    }
  };

  const filteredInfluencers = influencers.filter((inf) => {
    const matchesSearch =
      inf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inf.affiliateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inf._id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inf.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-[#e8e2d8] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#89591C]/10 flex items-center justify-center text-[#89591C]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Affiliate Marketing & Influencer Tracking
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Generate affiliate tracking links, assign customers on first-touch, and track lifetime commission.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAffiliates}
            disabled={loading}
            className="p-2.5 rounded-lg border border-[#e8e2d8] hover:bg-[#FAF7F3] text-slate-600 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#89591C] hover:bg-[#724814] text-white text-sm font-medium transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Influencer</span>
          </button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#e8e2d8] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Influencers</span>
            <Award className="w-4 h-4 text-[#89591C]" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats?.totalInfluencers ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active affiliate partners</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e8e2d8] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Associated Customers</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats?.totalAffiliateCustomers ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Customers assigned via links</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e8e2d8] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Affiliate Orders</span>
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats?.totalAffiliateOrders ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total attributed purchases</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e8e2d8] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Sales</span>
            <IndianRupee className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">₹{(stats?.totalAffiliateSales ?? 0).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-400 mt-1">Gross revenue generated</div>
        </div>
      </div>

      {/* ── Commission Summary Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-4 rounded-xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Commission</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-amber-900">
            ₹{(stats?.totalPendingCommission ?? 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Awaiting delivery or return period</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 p-4 rounded-xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Commission</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-blue-900">
            ₹{(stats?.totalApprovedCommission ?? 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-blue-700/80 mt-0.5">Delivered & ready for payment</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Paid Commission</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-emerald-900">
            ₹{(stats?.totalPaidCommission ?? 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">Successfully disbursed to partners</p>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="bg-white p-4 rounded-xl border border-[#e8e2d8] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, or ObjectId..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#e8e2d8] text-sm focus:outline-hidden focus:border-[#89591C] bg-[#FAF7F3]/40"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#e8e2d8] text-sm bg-white focus:outline-hidden focus:border-[#89591C]"
          >
            <option value="all">All Influencers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* ── Influencers Table ── */}
      <div className="bg-white rounded-xl border border-[#e8e2d8] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-[#FAF7F3] text-[11px] uppercase tracking-wider text-slate-500 border-b border-[#e8e2d8]">
              <tr>
                <th className="py-3 px-4 font-semibold">Influencer Name & ID</th>
                <th className="py-3 px-4 font-semibold">Affiliate Code</th>
                <th className="py-3 px-4 font-semibold">Affiliate Link</th>
                <th className="py-3 px-4 font-semibold text-center">Commission</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Customers</th>
                <th className="py-3 px-4 font-semibold text-center">Orders</th>
                <th className="py-3 px-4 font-semibold text-right">Total Sales</th>
                <th className="py-3 px-4 font-semibold text-right">Commission Breakdown</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e2d8]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#89591C] mb-2" />
                    Loading affiliate influencers...
                  </td>
                </tr>
              ) : filteredInfluencers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                    No affiliate influencers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInfluencers.map((inf) => (
                  <tr
                    key={inf._id}
                    className="hover:bg-[#FAF7F3]/60 transition-colors cursor-pointer group"
                    onClick={() => openInfluencerDetails(inf._id)}
                  >
                    {/* Name & ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 group-hover:text-[#89591C] transition-colors">
                        {inf.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-400" title={inf._id}>
                          {inf._id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(inf._id, `id-${inf._id}`);
                          }}
                          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                          title="Copy MongoDB ObjectId"
                        >
                          {copiedId === `id-${inf._id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF7F3] border border-[#e8e2d8] text-xs font-mono font-medium text-[#89591C]">
                        {inf.affiliateCode}
                      </span>
                    </td>

                    {/* Affiliate Link */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 max-w-xs">
                        <input
                          type="text"
                          readOnly
                          value={inf.affiliateLink}
                          className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 truncate flex-1 text-slate-600 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(inf.affiliateLink, `link-${inf._id}`)}
                          className="px-2.5 py-1 text-xs rounded bg-[#89591C]/10 hover:bg-[#89591C] text-[#89591C] hover:text-white transition-all flex items-center gap-1 flex-shrink-0"
                          title="Copy Full Affiliate Link"
                        >
                          {copiedId === `link-${inf._id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-[10px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Commission Type & Rate */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-slate-800">
                        {inf.commissionType === 'fixed' ? `₹${inf.commissionValue}` : `${inf.commissionValue}%`}
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        {inf.commissionType}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          inf.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {inf.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Customers Count */}
                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                      {inf.totalCustomers}
                    </td>

                    {/* Orders Count */}
                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                      {inf.totalOrders}
                    </td>

                    {/* Total Sales */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                      ₹{inf.totalSales.toLocaleString('en-IN')}
                    </td>

                    {/* Commission Breakdown */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="space-y-0.5 text-xs">
                        <div className="text-amber-700 text-[11px]">
                          Pending: <span className="font-semibold">₹{inf.pendingCommission}</span>
                        </div>
                        <div className="text-blue-700 text-[11px]">
                          Approved: <span className="font-semibold">₹{inf.approvedCommission}</span>
                        </div>
                        <div className="text-emerald-700 text-[11px]">
                          Paid: <span className="font-semibold">₹{inf.paidCommission}</span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openInfluencerDetails(inf._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#89591C] text-[#89591C] hover:bg-[#89591C] hover:text-white transition-all text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Orders</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Influencer Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#e8e2d8] max-w-lg w-full p-6 shadow-xl relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#89591C]/10 flex items-center justify-center text-[#89591C]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Add New Influencer</h3>
                <p className="text-xs text-slate-500">
                  Affiliate link with unique MongoDB ObjectId will be automatically generated.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInfluencer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Influencer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aisha"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8e2d8] text-sm focus:outline-hidden focus:border-[#89591C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Affiliate Code <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AISHA10"
                    value={formData.affiliateCode}
                    onChange={(e) => setFormData({ ...formData, affiliateCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8e2d8] text-sm uppercase font-mono focus:outline-hidden focus:border-[#89591C]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-generated if blank</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8e2d8] text-sm bg-white focus:outline-hidden focus:border-[#89591C]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Commission Type
                  </label>
                  <select
                    value={formData.commissionType}
                    onChange={(e: any) => setFormData({ ...formData, commissionType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8e2d8] text-sm bg-white focus:outline-hidden focus:border-[#89591C]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Commission Value {formData.commissionType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.commissionValue}
                    onChange={(e) => setFormData({ ...formData, commissionValue: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8e2d8] text-sm focus:outline-hidden focus:border-[#89591C]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Default: 5%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="influencer@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8e2d8] text-sm focus:outline-hidden focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8e2d8] text-sm focus:outline-hidden focus:border-[#89591C]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#e8e2d8] text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-[#89591C] hover:bg-[#724814] text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Save Influencer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Influencer Details & Associated Customers/Orders Drawer ── */}
      {selectedInfluencerId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-[#e8e2d8] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#e8e2d8] flex items-center justify-between bg-[#FAF7F3]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#89591C] text-white flex items-center justify-center font-bold text-lg">
                  {detailData?.influencer?.name?.charAt(0) || 'I'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-800">
                      {detailData?.influencer?.name || 'Influencer Breakdown'}
                    </h2>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        detailData?.influencer?.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {detailData?.influencer?.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                    <span>ObjectId: {detailData?.influencer?._id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(detailData?.influencer?._id || '', 'drawer-id')}
                      className="text-slate-400 hover:text-slate-700"
                      title="Copy ObjectId"
                    >
                      {copiedId === 'drawer-id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedInfluencerId(null);
                  setDetailData(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Affiliate Link Banner inside Drawer */}
            {detailData && (
              <div className="p-4 bg-[#89591C]/5 border-b border-[#e8e2d8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <LinkIcon className="w-4 h-4 text-[#89591C] shrink-0" />
                  <span className="font-semibold text-slate-700 whitespace-nowrap">Affiliate URL:</span>
                  <span className="font-mono text-slate-600 truncate select-all">{detailData.influencer.affiliateLink}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(detailData.influencer.affiliateLink, 'drawer-link')}
                  className="px-3 py-1.5 rounded bg-[#89591C] hover:bg-[#724814] text-white text-xs font-medium flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  {copiedId === 'drawer-link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'drawer-link' ? 'Copied' : 'Copy Full URL'}</span>
                </button>
              </div>
            )}

            {/* Influencer Quick Stats */}
            {detailData && (
              <div className="grid grid-cols-4 border-b border-[#e8e2d8] bg-white text-center text-xs divide-x divide-[#e8e2d8]">
                <div className="p-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Customers</span>
                  <span className="text-base font-bold text-slate-800">{detailData.stats.totalCustomers}</span>
                </div>
                <div className="p-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Orders</span>
                  <span className="text-base font-bold text-slate-800">{detailData.stats.totalOrders}</span>
                </div>
                <div className="p-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Sales</span>
                  <span className="text-base font-bold text-slate-800">₹{detailData.stats.totalSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Commission Rate</span>
                  <span className="text-base font-bold text-[#89591C]">
                    {detailData.influencer.commissionType === 'fixed'
                      ? `₹${detailData.influencer.commissionValue}`
                      : `${detailData.influencer.commissionValue}%`}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#e8e2d8] bg-white">
              <button
                type="button"
                onClick={() => setActiveTab('customers')}
                className={`pb-2.5 px-3 text-sm font-semibold transition-all relative ${
                  activeTab === 'customers'
                    ? 'text-[#89591C] border-b-2 border-[#89591C]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Associated Customers ({detailData?.customers?.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`pb-2.5 px-3 text-sm font-semibold transition-all relative ${
                  activeTab === 'orders'
                    ? 'text-[#89591C] border-b-2 border-[#89591C]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Orders & Commissions ({detailData?.orders?.length ?? 0})
              </button>
            </div>

            {/* Drawer Content Area */}
            <div className="flex-1 overflow-y-auto p-5">
              {detailLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-7 h-7 animate-spin mx-auto text-[#89591C] mb-2" />
                  Loading influencer customer & order breakdown...
                </div>
              ) : activeTab === 'customers' ? (
                /* Tab 1: Associated Customers */
                <div>
                  {(!detailData?.customers || detailData.customers.length === 0) ? (
                    <div className="py-16 text-center text-slate-400 text-sm">
                      No customers have been attributed to this influencer yet.
                    </div>
                  ) : (
                    <div className="border border-[#e8e2d8] rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-[#FAF7F3] text-[10px] uppercase text-slate-500 border-b border-[#e8e2d8]">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">Customer</th>
                            <th className="py-2.5 px-3 font-semibold">Contact</th>
                            <th className="py-2.5 px-3 font-semibold text-center">Joined Date</th>
                            <th className="py-2.5 px-3 font-semibold text-center">Tier</th>
                            <th className="py-2.5 px-3 font-semibold text-center">Orders</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Total Spent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e8e2d8]">
                          {detailData.customers.map((c) => (
                            <tr key={c._id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-medium text-slate-800">{c.name}</td>
                              <td className="py-2.5 px-3 text-slate-500">
                                <div>{c.email}</div>
                                {c.phone && <div className="text-[10px] text-slate-400">{c.phone}</div>}
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-500">
                                {formatDate(c.createdAt)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                  {c.tier || 'Silver'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                                {c.totalOrders || 0}
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                                ₹{(c.totalSpent || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab 2: Orders & Commissions */
                <div>
                  {(!detailData?.orders || detailData.orders.length === 0) ? (
                    <div className="py-16 text-center text-slate-400 text-sm">
                      No orders have been placed by associated customers yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {detailData.orders.map((ord) => {
                        // Matching commission record if any
                        const comm = detailData.commissions.find((c) => c.orderNumber === ord.orderNumber);
                        const commStatus = comm?.status || ord.commissionStatus || 'pending';
                        const commAmount = comm?.commissionAmount ?? ord.commissionAmount ?? 0;

                        return (
                          <div
                            key={ord._id}
                            className="bg-white p-4 rounded-xl border border-[#e8e2d8] shadow-2xs hover:border-[#89591C]/30 transition-all text-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm">{ord.orderNumber}</span>
                                <span className="text-slate-400 font-mono text-[11px]">{formatDate(ord.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                    ord.orderStatus === 'delivered'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : ord.orderStatus === 'cancelled'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  Order: {ord.orderStatus}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                    commStatus === 'paid'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : commStatus === 'approved'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                      : commStatus === 'cancelled'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}
                                >
                                  Commission: {commStatus}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-slate-600">
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase">Customer</span>
                                <span className="font-medium text-slate-800">{ord.customerName}</span>
                                <span className="block text-[10px] text-slate-400">{ord.customerEmail}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase">Order Subtotal</span>
                                <span className="font-semibold text-slate-800">₹{ord.subtotal}</span>
                                <span className="block text-[10px] text-slate-400">Total: ₹{ord.totalAmount}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase">Commission Earned</span>
                                <span className="font-bold text-[#89591C] text-sm">₹{commAmount}</span>
                                <span className="block text-[10px] text-slate-400">
                                  Rate: {ord.commissionRate || detailData.influencer.commissionValue}%
                                </span>
                              </div>
                              <div className="flex flex-col justify-center items-end sm:items-end">
                                {comm && commStatus !== 'paid' && commStatus !== 'cancelled' && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    {commStatus === 'pending' && (
                                      <button
                                        type="button"
                                        disabled={updatingCommId === comm._id}
                                        onClick={() => handleUpdateCommissionStatus(comm._id, 'approved')}
                                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-semibold transition-colors"
                                      >
                                        Approve
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      disabled={updatingCommId === comm._id}
                                      onClick={() => handleUpdateCommissionStatus(comm._id, 'paid')}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition-colors"
                                    >
                                      Mark as Paid
                                    </button>
                                  </div>
                                )}
                                {commStatus === 'paid' && comm?.paidAt && (
                                  <span className="text-[10px] text-emerald-700 font-medium">
                                    Disbursed on {formatDate(comm.paidAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

