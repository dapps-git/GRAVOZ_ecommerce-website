'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import StatusBadge from '@/components/admin/StatusBadge';
import {
  ArrowLeft,
  FileText,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  RotateCcw,
  X,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

export interface StatusHistoryItem {
  status: string;
  timestamp: string;
  location?: string;
  note?: string;
}

interface OrderDetail {
  _id: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  currentLocation?: string;
  statusHistory?: StatusHistoryItem[];
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    shippingAddress?: { street?: string; city?: string; state?: string; postalCode?: string; country?: string };
  };
  shippingAddress?: {
    name?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  items: Array<{ name: string; size: string; color?: string; quantity: number; price: number; imageUrl?: string; image?: string }>;
  subtotal: number;
  tax?: number;
  shippingFee?: number;
  discountAmount?: number;
  couponCode?: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  transactionId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  paymentDetails?: any;
  returnDetails?: {
    reason?: string;
    description?: string;
    images?: string[];
    status?: string;
    rejectionReason?: string;
  };
  createdAt: string;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Status & Location inputs
  const [selectedStatus, setSelectedStatus] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState('');

  // Refund Confirmation Modal State
  const [showRefundConfirmModal, setShowRefundConfirmModal] = useState(false);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [refundSuccessData, setRefundSuccessData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/orders/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setOrder(data);
          setSelectedStatus(data.orderStatus || 'ordered');
          setLocationInput(data.currentLocation || '');
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    // Double Check: If admin selects refund_initiated or refunded, trigger confirmation modal immediately
    if ((newStatus === 'refund_initiated' || newStatus === 'refunded') && order?.paymentStatus !== 'refunded') {
      setShowRefundConfirmModal(true);
    }
  };

  const handleCloseRefundModal = () => {
    setShowRefundConfirmModal(false);
    setRefundError('');
    setRefundSuccessData(null);
    // Revert dropdown if refund was not completed
    if (order && order.paymentStatus !== 'refunded') {
      setSelectedStatus(order.orderStatus || 'ordered');
    }
  };

  const handleUpdateStatusAndLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStatus) return;

    // Double Check: If admin selects refund_initiated or refunded, trigger confirmation modal first
    if ((selectedStatus === 'refund_initiated' || selectedStatus === 'refunded') && order?.paymentStatus !== 'refunded') {
      setShowRefundConfirmModal(true);
      return;
    }

    setUpdating(true);
    setUpdateSuccessMsg('');
    try {
      const res = await fetch(`/api/orders/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus: selectedStatus,
          location: locationInput.trim(),
          note: statusNote.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
        setStatusNote('');
        setUpdateSuccessMsg('Status & Location updated successfully!');
        setTimeout(() => setUpdateSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update status & location:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleProcessRefund = async () => {
    setIsProcessingRefund(true);
    setRefundError('');
    try {
      const targetStatus = selectedStatus === 'refunded' ? 'refunded' : 'refund_initiated';
      const res = await fetch(`/api/orders/${resolvedParams.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRefundSuccessData(data);
        if (data.order) {
          setOrder(data.order);
          setSelectedStatus(data.order.orderStatus);
        }
        setUpdateSuccessMsg(data.message || 'Refund sent to customer bank account successfully!');
        setTimeout(() => {
          setShowRefundConfirmModal(false);
          setRefundSuccessData(null);
        }, 3500);
      } else {
        setRefundError(data.error || 'Failed to process bank refund.');
      }
    } catch (err: any) {
      setRefundError(err.message || 'Network error occurred while processing refund.');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse font-light">Loading Order Details...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-rose-600 font-light">Order not found.</div>;
  }

  // Robust safe fallbacks for customer details
  const customerName =
    order.customerName ||
    order.customer?.name ||
    order.shippingAddress?.name ||
    'Customer';

  const customerEmail =
    order.customerEmail ||
    order.customer?.email ||
    'Not provided';

  const customerPhone =
    order.customerPhone ||
    order.customer?.phone ||
    order.shippingAddress?.phone ||
    'Not provided';

  const shippingAddr =
    order.shippingAddress ||
    order.customer?.shippingAddress || {
      street: 'N/A',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sansation">
      <div className="flex items-center justify-between">
        <Link href="/admin/orders" className="text-xs font-semibold text-slate-600 hover:text-[#89591C] flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <Link
          href={`/admin/invoices/${order._id}`}
          className="px-4 py-2 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-2xl shadow-md shadow-[#89591C]/20 flex items-center gap-1.5"
        >
          <FileText className="w-4 h-4" /> View Invoice
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#e8e2d8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{order.orderNumber}</h1>
            <StatusBadge status={order.orderStatus} />
            <StatusBadge status={order.paymentStatus} />
            {order.currentLocation && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#FFF9F2] text-[#8B4A12] border border-[#F5C78E] px-2.5 py-1 rounded-full shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-[#8B4A12]" />
                <span>{order.currentLocation}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Placed on {new Date(order.createdAt).toLocaleString('en-IN')} via {order.paymentMethod || 'COD'}
          </p>
        </div>
      </div>

      {/* Dedicated Status & Location Update Manager */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e8e2d8] shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8e2d8] pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#89591C]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Update Order Status &amp; Hub Location
            </h3>
          </div>
          {updateSuccessMsg && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 animate-in fade-in">
              ✓ {updateSuccessMsg}
            </span>
          )}
        </div>

        <form onSubmit={handleUpdateStatusAndLocation} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4 space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">Order Status *</label>
            <select
              value={selectedStatus}
              disabled={updating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#89591C]"
            >
              <option value="ordered">Ordered (Placed)</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="return_requested">Return Requested</option>
              <option value="under_review">Under Review</option>
              <option value="return_approved">Approved (Return Accepted)</option>
              <option value="pickup_scheduled">Pickup Scheduled</option>
              <option value="return_received">Received at Hub</option>
              <option value="refund_initiated">Refund Initiated</option>
              <option value="refunded">Refunded</option>
              <option value="returned">Returned</option>
              <option value="return_rejected">Return Rejected</option>
            </select>
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Current Location (Hub / City / Facility)
            </label>
            <input
              type="text"
              value={locationInput}
              disabled={updating}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="e.g. Mumbai Sorting Hub, Kochi Facility"
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Tracking Remarks (Optional)
            </label>
            <input
              type="text"
              value={statusNote}
              disabled={updating}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="e.g. Dispatched via Bluedart"
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              disabled={updating}
              className="w-full py-2 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1"
            >
              {updating ? '...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer & Shipping (1 Col) */}
        <div className="bg-white rounded-3xl p-5 border border-[#e8e2d8] shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#e8e2d8] pb-2">
            Customer Information
          </h3>
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-900 text-sm">{customerName}</p>
            <p className="text-slate-600 font-normal">{customerEmail}</p>
            <p className="text-slate-600 font-normal">{customerPhone}</p>
          </div>

          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#e8e2d8] pb-2 pt-2">
            Shipping Address
          </h3>
          <div className="text-xs text-slate-700 space-y-0.5 font-normal">
            <p>{shippingAddr.street}</p>
            <p>
              {shippingAddr.city}{shippingAddr.state ? `, ${shippingAddr.state}` : ''}{' '}
              {shippingAddr.postalCode}
            </p>
            <p className="font-bold text-slate-900">{shippingAddr.country || 'India'}</p>
          </div>

          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#e8e2d8] pb-2 pt-2">
            Payment &amp; Transaction
          </h3>
          <div className="text-xs space-y-1.5 bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E1D9]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Method:</span>
              <span className="font-bold text-slate-900">
                {order.paymentMethod === 'COD'
                  ? 'Cash on Delivery (COD)'
                  : order.paymentMethod || 'Online Prepaid'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Status:</span>
              <StatusBadge status={order.paymentStatus || 'pending'} />
            </div>
            {(order as any).razorpayPaymentId && (
              <div className="pt-1 border-t border-[#E8E1D9] text-[10px]">
                <span className="text-slate-500 block">Razorpay Payment ID:</span>
                <span className="font-mono text-slate-800 break-all font-semibold">{(order as any).razorpayPaymentId}</span>
              </div>
            )}

            {order.paymentStatus === 'refunded' ? (
              <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800">
                <div className="flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Refund Processed to Bank</span>
                </div>
                {(order as any).paymentDetails?.refundId && (
                  <span className="font-mono text-[10px] text-emerald-700 block mt-0.5">
                    Refund ID: {(order as any).paymentDetails.refundId}
                  </span>
                )}
              </div>
            ) : order.paymentMethod === 'COD' ? (
              order.paymentStatus === 'pending' ? (
                <div className="mt-2.5 p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-800">
                  <span className="font-semibold">Cash on Delivery (Pending)</span>
                  <span className="block text-[10px] text-amber-700 mt-0.5">
                    Payment will be collected upon delivery. No bank refund applicable.
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus('refund_initiated');
                    setShowRefundConfirmModal(true);
                  }}
                  className="mt-2.5 w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Record Manual COD Refund</span>
                </button>
              )
            ) : (order.paymentStatus === 'paid' || (order as any).razorpayPaymentId) ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('refund_initiated');
                  setShowRefundConfirmModal(true);
                }}
                className="mt-2.5 w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Initiate Bank Refund</span>
              </button>
            ) : null}
          </div>

          {/* Return Request Details (If Return Initiated) */}
          {order.returnDetails && order.returnDetails.reason && [
            'return_requested',
            'under_review',
            'return_approved',
            'pickup_scheduled',
            'return_received',
            'refund_initiated',
            'refunded',
            'returned',
            'return_rejected',
          ].includes(order.orderStatus) && (
            <div className="pt-3 border-t border-[#e8e2d8] space-y-2">
              <h3 className="text-xs font-bold text-[#89591C] uppercase tracking-wider">
                Return &amp; Refund Request
              </h3>
              <div className="p-3 bg-[#faf4ec] rounded-xl border border-[#e8d5b5] space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-medium">Reason:</span>
                  <span className="font-bold text-slate-900">{order.returnDetails.reason}</span>
                </div>
                {order.returnDetails.description && (
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-medium">Description:</span>
                    <p className="text-slate-700">{order.returnDetails.description}</p>
                  </div>
                )}
                {Array.isArray(order.returnDetails.images) && order.returnDetails.images.length > 0 && (
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-medium mb-1">Photos:</span>
                    <div className="flex gap-2">
                      {order.returnDetails.images.map((img: string, i: number) => (
                        <div key={i} className="w-12 h-12 rounded-lg border border-[#e8d5b5] overflow-hidden">
                          <img src={img} alt="Return photo" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Itemized Order Breakdown (2 Cols) */}
        <div className="md:col-span-2 bg-white rounded-3xl p-5 border border-[#e8e2d8] shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#e8e2d8] pb-2">
            Ordered Shoe Items ({order.items?.length || 0})
          </h3>

          <div className="divide-y divide-[#f0ebd9]">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center gap-3 text-xs">
                {/* Product Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#faf8f5] border border-[#e8e2d8] flex-shrink-0">
                  <Image
                    src={item.imageUrl || item.image || '/products/product1.webp'}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                  <p className="text-[10px] text-slate-500 font-normal">
                    Size: {item.size} • Color: {item.color || 'Default'} • Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right font-bold text-slate-900 flex-shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          {(() => {
            const rawSubtotal = order.subtotal || 0;
            const rawDiscount = order.discountAmount || 0;
            const netAmount = rawSubtotal - rawDiscount;
            const rawShipping =
              order.shippingFee !== undefined && order.shippingFee !== null && order.shippingFee > 0
                ? order.shippingFee
                : order.totalAmount > netAmount
                ? order.totalAmount - netAmount
                : 0;

            return (
              <div className="border-t border-[#e8e2d8] pt-3 space-y-1.5 text-xs text-slate-600 font-normal">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-900 font-semibold">₹{rawSubtotal.toLocaleString('en-IN')}</span>
                </div>
                {rawDiscount > 0 ? (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                    <span>− ₹{rawDiscount.toLocaleString('en-IN')}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span>Delivery / Shipping</span>
                  {rawShipping > 0 ? (
                    <span className="text-slate-900 font-semibold">
                      ₹{rawShipping.toLocaleString('en-IN')}{' '}
                      {order.paymentMethod === 'COD' ? (
                        <span className="text-[10px] text-amber-800 font-medium">(COD Charge)</span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">FREE</span>
                  )}
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-[#e8e2d8]">
                  <span>Total Amount</span>
                  <span className="text-[#89591C]">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── DOUBLE-CHECK BANK REFUND CONFIRMATION MODAL ── */}
      {showRefundConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 relative space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Double-Check: Confirm Bank Refund
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify order details before sending money to customer&apos;s bank account
                  </p>
                </div>
              </div>

              {!isProcessingRefund && (
                <button
                  type="button"
                  onClick={handleCloseRefundModal}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Refund Order Summary Details */}
            <div className="bg-[#FAF8F5] border border-[#E8E1D9] rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E8E1D9]">
                <span className="text-slate-500 font-medium">Order Number:</span>
                <span className="font-bold text-slate-900 font-mono">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E8E1D9]">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="font-semibold text-slate-900">{customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E8E1D9]">
                <span className="text-slate-500 font-medium">Customer Email / Phone:</span>
                <span className="text-slate-700">{customerEmail} • {customerPhone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E8E1D9]">
                <span className="text-slate-500 font-medium">Payment Method:</span>
                <span className="font-bold text-slate-900">
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : `${order.paymentMethod || 'Online'} (UPI / Razorpay)`}
                </span>
              </div>
              {(order as any).razorpayPaymentId && (
                <div className="flex justify-between py-1 border-b border-[#E8E1D9]">
                  <span className="text-slate-500 font-medium">Razorpay Payment ID:</span>
                  <span className="font-mono text-slate-800 font-semibold text-[11px]">
                    {(order as any).razorpayPaymentId}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5 text-sm font-bold text-slate-900">
                <span className="text-rose-700 font-semibold">Refund Amount to Send:</span>
                <span className="text-base text-rose-700 font-bold">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Target Status Choice */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Target Status after Bank Transfer:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('refund_initiated')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedStatus === 'refund_initiated'
                      ? 'border-[#89591C] bg-[#FAF4EC] text-[#89591C] font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                  }`}
                >
                  <div className="text-xs">Refund Initiated</div>
                  <div className="text-[10px] text-slate-500 font-normal">Customer tracking shows Step 5 (Processing)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('refunded')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedStatus === 'refunded'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                  }`}
                >
                  <div className="text-xs">Refund Completed</div>
                  <div className="text-[10px] text-slate-500 font-normal">Customer tracking shows Step 6 (Completed)</div>
                </button>
              </div>
            </div>

            {/* Payment Destination Security Explanation */}
            {order.paymentMethod === 'COD' ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Manual COD Refund Notice</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed font-normal">
                  This was a Cash on Delivery order. Razorpay does not hold these funds. Confirming this will update the system status. Ensure you have transferred the funds manually to the customer&apos;s bank.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Automated Direct Bank Reversal via Razorpay</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-normal">
                  Clicking <strong>&quot;Yes, Send Refund to Bank&quot;</strong> calls Razorpay&apos;s live API. The ₹{(order.totalAmount || 0).toLocaleString('en-IN')} will be reversed directly back to the customer&apos;s original source bank account or UPI VPA (Google Pay / PhonePe / Paytm).
                </p>
              </div>
            )}

            {/* Error Message */}
            {refundError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                {refundError}
              </div>
            )}

            {/* Success Message */}
            {refundSuccessData && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{refundSuccessData.message}</span>
                </div>
                {refundSuccessData.refundId && (
                  <p className="font-mono text-[11px] text-emerald-700">
                    Razorpay Gateway Refund ID: {refundSuccessData.refundId}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessingRefund}
                onClick={handleCloseRefundModal}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel / Keep Order
              </button>

              <button
                type="button"
                disabled={isProcessingRefund || Boolean(refundSuccessData)}
                onClick={handleProcessRefund}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingRefund ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending to Bank...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Yes, Send Refund to Bank (₹{(order.totalAmount || 0).toLocaleString('en-IN')})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

