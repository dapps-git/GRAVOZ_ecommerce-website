'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import StatusBadge from '@/components/admin/StatusBadge';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

interface OrderDetail {
  _id: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
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

  useEffect(() => {
    fetch(`/api/orders/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => setOrder(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{order.orderNumber}</h1>
            <StatusBadge status={order.orderStatus} />
            <StatusBadge status={order.paymentStatus} />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Placed on {new Date(order.createdAt).toLocaleString('en-IN')} via {order.paymentMethod || 'COD'}
          </p>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-700 font-semibold">Status:</span>
          <select
            value={order.orderStatus}
            disabled={updating}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="bg-[#faf8f5] border border-[#e8e2d8] rounded-2xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#89591C]"
          >
            <option value="ordered">Ordered</option>
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
          <div className="border-t border-[#e8e2d8] pt-3 space-y-1.5 text-xs text-slate-600 font-normal">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-900 font-semibold">₹{(order.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            {order.discountAmount && order.discountAmount > 0 ? (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span>− ₹{order.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span>Delivery / Shipping</span>
              <span className="text-emerald-700 font-semibold">FREE</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-[#e8e2d8]">
              <span>Total Amount</span>
              <span className="text-[#89591C]">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
