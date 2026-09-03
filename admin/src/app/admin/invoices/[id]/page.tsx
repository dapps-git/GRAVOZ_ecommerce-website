'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { Footprints, Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
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

  const subtotal = order.subtotal ?? (order.items || []).reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = order.discountAmount || 0;
  const shipping = order.shippingFee || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:m-0 print:p-0 print:max-w-none print:w-full font-sansation">
      {/* Top Controller Bar (Hidden on Print) */}
      <div className="flex items-center justify-between print:hidden bg-white p-4 rounded-2xl border border-[#e8e2d8] shadow-2xs">
        <Link
          href="/admin/invoices"
          className="text-xs font-semibold text-slate-600 hover:text-[#89591C] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Printable Paper Document */}
      <div className="printable-invoice-container bg-white text-slate-900 rounded-2xl p-8 sm:p-10 border border-[#e8e2d8] shadow-sm space-y-8 print:border-none print:shadow-none print:p-0 print:rounded-none">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e8e2d8] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sansation">
                GRAVOZ
              </h1>
            </div>
            <p className="text-xs text-[#89591C] font-semibold tracking-wide uppercase">
              Premium Shoes for Men, Women &amp; Babies
            </p>
            <p className="text-[11px] text-slate-400">
              Official Tax Invoice &amp; Purchase Receipt
            </p>
          </div>

          <div className="text-right space-y-1">
            <h2 className="text-xl font-bold text-[#89591C] uppercase tracking-wider">
              INVOICE
            </h2>
            <p className="text-xs font-bold text-slate-900 font-mono">
              #INV-{order.orderNumber}
            </p>
            <p className="text-[11px] text-slate-500">
              Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            {order.paymentMethod && (
              <p className="text-[11px] font-semibold text-slate-700">
                Payment: {order.paymentMethod.toUpperCase()} ({order.paymentStatus || 'COMPLETED'})
              </p>
            )}
          </div>
        </div>

        {/* Customer & Billed Address */}
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-1 bg-[#faf8f5] p-4 rounded-xl border border-[#e8e2d8] print:bg-transparent print:border-none print:p-0">
            <h3 className="font-bold text-[#89591C] uppercase tracking-wider text-[11px]">
              Billed To:
            </h3>
            <p className="font-bold text-slate-900 text-sm">{customerName}</p>
            <p className="text-slate-600">{customerEmail}</p>
            <p className="text-slate-600">{customerPhone}</p>
          </div>

          <div className="space-y-1 bg-[#faf8f5] p-4 rounded-xl border border-[#e8e2d8] text-right print:bg-transparent print:border-none print:p-0">
            <h3 className="font-bold text-[#89591C] uppercase tracking-wider text-[11px]">
              Shipping Address:
            </h3>
            <p className="text-slate-800 font-medium">{addrStreet}</p>
            <p className="text-slate-600">
              {[addrCity, addrState, addrPin].filter(Boolean).join(', ')}
            </p>
            <p className="font-bold text-slate-900">{addrCountry}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-[#e8e2d8] rounded-xl overflow-hidden print:border-slate-300">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#faf8f5] text-slate-800 font-bold uppercase border-b border-[#e8e2d8] print:bg-slate-100">
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-4">Size &amp; Variant</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e2d8] print:divide-slate-200">
              {(order.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    Size {item.size || '9'}{item.color ? ` / ${item.color}` : ''}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">{item.quantity}</td>
                  <td className="py-3.5 px-4 text-right text-slate-700">₹{item.price?.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Totals */}
        <div className="flex justify-end pt-2">
          <div className="w-72 space-y-2 text-xs text-slate-600 bg-[#faf8f5] p-5 rounded-2xl border border-[#e8e2d8] print:bg-transparent print:border-none print:p-0">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                <span>− ₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping Delivery</span>
              <span className="font-semibold text-slate-900">
                {shipping > 0 ? `₹${shipping.toLocaleString('en-IN')}` : 'FREE'}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-[#e8e2d8]">
              <span>Total Paid</span>
              <span className="text-[#89591C]">₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="border-t border-[#e8e2d8] pt-6 text-center space-y-1 text-[11px] text-slate-500">
          <p className="font-semibold text-slate-700">Thank you for choosing GRAVOZ!</p>
          <p>For questions or warranty assistance, contact gravozcontact@gmail.com</p>
          <p className="text-[10px] text-slate-400">This is a computer-generated tax invoice and requires no physical signature.</p>
        </div>
      </div>
    </div>
  );
}
