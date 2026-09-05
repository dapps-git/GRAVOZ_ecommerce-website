'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Check,
  Truck,
  MapPin,
  Clock,
  RotateCcw,
  XCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Package,
  FileCheck2,
  PackageCheck,
  Camera,
  Upload,
  AlertCircle,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import { useUser } from '@/context/UserContext';

const STEP_DEFINITIONS = [
  { key: 'ordered', label: 'Order Placed', defaultDesc: 'Your order has been received', icon: FileCheck2 },
  { key: 'confirmed', label: 'Confirmed', defaultDesc: 'Your order is confirmed and being prepared', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', defaultDesc: 'Your package is on the way', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', defaultDesc: 'Your order is out for delivery and will reach you soon.', icon: MapPin },
  { key: 'delivered', label: 'Delivered', defaultDesc: 'Package delivered to recipient', icon: PackageCheck },
];

const RETURN_STEP_DEFINITIONS = [
  { key: 'return_requested', label: 'Return Requested', defaultDesc: 'Your return request has been submitted.' },
  { key: 'under_review', label: 'Under Review', defaultDesc: 'Our quality team is reviewing your request.' },
  { key: 'approved', label: 'Return Request Accepted', defaultDesc: 'Return request accepted! Pickup will be scheduled.' },
  { key: 'pickup_scheduled', label: 'Pickup Scheduled', defaultDesc: 'Courier partner scheduled for parcel pickup.' },
  { key: 'received', label: 'Received', defaultDesc: 'Item received at GRAVOZ fulfillment center.' },
  { key: 'refund_initiated', label: 'Refund Initiated', defaultDesc: 'Refund initiated to your account.' },
  { key: 'refunded', label: 'Refunded', defaultDesc: 'Refund completed successfully.' },
];

