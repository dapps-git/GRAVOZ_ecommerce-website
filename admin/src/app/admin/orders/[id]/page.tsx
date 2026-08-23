'use client';

import { useState, useEffect, use } from 'react';
import StatusBadge from '@/components/admin/StatusBadge';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

interface OrderDetail {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    shippingAddress: { street: string; city: string; state: string; postalCode: string; country: string };
  };
  items: Array<{ name: string; size: string; color: string; quantity: number; price: number; image?: string }>;
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
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
      if (res.ok) {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-light">
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
          <p className="text-xs text-slate-500 mt-1 font-normal">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-700 font-semibold">Status:</span>
          <select
            value={order.orderStatus}
            disabled={updating}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="bg-[#faf8f5] border border-[#e8e2d8] rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
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
            <p className="font-bold text-slate-900 text-sm">{order.customer.name}</p>
            <p className="text-slate-600 font-normal">{order.customer.email}</p>
            <p className="text-slate-600 font-normal">{order.customer.phone}</p>
          </div>

          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#e8e2d8] pb-2 pt-2">
            Shipping Address
          </h3>
          <div className="text-xs text-slate-700 space-y-0.5 font-normal">
            <p>{order.customer.shippingAddress?.street}</p>
            <p>
              {order.customer.shippingAddress?.city}, {order.customer.shippingAddress?.state}{' '}
              {order.customer.shippingAddress?.postalCode}
            </p>
            <p className="font-bold text-slate-900">{order.customer.shippingAddress?.country}</p>
          </div>
        </div>

        {/* Itemized Order Breakdown (2 Cols) */}
        <div className="md:col-span-2 bg-white rounded-3xl p-5 border border-[#e8e2d8] shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#e8e2d8] pb-2">
            Ordered Shoe Items ({order.items.length})
          </h3>

          <div className="divide-y divide-[#f0ebd9]">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <p className="text-[10px] text-slate-500 font-normal">
                    Size: {item.size} • Color: {item.color || 'Default'} • Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right font-bold text-slate-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="border-t border-[#e8e2d8] pt-3 space-y-1.5 text-xs text-slate-600 font-normal">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-900 font-semibold">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span className="text-slate-900 font-semibold">${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="text-slate-900 font-semibold">${order.shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-[#e8e2d8]">
              <span>Total Amount</span>
              <span className="text-[#89591C]">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
