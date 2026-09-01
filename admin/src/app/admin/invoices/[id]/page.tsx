'use client';

import { useState, useEffect, use } from 'react';
import { Footprints, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  name: string;
  size: string;
  color?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

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
  items: OrderItem[];
  subtotal?: number;
  discountAmount?: number;
  couponCode?: string;
  tax?: number;
  shippingFee?: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
}

export default function PrintableInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        // API may return { order: {...} } or directly the order
        setOrder(data.order || data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 animate-pulse">Loading invoice...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-rose-500">Invoice not found.</div>;
  }

  // Safe customer field extraction
  const customerName =
    order.customerName || order.customer?.name || order.shippingAddress?.name || 'Customer';
  const customerEmail = order.customerEmail || order.customer?.email || '—';
  const customerPhone =
    order.customerPhone || order.customer?.phone || order.shippingAddress?.phone || '—';

  const addr = order.shippingAddress || order.customer?.shippingAddress || {};
  const addrStreet = addr.street || '—';
  const addrCity = addr.city || '';
  const addrState = addr.state || '';
  const addrPin = addr.postalCode || '';
  const addrCountry = addr.country || 'India';

  const subtotal = order.subtotal ?? order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = order.discountAmount || 0;
  const tax = order.tax || 0;
  const shipping = order.shippingFee || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Controller Bar */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/admin/invoices"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Printable Paper Document */}
      <div className="bg-white text-slate-900 rounded-2xl p-8 border border-slate-200 shadow-xl space-y-8 print:border-none print:shadow-none print:p-0">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <Footprints className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider text-slate-900">GRAVOZ</h1>
              <p className="text-xs text-slate-500 font-semibold">Premium Shoes for Men, Women &amp; Babies</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-extrabold text-indigo-600">INVOICE</h2>
            <p className="text-xs font-bold text-slate-700">#INV-{order.orderNumber}</p>
            <p className="text-[11px] text-slate-500">Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            {order.paymentMethod && (
              <p className="text-[11px] text-slate-500 mt-0.5">via {order.paymentMethod.toUpperCase()}</p>
            )}
          </div>
        </div>

        {/* Customer & Billed Address */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div>
            <h3 className="font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To:</h3>
            <p className="font-extrabold text-slate-900 text-sm">{customerName}</p>
            <p className="text-slate-600">{customerEmail}</p>
            <p className="text-slate-600">{customerPhone}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider mb-1">Shipping Address:</h3>
            <p className="text-slate-700">{addrStreet}</p>
            <p className="text-slate-700">
              {[addrCity, addrState, addrPin].filter(Boolean).join(', ')}
            </p>
            <p className="font-bold text-slate-900">{addrCountry}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3">Size</th>
              <th className="py-2.5 px-3 text-center">Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Price</th>
              <th className="py-2.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 px-3 font-bold text-slate-900">{item.name}</td>
                <td className="py-3 px-3 text-slate-600">Size {item.size}{item.color ? ` / ${item.color}` : ''}</td>
                <td className="py-3 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                <td className="py-3 px-3 text-right text-slate-700">₹{item.price.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-xs text-slate-600 border-t border-slate-200 pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                <span>− ₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-semibold text-slate-900">₹{tax.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-slate-900">
                {shipping > 0 ? `₹${shipping.toLocaleString('en-IN')}` : 'FREE'}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Paid</span>
              <span className="text-indigo-600">₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500">
          <p>Thank you for choosing GRAVOZ!</p>
          <p>For questions or support, contact gravozcontact@gmail.com</p>
        </div>
      </div>
    </div>
  );
}
