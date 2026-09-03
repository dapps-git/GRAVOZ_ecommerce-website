'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TicketPercent,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import Modal from '@/components/admin/Modal';
import DataTable, { Column } from '@/components/admin/DataTable';

interface CouponItem {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  description?: string;
  minPurchaseAmount: number;
  maxDiscountAmount?: number | null;
  totalUsageLimit: number;
  usedCount: number;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed_amount' | 'free_shipping'>('percentage');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('999');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [totalUsageLimit, setTotalUsageLimit] = useState('100');
  const [expiryDate, setExpiryDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coupons');
      const data = await res.json();
      if (res.ok && Array.isArray(data.coupons)) {
        setCoupons(data.coupons);
      }
    } catch {
      showToast('Failed to load coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setType('percentage');
    setValue('10');
    setDescription('');
    setMinPurchaseAmount('999');
    setMaxDiscountAmount('');
    setTotalUsageLimit('100');
    // Default 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setExpiryDate(d.toISOString().split('T')[0]);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setType(coupon.type);
    setValue(coupon.value.toString());
    setDescription(coupon.description || '');
    setMinPurchaseAmount(coupon.minPurchaseAmount.toString());
    setMaxDiscountAmount(coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : '');
    setTotalUsageLimit(coupon.totalUsageLimit.toString());
    setExpiryDate(new Date(coupon.expiryDate).toISOString().split('T')[0]);
    setIsActive(coupon.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        code: code.toUpperCase().trim(),
        type,
        value: Number(value),
        description,
        minPurchaseAmount: Number(minPurchaseAmount) || 0,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        totalUsageLimit: Number(totalUsageLimit) || 100,
        expiryDate,
        isActive,
      };

      const url = editingCoupon ? `/api/coupons/${editingCoupon._id}` : '/api/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Coupon ${payload.code} ${editingCoupon ? 'updated' : 'created'} successfully!`);
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        showToast(data.error || 'Failed to save coupon', 'error');
      }
    } catch {
      showToast('Network error saving coupon', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon code "${couponCode}"?`)) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Coupon "${couponCode}" deleted.`);
        fetchCoupons();
      } else {
        showToast('Failed to delete coupon', 'error');
      }
    } catch {
      showToast('Network error deleting coupon', 'error');
    }
  };

  const toggleStatus = async (coupon: CouponItem) => {
    try {
      const res = await fetch(`/api/coupons/${coupon._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c._id === coupon._id ? { ...c, isActive: !c.isActive } : c))
        );
        showToast(`Coupon "${coupon.code}" ${!coupon.isActive ? 'activated' : 'disabled'}.`);
      }
    } catch {
      showToast('Failed to toggle coupon status', 'error');
    }
  };

  const columns: Column<CouponItem>[] = [
    {
      header: 'Coupon Code',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#faf4ec] text-[#89591C] font-bold text-xs flex items-center justify-center border border-[#e8e2d8]">
            <TicketPercent className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-xs text-slate-900 tracking-wider">
              {row.code}
            </span>
            {row.description && (
              <p className="text-[10px] text-slate-500 truncate max-w-xs">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Discount Offer',
      accessor: (row) => (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
          {row.type === 'percentage'
            ? `${row.value}% OFF`
            : row.type === 'fixed_amount'
            ? `₹${row.value} OFF`
            : 'Free Shipping'}
        </span>
      ),
    },
    {
      header: 'Min Purchase',
      accessor: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.minPurchaseAmount > 0 ? `₹${row.minPurchaseAmount}` : 'No Minimum'}
        </span>
      ),
    },
    {
      header: 'Usage',
      accessor: (row) => (
        <div className="text-xs text-slate-700">
          <span className="font-bold text-[#89591C]">{row.usedCount || 0}</span>
          <span className="text-slate-400 font-normal"> / {row.totalUsageLimit} uses</span>
        </div>
      ),
    },
    {
      header: 'Expiry Date',
      accessor: (row) => {
        const exp = new Date(row.expiryDate);
        const isExpired = exp < new Date();
        return (
          <span className={`text-xs ${isExpired ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
            {exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {isExpired && ' (Expired)'}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: (row) => (
        <button
          type="button"
          onClick={() => toggleStatus(row)}
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
            row.isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
          }`}
        >
          {row.isActive ? 'Active' : 'Disabled'}
        </button>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-md bg-[#faf8f5] text-slate-700 hover:text-[#89591C] hover:bg-[#faf4ec] border border-[#e8e2d8] transition-colors cursor-pointer"
            title="Edit coupon"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row._id, row.code)}
            className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
            title="Delete coupon"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-5 pb-20 font-sans font-normal" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-md shadow-2xl flex items-center gap-3 text-white text-xs font-semibold animate-in slide-in-from-bottom-4 duration-200 ${
            toast.type === 'success' ? 'bg-[#89591C]' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-normal mb-1">
            <Link href="/admin" className="hover:text-slate-700 transition-colors">Dashboard</Link>
            <span>&gt;</span>
            <span className="text-slate-800 font-medium">Coupons</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#030303] tracking-tight">Coupon Management</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Create and manage live discount coupons. Real coupons created here will be active and redeemable in the storefront.</p>
        </div>

        <div>
          <button
            type="button"
            onClick={openCreateModal}
            className="h-9 px-4 rounded-md bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Coupon</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e8e2d8] rounded-lg overflow-hidden shadow-2xs">
        <DataTable
          columns={columns}
          data={coupons}
          loading={loading}
          totalCount={coupons.length}
          currentPage={1}
          totalPages={1}
          onPageChange={() => {}}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Discount Coupon'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-sansation">
          {/* Coupon Code & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Coupon Code * (e.g. WELCOME50)
              </label>
              <input
                type="text"
                required
                placeholder="GRAVOZ10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full uppercase font-mono tracking-wider bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              >
                <option value="percentage">Percentage (%) Discount</option>
                <option value="fixed_amount">Flat Fixed Amount (₹) OFF</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
          </div>

          {/* Value & Min Purchase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {type === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
              </label>
              <input
                type="number"
                required
                min="1"
                max={type === 'percentage' ? 99 : 50000}
                placeholder={type === 'percentage' ? '10' : '200'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2 text-xs font-bold text-[#89591C] focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Min Order Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="999"
                value={minPurchaseAmount}
                onChange={(e) => setMinPurchaseAmount(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Discount Cap (₹ Optional)
              </label>
              <input
                type="number"
                min="0"
                placeholder="500"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Description (Shows to Customer at Checkout)
            </label>
            <input
              type="text"
              placeholder="e.g. Get 10% OFF on all orders above ₹999"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          {/* Expiry Date & Total Usage Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Usage Limit (Times)
              </label>
              <input
                type="number"
                min="1"
                placeholder="100"
                value={totalUsageLimit}
                onChange={(e) => setTotalUsageLimit(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="couponActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-[#89591C] rounded border-slate-300 focus:ring-[#89591C]"
            />
            <label htmlFor="couponActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Active &amp; Available for Storefront Checkout
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e8e2d8]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