const RETURN_REASONS = [
  'Size/Fit Issue',
  'Received Wrong Product',
  'Product Damaged',
  'Product Quality Issue',
  'Color/Appearance Different',
  'Product Not as Described',
  'Changed My Mind',
  'Other Reason',
];

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const { user, isLoggedIn } = useUser();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(RETURN_REASONS[0]);
  const [returnDescription, setReturnDescription] = useState('');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (res.ok && data.success && data.order) {
        const fetchedOrder = data.order;
        // User Privacy & Authorization Check:
        if (isLoggedIn && user?.email) {
          const ordEmail = (fetchedOrder.customerEmail || '').toLowerCase().trim();
          const userEmail = (user.email || '').toLowerCase().trim();
          if (ordEmail && userEmail && ordEmail !== userEmail) {
            setError('No order found. You can only track orders placed with your account.');
            setOrder(null);
            return;
          }
        }
        setOrder(fetchedOrder);
      } else {
        setError(data.error || 'Order not found');
      }
    } catch {
      setError('Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, user?.email, isLoggedIn]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', note: 'Cancelled by customer' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
        setActionMsg('Your order has been cancelled.');
      } else {
        setActionMsg(data.error || 'Could not cancel order.');
      }
    } catch {
      setActionMsg('Network error. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (returnImages.length + files.length > 3) {
      setImageError('You can upload a maximum of 3 photos.');
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setImageError('Only image files are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Each photo must be under 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setReturnImages((prev) => [...prev, reader.result as string].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setReturnImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReason === 'Other Reason' && !returnDescription.trim()) {
      setImageError('Please tell us more about your reason in the description box.');
      return;
    }

    setSubmittingReturn(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'return_requested',
          returnReason: selectedReason,
          returnDescription: returnDescription.trim(),
          returnImages: returnImages,
          note: `Return requested: ${selectedReason}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
        setShowReturnModal(false);
        setActionMsg('Return request submitted successfully. Our team will review your request.');
      } else {
        setImageError(data.error || 'Could not submit return request.');
      }
    } catch {
      setImageError('Network error. Please try again.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F3] flex flex-col font-poppins">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#8A5B2A] animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAF7F3] flex flex-col font-poppins">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4 py-12">
          <XCircle className="w-12 h-12 text-rose-400" />
          <p className="text-sm font-medium text-[#111111]">{error || 'Order not found'}</p>
          <button
            type="button"
            onClick={() => router.push('/profile?tab=orders')}
            className="px-6 py-2.5 bg-[#8A5B2A] text-white text-xs font-medium rounded-lg cursor-pointer"
          >
            View My Orders
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const RETURN_STATUSES = [
    'return_requested',
    'under_review',
    'return_approved',
    'pickup_scheduled',
    'return_received',
    'refund_initiated',
    'refunded',
    'returned',
    'return_rejected',
  ];

  const orderStatus = order.orderStatus || 'ordered';
  const isReturnFlow = RETURN_STATUSES.includes(orderStatus);
  const returnStatus = isReturnFlow ? (order.returnDetails?.status || orderStatus) : null;
  const isCancelled = orderStatus === 'cancelled';
  const isDelivered = orderStatus === 'delivered';
  const cancellable = ['ordered', 'confirmed', 'processing'].includes(orderStatus);

  // Return step indexing
  const returnStepMap: Record<string, number> = {
    return_requested: 0,
    under_review: 1,
    approved: 2,
    return_approved: 2,
    pickup_scheduled: 3,
    received: 4,
    return_received: 4,
    refund_initiated: 5,
    refunded: 6,
    returned: 6,
  };
  const activeReturnStepIdx = returnStepMap[returnStatus || orderStatus] ?? 0;
  const isReturnRejected = returnStatus === 'rejected' || orderStatus === 'return_rejected';

  // Standard step index
  const stepIndexMap: Record<string, number> = {
    ordered: 0,
    confirmed: 1,
    processing: 1,
    shipped: 2,
    out_for_delivery: 3,
    delivered: 4,
  };
  const activeStepIdx = stepIndexMap[orderStatus] ?? 0;
  const currentStepDef = STEP_DEFINITIONS[activeStepIdx] || STEP_DEFINITIONS[0];

  const isPhotoPromptReason = selectedReason === 'Product Damaged' || selectedReason === 'Received Wrong Product';

  return (
    <div className="min-h-screen bg-[#FAF7F3] text-[#111111] font-poppins flex flex-col justify-between selection:bg-[#8A5B2A] selection:text-white">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#111111]">Track Order</h1>
            <p className="text-xs text-[#555555] mt-1 font-normal">
              Order ID: <span className="font-medium text-[#111111]">{order.orderNumber}</span>
            </p>
          </div>

          <a
            href="mailto:gravozcontact@gmail.com"
            className="text-xs font-medium text-[#8A5B2A] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
          >
            <span>Need Help?</span>
          </a>
        </div>

        {/* ── STANDARD DELIVERY STEPPER BAR (When Not In Return Flow) ── */}
        {!isCancelled && !isReturnFlow && (
          <div className="w-full pt-2 pb-6 border-b border-[#E5E1DC]">
            <div className="relative flex items-start justify-between">
              <div className="absolute top-3.5 sm:top-4.5 left-4 right-4 h-[2px] bg-[#E5E1DC] z-0">
                <div
                  className="h-full bg-[#8A5B2A] transition-all duration-500"
                  style={{
                    width: `${(activeStepIdx / (STEP_DEFINITIONS.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {STEP_DEFINITIONS.map((step, i) => {
                const isCompleted = i < activeStepIdx;
                const isActive = i === activeStepIdx;
                const StepIcon = step.icon || Package;

                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center relative z-10 text-center flex-1 max-w-[62px] sm:max-w-[100px]"
                  >
                    <div
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-[#8A5B2A] text-white shadow-xs border border-[#8A5B2A]'
                          : isActive
                          ? 'bg-[#111111] text-white shadow-xs ring-3 sm:ring-4 ring-[#8A5B2A]/20 border border-[#111111]'
                          : 'bg-white border border-[#E5E1DC] text-[#888888]'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                      ) : (
                        <StepIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs mt-2 leading-tight ${
                        isActive
                          ? 'font-semibold text-[#111111]'
                          : isCompleted
                          ? 'font-medium text-[#111111]'
                          : 'text-[#888888]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RETURN LIFECYCLE STEPPER (When in Return Flow) ── */}
        {isReturnFlow && !isReturnRejected && (
          <div className="w-full p-5 bg-white border border-[#E5E1DC] rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#8A5B2A]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8A5B2A]">
                  Return & Refund Progress
                </span>
              </div>
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                activeReturnStepIdx >= 2 ? 'bg-[#E8F8EE] text-[#22C55E]' : 'bg-[#FAF7F3] text-[#8A5B2A] border border-[#E5E1DC]'
              }`}>
                {RETURN_STEP_DEFINITIONS[activeReturnStepIdx]?.label}
              </span>
            </div>

            {/* Step Nodes */}
            <div className="relative flex items-start justify-between pt-2">
              <div className="absolute top-3.5 left-3 right-3 h-[2px] bg-[#E5E1DC] z-0">
                <div
                  className="h-full bg-[#8A5B2A] transition-all duration-500"
                  style={{
                    width: `${(activeReturnStepIdx / (RETURN_STEP_DEFINITIONS.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {RETURN_STEP_DEFINITIONS.map((step, i) => {
                const isCompleted = i < activeReturnStepIdx;
                const isActive = i === activeReturnStepIdx;

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10 text-center flex-1 max-w-[45px] sm:max-w-[75px]">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-medium transition-all ${
                        isCompleted
                          ? 'bg-[#8A5B2A] text-white'
                          : isActive
                          ? 'bg-[#111111] text-white ring-2 ring-[#8A5B2A]/30'
                          : 'bg-white border border-[#E5E1DC] text-[#888888]'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3 stroke-[2.5]" /> : i + 1}
                    </div>
                    <span className={`text-[9px] sm:text-[10px] mt-1.5 leading-tight ${
                      isActive ? 'font-semibold text-[#111111]' : isCompleted ? 'font-medium text-[#555555]' : 'text-[#888888]'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RETURN STATUS BANNER / ACCEPTANCE CALLOUT ── */}
        {isReturnFlow && (
          <div className="p-4 sm:p-5 rounded-2xl border shadow-2xs space-y-3 bg-white border-[#E5E1DC]">
            {activeReturnStepIdx === 2 || returnStatus === 'approved' || orderStatus === 'return_approved' ? (
              /* SPECIFIC USER REQUIREMENT: Show return request accepted */
              <div className="flex items-start gap-3 text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-emerald-900">Return Request Accepted</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    GRAVOZ has accepted your return request. Our courier partner will contact you shortly to schedule pickup from your delivery address.
                  </p>
                </div>
              </div>
            ) : isReturnRejected ? (
              <div className="flex items-start gap-3 text-rose-800 bg-rose-50 border border-rose-200 p-3.5 rounded-xl">
                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-rose-900">Return Request Declined</h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    {order.returnDetails?.rejectionReason || 'The return request could not be accepted as it does not meet our return policy conditions.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 text-amber-800 bg-[#FAF7F3] border border-[#E5E1DC] p-3.5 rounded-xl">
                <RotateCcw className="w-5 h-5 text-[#8A5B2A] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-[#111111]">{RETURN_STEP_DEFINITIONS[activeReturnStepIdx]?.label}</h3>
                  <p className="text-xs text-[#555555] mt-0.5">
                    {RETURN_STEP_DEFINITIONS[activeReturnStepIdx]?.defaultDesc}
                  </p>
                </div>
              </div>
            )}

            {/* Customer Return Details Submitted */}
            {order.returnDetails && order.returnDetails.reason && (
              <div className="pt-2 text-xs space-y-1.5 border-t border-[#E5E1DC]/60">
                <div className="flex items-center gap-2">
                  <span className="text-[#888888]">Reason for return:</span>
                  <span className="font-semibold text-[#111111] bg-[#FAF7F3] px-2 py-0.5 rounded border border-[#E5E1DC]">
                    {order.returnDetails.reason}
                  </span>
                </div>
                {order.returnDetails.description && (
                  <div className="text-[#555555]">
                    <span className="text-[#888888]">Notes: </span>
                    {order.returnDetails.description}
                  </div>
                )}
                {Array.isArray(order.returnDetails.images) && order.returnDetails.images.length > 0 && (
                  <div className="pt-1.5">
                    <span className="text-[#888888] block mb-1">Evidence Photos:</span>
                    <div className="flex items-center gap-2">
                      {order.returnDetails.images.map((img: string, idx: number) => (
                        <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#E5E1DC] bg-[#FAF7F3]">
                          <img src={img} alt="Return evidence" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ORDER SUMMARY CARD ── */}
        <div className="bg-white border border-[#E5E1DC] rounded-2xl p-5 space-y-4 shadow-2xs">
          <h3 className="text-sm font-semibold text-[#111111]">Items in this Order</h3>
          <div className="divide-y divide-[#E5E1DC]/60">
            {order.items?.map((item: any, idx: number) => {
              const prodHref = `/products/${item.productId || item.product || item.slug || item._id}`;
              return (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Link
                      href={prodHref}
                      className="relative w-14 h-14 rounded-xl bg-[#FAF7F3] border border-[#E5E1DC] flex-shrink-0 overflow-hidden hover:opacity-85 transition-opacity block"
                    >
                      <Image
                        src={item.imageUrl || '/products/placeholder.svg'}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-contain p-1"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={prodHref}
                        className="text-xs sm:text-sm font-medium text-[#111111] truncate hover:text-[#8A5B2A] transition-colors block"
                      >
                        {item.name}
                      </Link>
                      <p className="text-[11px] text-[#555555]">Size: {item.size} {item.color ? `• Color: ${item.color}` : ''} • Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[#111111] flex-shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#E5E1DC] flex justify-between items-center text-sm font-semibold">
            <span className="text-[#555555]">Total Order Amount:</span>
            <span className="text-[#8A5B2A] text-base">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Action feedback message */}
        {actionMsg && (
          <div className="p-3.5 bg-[#FAF7F3] border border-[#8A5B2A]/30 rounded-xl text-xs font-medium text-[#8A5B2A] text-center">
            {actionMsg}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/profile?tab=orders')}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#555555] hover:text-[#8A5B2A] cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </button>

          <div className="flex gap-2">
            {cancellable && !isCancelled && !isReturnFlow && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}

            {isDelivered && !isReturnFlow && (
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                className="px-4 py-2 text-xs font-medium text-white bg-[#8A5B2A] hover:bg-[#68421A] rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Request Return & Refund
              </button>
            )}
          </div>
        </div>

      </main>

      {/* ── RETURN & REFUND REQUEST MODAL ── */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E1DC] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#E5E1DC] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Request Return & Refund</h3>
                <p className="text-xs text-[#555555] mt-0.5">Please choose a reason for returning this order</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="text-[#888888] hover:text-[#111111] p-1 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReturn} className="space-y-4">
              {/* Select Reason */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-2 uppercase tracking-wide">
                  Select a reason:
                </label>
                <div className="space-y-2">
                  {RETURN_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedReason === reason
                          ? 'border-[#8A5B2A] bg-[#FAF7F3] text-[#111111] font-medium'
                          : 'border-[#E5E1DC] bg-white text-[#555555] hover:border-[#8A5B2A]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="returnReason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={() => {
                          setSelectedReason(reason);
                          setImageError('');
                        }}
                        className="accent-[#8A5B2A] w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description Box (Compulsory for Other Reason, or optional notes) */}
              {selectedReason === 'Other Reason' ? (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-[#111111]">
                    Please tell us more about your reason: <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={returnDescription}
                    onChange={(e) => setReturnDescription(e.target.value)}
                    placeholder="Please tell us more about your reason..."
                    rows={3}
                    required
                    className="w-full p-3 rounded-xl border border-[#E5E1DC] bg-[#FAF7F3] text-xs sm:text-sm text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-[#8A5B2A] focus:ring-1 focus:ring-[#8A5B2A]/20 transition-all resize-none"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#555555]">
                    Additional Comments (Optional):
                  </label>
                  <textarea
                    value={returnDescription}
                    onChange={(e) => setReturnDescription(e.target.value)}
                    placeholder="Provide additional details if any..."
                    rows={2}
                    className="w-full p-3 rounded-xl border border-[#E5E1DC] bg-[#FAF7F3] text-xs sm:text-sm text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-[#8A5B2A] focus:ring-1 focus:ring-[#8A5B2A]/20 transition-all resize-none"
                  />
                </div>
              )}

              {/* Evidence Photos Upload (Encouraged for damaged/wrong product) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#111111]">
                    Upload Photos {isPhotoPromptReason && <span className="text-amber-600 font-normal">(Recommended for damaged/wrong item)</span>}
                  </label>
                  <span className="text-[11px] text-[#888888]">Max 3 photos</span>
                </div>

                {/* Photo Previews */}
                {returnImages.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    {returnImages.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E5E1DC] group">
                        <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {returnImages.length < 3 && (
                  <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-[#E5E1DC] hover:border-[#8A5B2A] bg-[#FAF7F3] cursor-pointer transition-colors text-center">
                    <Upload className="w-5 h-5 text-[#8A5B2A] mb-1" />
                    <span className="text-xs font-medium text-[#111111]">Click to attach photos</span>
                    <span className="text-[10px] text-[#888888]">PNG, JPG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {imageError && (
                <p className="text-xs text-rose-600 font-medium">{imageError}</p>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E1DC]">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2.5 text-xs font-medium text-[#555555] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-5 py-2.5 text-xs font-medium text-white bg-[#8A5B2A] hover:bg-[#68421A] rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shadow-2xs"
                >
                  {submittingReturn && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Return Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
