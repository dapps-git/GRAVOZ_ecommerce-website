'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  SlidersHorizontal,
  ShieldCheck,
  Package,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  FileText,
  Truck,
  Clock,
  ExternalLink,
  ImageIcon,
  ArrowRight,
} from 'lucide-react';

interface ReturnItem {
  _id: string;
  order?: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
  };
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  reason: string;
  description?: string;
  images?: string[];
  refundAmount: number;
  status:
    | 'return_requested'
    | 'under_review'
    | 'approved'
    | 'pickup_scheduled'
    | 'received'
    | 'refund_initiated'
    | 'refunded'
    | 'rejected'
    | 'requested'
    | 'processed';
  adminNotes?: string;
  approvedAt?: string;
  pickupScheduledAt?: string;
  receivedAt?: string;
  refundInitiatedAt?: string;
  refundedAt?: string;
  rejectedAt?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  return_requested: { label: 'Return Requested', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  requested: { label: 'Return Requested', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  under_review: { label: 'Under Review', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  pickup_scheduled: { label: 'Pickup Scheduled', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  received: { label: 'Received', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  refund_initiated: { label: 'Refund Initiated', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  refunded: { label: 'Refunded', bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  processed: { label: 'Refunded', bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  rejected: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
};

export default function ReturnsPage() {
  const [returnsList, setReturnsList] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Detail Modal
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/returns');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setReturnsList(data);
      }
    } catch (err) {
      console.error('Failed to fetch return requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleUpdateReturnStatus = async (returnId: string, status: string, notes?: string) => {
    setUpdatingId(returnId);
    try {
      const res = await fetch('/api/returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnId, status, adminNotes: notes || adminNoteInput }),
      });

      if (res.ok) {
        setReturnsList((prev) =>
          prev.map((r) =>
            r._id === returnId
              ? {
                  ...r,
                  status: status as any,
                  adminNotes: notes || adminNoteInput || r.adminNotes,
                }
              : r
          )
        );
        if (selectedReturn && selectedReturn._id === returnId) {
          setSelectedReturn((prev) =>
            prev ? { ...prev, status: status as any, adminNotes: notes || adminNoteInput || prev.adminNotes } : null
          );
        }
      }
    } catch (err) {
      console.error('Failed to update return status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Status Counts
  const counts = useMemo(() => {
    return {
      all: returnsList.length,
      return_requested: returnsList.filter((r) => r.status === 'return_requested' || r.status === 'requested').length,
      under_review: returnsList.filter((r) => r.status === 'under_review').length,
      approved: returnsList.filter((r) => r.status === 'approved').length,
      pickup_scheduled: returnsList.filter((r) => r.status === 'pickup_scheduled').length,
      received: returnsList.filter((r) => r.status === 'received').length,
      refund_initiated: returnsList.filter((r) => r.status === 'refund_initiated').length,
      refunded: returnsList.filter((r) => r.status === 'refunded' || r.status === 'processed').length,
      rejected: returnsList.filter((r) => r.status === 'rejected').length,
    };
  }, [returnsList]);

  // Filtered List
  const filteredReturns = useMemo(() => {
    return returnsList.filter((r) => {
      if (activeTab !== 'all') {
        if (activeTab === 'return_requested' && (r.status === 'return_requested' || r.status === 'requested')) {
          // match
        } else if (activeTab === 'refunded' && (r.status === 'refunded' || r.status === 'processed')) {
          // match
        } else if (r.status !== activeTab) {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          (r.orderNumber || '').toLowerCase().includes(q) ||
          (r.customerName || '').toLowerCase().includes(q) ||
          (r.customerEmail || '').toLowerCase().includes(q) ||
          (r.reason || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [returnsList, activeTab, search]);

  const totalResults = filteredReturns.length;
  const totalPages = Math.ceil(totalResults / limit) || 1;
  const paginatedReturns = filteredReturns.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <div className="w-full space-y-5 pb-20 font-sans font-normal" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#030303] tracking-tight">Return &amp; Refund Management</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Classify return requests through full lifecycle: Return Requested → Under Review → Approved → Pickup Scheduled → Received → Refund Initiated → Refunded
          </p>
        </div>

        <div>
          <button
            type="button"
            className="h-9 px-4 rounded-md border border-[#89591C]/30 bg-[#faf4ec] text-[#89591C] text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:bg-[#f6ead9] transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#89591C]" />
            <span>Return Control Policy</span>
          </button>
        </div>
      </div>

      {/* ── Filter Tabs Row (All 7 Lifecycle Stages) ── */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All', count: counts.all },
          { id: 'return_requested', label: 'Requested', count: counts.return_requested },
          { id: 'under_review', label: 'Under Review', count: counts.under_review },
          { id: 'approved', label: 'Approved', count: counts.approved },
          { id: 'pickup_scheduled', label: 'Pickup Scheduled', count: counts.pickup_scheduled },
          { id: 'received', label: 'Received', count: counts.received },
          { id: 'refund_initiated', label: 'Refund Initiated', count: counts.refund_initiated },
          { id: 'refunded', label: 'Refunded', count: counts.refunded },
          { id: 'rejected', label: 'Rejected', count: counts.rejected },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#89591C] text-white shadow-2xs'
                  : 'bg-white border border-[#e8e2d8] text-slate-700 hover:bg-[#faf8f5]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white rounded-lg border border-[#e8e2d8] p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, email, or return reason..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[#faf8f5] border border-[#e8e2d8] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#89591C]"
          />
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white rounded-lg border border-[#e8e2d8] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ece7de] bg-[#faf8f5] text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 pl-4 pr-3">Order Ref</th>
                <th className="py-3.5 px-3">Customer</th>
                <th className="py-3.5 px-3">Reason</th>
                <th className="py-3.5 px-3">Evidence</th>
                <th className="py-3.5 px-3">Refund Amount</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 pl-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f0eae1] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 font-medium">
                    Loading Return Requests...
                  </td>
                </tr>
              ) : paginatedReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2.5">
                      <div className="w-12 h-12 rounded-full bg-[#fceddc] text-[#89591C] flex items-center justify-center mx-auto shadow-2xs">
                        <Package className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">No return requests found</h4>
                      <p className="text-xs text-slate-400 font-normal">Customer returns will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReturns.map((item) => {
                  const cfg = STATUS_CONFIG[item.status] || {
                    label: item.status,
                    bg: 'bg-slate-100',
                    text: 'text-slate-800',
                    border: 'border-slate-200',
                  };

                  return (
                    <tr key={item._id} className="hover:bg-[#faf8f5]/80 transition-colors">
                      {/* Order Reference */}
                      <td className="py-3.5 pl-4 pr-3 whitespace-nowrap">
                        <span className="font-bold font-mono text-slate-900 text-xs block">{item.orderNumber}</span>
                        <span className="text-[10px] text-slate-400 font-normal block">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 text-xs block">{item.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-normal block">{item.customerEmail}</span>
                      </td>

                      {/* Reason & Notes */}
                      <td className="py-3.5 px-3 max-w-[200px]">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#faf4ec] text-[#89591C] border border-[#e8d5b5]">
                          {item.reason}
                        </span>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 mt-1 truncate" title={item.description}>
                            {item.description}
                          </p>
                        )}
                      </td>

                      {/* Evidence Photos */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {Array.isArray(item.images) && item.images.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {item.images.slice(0, 2).map((img, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setPreviewImage(img)}
                                className="w-8 h-8 rounded border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
                              >
                                <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                              </button>
                            ))}
                            {item.images.length > 2 && (
                              <span className="text-[10px] text-slate-500 font-medium">+{item.images.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">None</span>
                        )}
                      </td>

                      {/* Refund Amount */}
                      <td className="py-3.5 px-3 font-bold text-slate-900 text-xs whitespace-nowrap">
                        ₹{item.refundAmount?.toLocaleString('en-IN') || '0'}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-4 pl-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Details Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReturn(item);
                              setAdminNoteInput(item.adminNotes || '');
                            }}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Workflow Transitions */}
                          {(item.status === 'return_requested' || item.status === 'requested') && (
                            <>
                              <button
                                type="button"
                                disabled={updatingId === item._id}
                                onClick={() => handleUpdateReturnStatus(item._id, 'under_review')}
                                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold cursor-pointer"
                              >
                                Review
                              </button>
                              <button
                                type="button"
                                disabled={updatingId === item._id}
                                onClick={() => handleUpdateReturnStatus(item._id, 'approved')}
                                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold cursor-pointer"
                              >
                                Accept
                              </button>
                            </>
                          )}

                          {item.status === 'under_review' && (
                            <button
                              type="button"
                              disabled={updatingId === item._id}
                              onClick={() => handleUpdateReturnStatus(item._id, 'approved')}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold cursor-pointer"
                            >
                              Approve Return
                            </button>
                          )}

                          {item.status === 'approved' && (
                            <button
                              type="button"
                              disabled={updatingId === item._id}
                              onClick={() => handleUpdateReturnStatus(item._id, 'pickup_scheduled')}
                              className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold cursor-pointer"
                            >
                              Schedule Pickup
                            </button>
                          )}

                          {item.status === 'pickup_scheduled' && (
                            <button
                              type="button"
                              disabled={updatingId === item._id}
                              onClick={() => handleUpdateReturnStatus(item._id, 'received')}
                              className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold cursor-pointer"
                            >
                              Mark Received
                            </button>
                          )}

                          {item.status === 'received' && (
                            <button
                              type="button"
                              disabled={updatingId === item._id}
                              onClick={() => handleUpdateReturnStatus(item._id, 'refund_initiated')}
                              className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-semibold cursor-pointer"
                            >
                              Initiate Refund
                            </button>
                          )}

                          {item.status === 'refund_initiated' && (
                            <button
                              type="button"
                              disabled={updatingId === item._id}
                              onClick={() => handleUpdateReturnStatus(item._id, 'refunded')}
                              className="px-2 py-1 rounded bg-green-50 hover:bg-green-100 text-green-700 text-[11px] font-semibold cursor-pointer"
                            >
                              Mark Refunded
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div className="p-3.5 border-t border-[#ece7de] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold">{paginatedReturns.length}</span> of <span className="font-semibold">{totalResults}</span> requests
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded border border-[#e8e2d8] hover:bg-[#faf8f5] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-semibold">{currentPage} / {totalPages}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded border border-[#e8e2d8] hover:bg-[#faf8f5] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── RETURN DETAILS & MANAGEMENT MODAL ── */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#e8e2d8] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#e8e2d8] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">Return Request Details</h3>
                  <span className="text-xs font-mono font-semibold text-[#89591C] bg-[#faf4ec] px-2 py-0.5 rounded border border-[#e8d5b5]">
                    #{selectedReturn.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Requested on {new Date(selectedReturn.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="text-slate-400 hover:text-slate-900 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Return Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-[#faf8f5] rounded-xl border border-[#e8e2d8] space-y-1">
                <span className="text-slate-400 font-medium block uppercase text-[10px]">Customer Information</span>
                <p className="font-bold text-slate-900 text-sm">{selectedReturn.customerName}</p>
                <p className="text-slate-600">{selectedReturn.customerEmail}</p>
                {selectedReturn.customerPhone && <p className="text-slate-600">{selectedReturn.customerPhone}</p>}
              </div>

              <div className="p-3.5 bg-[#faf8f5] rounded-xl border border-[#e8e2d8] space-y-1">
                <span className="text-slate-400 font-medium block uppercase text-[10px]">Refund Details</span>
                <p className="font-bold text-slate-900 text-sm">
                  Amount: <span className="text-[#89591C]">₹{selectedReturn.refundAmount?.toLocaleString('en-IN')}</span>
                </p>
                <p className="text-slate-600">
                  Current Status:{' '}
                  <span className="font-semibold text-slate-800 uppercase text-[11px]">
                    {STATUS_CONFIG[selectedReturn.status]?.label || selectedReturn.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Reason & Description */}
            <div className="p-4 bg-white border border-[#e8e2d8] rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium uppercase text-[10px]">Reason:</span>
                <span className="font-bold text-[#89591C] bg-[#faf4ec] px-2.5 py-0.5 rounded border border-[#e8d5b5]">
                  {selectedReturn.reason}
                </span>
              </div>
              {selectedReturn.description ? (
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] block mb-1">Customer Description:</span>
                  <p className="text-slate-800 bg-[#faf8f5] p-2.5 rounded border border-[#e8e2d8] leading-relaxed">
                    {selectedReturn.description}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 italic text-[11px]">No additional customer notes provided.</p>
              )}
            </div>

            {/* Evidence Photos */}
            {Array.isArray(selectedReturn.images) && selectedReturn.images.length > 0 && (
              <div className="space-y-2 text-xs">
                <span className="text-slate-400 font-medium uppercase text-[10px] block">Customer Uploaded Evidence ({selectedReturn.images.length})</span>
                <div className="flex items-center gap-3">
                  {selectedReturn.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewImage(img)}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#e8e2d8] cursor-pointer hover:ring-2 hover:ring-[#89591C] transition-all"
                    >
                      <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-slate-700">Admin Notes / Rejection Reason:</label>
              <textarea
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="Add internal notes or explain rejection reason to customer..."
                rows={2}
                className="w-full p-3 rounded-xl border border-[#e8e2d8] bg-[#faf8f5] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            {/* Lifecycle Status Stepper Changer */}
            <div className="space-y-2 text-xs pt-2 border-t border-[#e8e2d8]">
              <span className="font-semibold text-slate-700 block uppercase text-[10px]">Change Lifecycle Status:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={updatingId === selectedReturn._id}
                  onClick={() => handleUpdateReturnStatus(selectedReturn._id, 'under_review')}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold cursor-pointer border border-blue-200"
                >
                  Under Review
                </button>
                <button
                  type="button"
                  disabled={updatingId === selectedReturn._id}
                  onClick={() => handleUpdateReturnStatus(selectedReturn._id, 'approved')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold cursor-pointer border border-emerald-200"
                >
                  Accept Return (Approve)
                </button>
                <button
                  type="button"
                  disabled={updatingId === selectedReturn._id}
                  onClick={() => handleUpdateReturnStatus(selectedReturn._id, 'pickup_scheduled')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold cursor-pointer border border-indigo-200"
                >
                  Pickup Scheduled
                </button>
                <button
                  type="button"
                  disabled={updatingId === selectedReturn._id}
                  onClick={() => handleUpdateReturnStatus(selectedReturn._id, 'received')}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold cursor-pointer border border-purple-200"
                >
                  Received at Hub
                </button>
                <button
                  type="button"
                  disabled={updatingId === selectedReturn._id}
                  onClick={() => handleUpdateReturnStatus(selectedReturn._id, 'refund_initiated')}
                  className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold cursor-pointer border border-teal-200"
                >
                  Refund Initiated
                </button>
                <button
                  type="button"
                  disabled={updatingId === selectedReturn._id}
                  onClick={() => handleUpdateReturnStatus(selectedReturn._id, 'refunded')}
                  className="px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-semibold cursor-pointer border border-green-200"
                >
                  Refund Completed
                </button>
                <button
                  type="button"
                  disabled={updatingId === selectedReturn._id}
                  onClick={() => handleUpdateReturnStatus(selectedReturn._id, 'rejected')}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold cursor-pointer border border-rose-200"
                >
                  Decline / Reject
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#e8e2d8]">
              {selectedReturn.order ? (
                <Link
                  href={`/admin/orders/${selectedReturn.order._id}`}
                  className="inline-flex items-center gap-1 text-xs text-[#89591C] hover:underline font-semibold"
                >
                  <span>Open Full Order</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHOTO PREVIEW MODAL ── */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-xl max-h-[85vh] overflow-hidden rounded-xl">
            <img src={previewImage} alt="Enlarged Evidence" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
