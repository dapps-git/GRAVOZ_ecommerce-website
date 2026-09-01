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
  ShoppingBag,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Star,
  CheckCircle2,
  Headphones,
  Package,
  Gift,
  FileCheck2,
  PackageCheck,
} from 'lucide-react';

const STEP_DEFINITIONS = [
  { key: 'ordered', label: 'Order Placed', defaultDesc: 'Your order has been received', icon: FileCheck2 },
  { key: 'confirmed', label: 'Confirmed', defaultDesc: 'Your order is confirmed and being prepared', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', defaultDesc: 'Your package is on the way', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', defaultDesc: 'Your order is out for delivery and will reach you soon.', icon: MapPin },
  { key: 'delivered', label: 'Delivered', defaultDesc: 'Package delivered to recipient', icon: PackageCheck },
];

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [returning, setReturning] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
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
  }, [orderId]);

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

  const handleReturnRequest = async () => {
    if (!confirm('Request a return for this order?')) return;
    setReturning(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'return_requested', note: 'Return requested by customer' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
        setActionMsg('Return request submitted. We will contact you within 24 hours.');
      } else {
        setActionMsg(data.error || 'Could not request return.');
      }
    } catch {
      setActionMsg('Network error. Please try again.');
    } finally {
      setReturning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sansation">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#89591C] animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sansation">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4 py-12">
          <XCircle className="w-12 h-12 text-rose-400" />
          <p className="text-sm font-bold text-slate-700">{error || 'Order not found'}</p>
          <button
            type="button"
            onClick={() => router.push('/profile?tab=orders')}
            className="px-6 py-2.5 bg-[#89591C] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            View My Orders
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const orderStatus = order.orderStatus || 'ordered';
  const isCancelled = orderStatus === 'cancelled';
  const isDelivered = orderStatus === 'delivered';
  const isReturnFlow = ['return_requested', 'returned', 'refunded'].includes(orderStatus);
  const cancellable = ['ordered', 'confirmed', 'processing'].includes(orderStatus);

  // Determine active step index
  const stepIndexMap: Record<string, number> = {
    ordered: 0,
    confirmed: 1,
    processing: 1,
    shipped: 2,
    out_for_delivery: 3,
    delivered: 4,
  };
  const activeStepIdx = stepIndexMap[orderStatus] ?? 0;

  // Active status display
  const currentStepDef = STEP_DEFINITIONS[activeStepIdx] || STEP_DEFINITIONS[0];
  const activeStatusTitle = isCancelled
    ? 'Order Cancelled'
    : isReturnFlow
    ? 'Return Requested'
    : currentStepDef.label;

  const activeStatusDescription = isCancelled
    ? 'This order has been cancelled.'
    : isReturnFlow
    ? 'Your return request has been recorded. Our courier partner will schedule pickup.'
    : currentStepDef.defaultDesc;

  // Timestamps mockup helpers
  const createdAtDate = new Date(order.createdAt || Date.now());
  const deliveryExpectedDate = new Date(createdAtDate);
  deliveryExpectedDate.setDate(deliveryExpectedDate.getDate() + 3);

  // Address
  const addr = order.shippingAddress || {
    name: order.customerName || 'Sarah Johnson',
    phone: order.customerPhone || '+91 98765 43210',
    street: '123, Green Park Street, Anna Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600040',
    country: 'India',
  };

  return (
    <div className="min-h-screen bg-white text-[#030303] font-sans flex flex-col justify-between selection:bg-[#89591C]/20 selection:text-[#89591C]">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 font-montserrat">
        
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#030303]">Track Order</h1>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Order ID: <span className="font-medium text-[#030303]">{order.orderNumber}</span>
            </p>
          </div>

          <a
            href="mailto:gravozcontact@gmail.com"
            className="text-xs font-medium text-[#89591C] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
          >
            <span>Need Help?</span>
          </a>
        </div>

        {/* ── STEPPER BAR ── */}
        {!isCancelled && !isReturnFlow && (
          <div className="w-full pt-2 pb-6 border-b border-[#f0ece5] font-montserrat">
            <div className="relative flex items-start justify-between">
              {/* Connecting Background Line */}
              <div className="absolute top-3.5 sm:top-4.5 left-4 right-4 h-[2px] bg-[#e8e2d8] z-0">
                <div
                  className="h-full bg-[#557244] transition-all duration-500"
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
                    {/* Circle Node */}
                    <div
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-[#557244] text-white shadow-xs border border-[#557244]'
                          : isActive
                          ? 'bg-[#89591C] text-white shadow-xs ring-3 sm:ring-4 ring-[#89591C]/20 border border-[#89591C]'
                          : 'bg-white border border-[#d8cebe] text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2.5]" />
                      ) : (
                        <StepIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`text-[9px] sm:text-[11px] mt-1.5 sm:mt-2 leading-tight tracking-tight ${
                        isActive
                          ? 'font-semibold text-[#030303]'
                          : isCompleted
                          ? 'font-medium text-slate-700'
                          : 'font-normal text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>

                    {/* Date details */}
                    <span className="text-[8px] sm:text-[10px] text-slate-400 mt-0.5 font-normal leading-none whitespace-nowrap">
                      {isCompleted || isActive ? (
                        new Date(createdAtDate.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      ) : (
                        `Exp: ${deliveryExpectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ACTIVE STATUS CARD ── */}
        <div className="space-y-1 font-montserrat">
          <h2 className="text-lg sm:text-xl font-semibold text-[#030303]">{activeStatusTitle}</h2>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            {activeStatusDescription}
          </p>
        </div>

        {/* ── DELIVERY PARTNER CARD ── */}
        <div className="bg-white rounded-2xl border border-[#e8e2d8] p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-montserrat">
          <div className="space-y-1 text-xs">
            <span className="text-slate-400 font-medium block">Delivery Partner</span>
            <h4 className="font-semibold text-sm text-[#030303]">
              {order.courierPartner || order.deliveryPartner || 'BlueDart Express'}
            </h4>
            <p className="text-slate-500 font-normal">
              Tracking ID: <span className="font-medium text-slate-800">{order.trackingNumber || order.awbNumber || order.trackingId || '69541785623'}</span>
            </p>
          </div>

          <a
            href={order.courierTrackingUrl || 'https://www.bluedart.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl border border-[#89591C] text-[#89591C] hover:bg-[#faf4ec] text-[11px] font-medium uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <span>Track on Partner Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* ── DELIVERY ADDRESS CARD ── */}
        <div className="bg-white rounded-2xl border border-[#e8e2d8] p-4 sm:p-5 shadow-2xs space-y-2 font-montserrat">
          <h3 className="text-xs sm:text-sm font-semibold text-[#030303]">Delivery Address</h3>
          <div className="text-xs text-slate-600 space-y-0.5 leading-relaxed font-normal">
            <p className="font-medium text-slate-900">{addr.name}</p>
            <p>{addr.street},</p>
            <p>{addr.city} - {addr.postalCode}</p>
            <p>{addr.state}, {addr.country || 'India'}</p>
            <p className="font-medium text-slate-800 pt-0.5">{addr.phone}</p>
          </div>
        </div>

        {/* ── ITEMS IN ORDER ── */}
        <div className="bg-white rounded-2xl border border-[#e8e2d8] p-4 sm:p-5 shadow-2xs space-y-3 font-montserrat">
          <h3 className="text-xs sm:text-sm font-semibold text-[#030303]">Ordered Items ({order.items?.length || 0})</h3>
          <div className="divide-y divide-[#f0ece5]">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-[#faf8f5] p-1 border border-[#e8e2d8] overflow-hidden flex-shrink-0">
                    <Image
                      src={item.imageUrl || '/products/product1.webp'}
                      alt={item.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs sm:text-sm font-medium text-[#030303] truncate">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 font-normal">Size: {item.size} • Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action feedback message */}
        {actionMsg && (
          <div className="p-3.5 bg-[#faf4ec] border border-[#e8d5b5] rounded-xl text-xs font-semibold text-[#89591C] text-center">
            {actionMsg}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/profile?tab=orders')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#89591C] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </button>

          <div className="flex gap-2">
            {cancellable && !isCancelled && !isReturnFlow && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}

            {isDelivered && !isReturnFlow && (
              <button
                type="button"
                onClick={handleReturnRequest}
                disabled={returning}
                className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
              >
                {returning ? 'Submitting...' : 'Request Return'}
              </button>
            )}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
