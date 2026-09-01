'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Search,
  Truck,
  Check,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Package,
  ArrowRight,
  AlertCircle,
  Gift,
  FileCheck2,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react';

const STEP_DEFINITIONS = [
  { key: 'ordered', label: 'Order Placed', defaultDesc: 'Your order has been received', icon: FileCheck2 },
  { key: 'confirmed', label: 'Confirmed', defaultDesc: 'Your order is confirmed and being prepared', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', defaultDesc: 'Your package is on the way', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', defaultDesc: 'Your order is out for delivery and will reach you soon.', icon: MapPin },
  { key: 'delivered', label: 'Delivered', defaultDesc: 'Package delivered to recipient', icon: PackageCheck },
];

function TrackOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('id') || '';

  const [orderQuery, setOrderQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // If user has orders in profile, fetch their recent orders
  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          setRecentOrders(data.orders.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  const handleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch || orderQuery).trim();
    if (!q) {
      setError('Please enter an Order ID');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // First try direct ID endpoint
      const res = await fetch(`/api/orders/${encodeURIComponent(q)}`);
      const data = await res.json();

      if (res.ok && data.success && data.order) {
        setOrder(data.order);
      } else {
        // Try searching through list endpoint
        const listRes = await fetch(`/api/orders?search=${encodeURIComponent(q)}`);
        const listData = await listRes.json();
        if (listRes.ok && listData.success && listData.orders?.length > 0) {
          setOrder(listData.orders[0]);
        } else {
          setError(data.error || 'Order not found. Please check your Order ID.');
        }
      }
    } catch {
      setError('Unable to fetch tracking info. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const orderStatus = order?.orderStatus || 'ordered';
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

  const createdAtDate = order ? new Date(order.createdAt || Date.now()) : new Date();
  const deliveryExpectedDate = new Date(createdAtDate);
  deliveryExpectedDate.setDate(deliveryExpectedDate.getDate() + 3);

  const addr = order?.shippingAddress || {
    name: order?.customerName || 'Customer',
    phone: order?.customerPhone || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  };

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 font-sansation">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#030303]">Track Order</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Enter your Order ID to see real-time delivery status &amp; courier tracking
          </p>
        </div>

        <a
          href="mailto:gravozcontact@gmail.com"
          className="text-xs font-bold text-[#89591C] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
        >
          <span>Need Help?</span>
        </a>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl border border-[#e8e2d8] p-4 sm:p-5 shadow-2xs space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderQuery}
              onChange={(e) => {
                setOrderQuery(e.target.value);
                setError('');
              }}
              placeholder="Enter Order ID (e.g. GRV-XXXXXX-XXX or GVZ12345678)"
              className="w-full pl-10 pr-4 py-2.5 bg-[#faf8f5] border border-[#e8e2d8] rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-[#89591C] uppercase placeholder:normal-case font-sansation"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                <span>TRACK ORDER</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Suggestion Chips if user has recent orders */}
        {recentOrders.length > 0 && !order && (
          <div className="pt-2 border-t border-[#f0ece5] space-y-2">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Your Recent Orders:
            </span>
            <div className="flex flex-wrap gap-2">
              {recentOrders.map((ro) => (
                <button
                  key={ro._id}
                  type="button"
                  onClick={() => {
                    setOrderQuery(ro.orderNumber);
                    handleSearch(ro.orderNumber);
                  }}
                  className="px-3 py-1.5 bg-[#faf8f5] hover:bg-[#faf4ec] border border-[#e8e2d8] hover:border-[#89591C] text-[#030303] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5 text-[#89591C]" />
                  <span>{ro.orderNumber}</span>
                  <span className="text-[10px] text-slate-400">({ro.orderStatus})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── LIVE TRACKING DETAILS (Matches Screenshot 2) ── */}
      {order && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Order ID Banner */}
          <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">
              Tracking Order: <strong className="text-[#89591C]">{order.orderNumber}</strong>
            </span>
            <Link
              href={`/orders/${order._id}`}
              className="text-xs font-bold text-[#89591C] hover:underline inline-flex items-center gap-1"
            >
              Full Order Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Stepper Timeline */}
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

          {/* Active Status Card matching Screenshot 2 */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#030303]">{currentStepDef.label}</h2>
            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              {currentStepDef.defaultDesc}
            </p>
          </div>

          {/* Delivery Partner Card matching Screenshot 2 */}
          <div className="bg-white rounded-2xl border border-[#e8e2d8] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <span className="text-slate-400 font-semibold block">Delivery Partner</span>
              <h4 className="font-bold text-sm text-[#030303]">BlueDart Express</h4>
              <p className="text-slate-500">
                Tracking ID: <span className="font-semibold text-slate-800">69541785623</span>
              </p>
            </div>

            <a
              href="https://www.bluedart.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl border border-[#89591C] text-[#89591C] hover:bg-[#faf4ec] text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-1.5 self-start sm:self-auto font-montserrat"
            >
              <span>TRACK ON PARTNER SITE</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Delivery Address Card matching Screenshot 2 */}
          <div className="bg-white rounded-2xl border border-[#e8e2d8] p-5 shadow-2xs space-y-2">
            <h3 className="text-sm font-bold text-[#030303]">Delivery Address</h3>
            <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
              <p className="font-bold text-sm text-slate-900">{addr.name}</p>
              {addr.street && <p>{addr.street},</p>}
              {addr.city && <p>{addr.city} {addr.postalCode ? `- ${addr.postalCode}` : ''}</p>}
              <p>{addr.state ? `${addr.state}, ` : ''}{addr.country || 'India'}</p>
              {addr.phone && <p className="font-semibold text-slate-800 pt-0.5">{addr.phone}</p>}
            </div>
          </div>

          {/* Ordered Items */}
          {order.items && order.items.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e8e2d8] p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-[#030303]">Ordered Items ({order.items.length})</h3>
              <div className="divide-y divide-[#f0ece5]">
                {order.items.map((item: any, idx: number) => (
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
                        <h4 className="text-xs sm:text-sm font-bold text-[#030303] truncate">{item.name}</h4>
                        <p className="text-[11px] text-slate-500">Size: {item.size} • Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-white text-[#030303] font-sans flex flex-col justify-between selection:bg-[#89591C]/20 selection:text-[#89591C]">
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-[#89591C] animate-spin" />
          </div>
        }
      >
        <TrackOrderContent />
      </Suspense>
      <Footer />
    </div>
  );
}
