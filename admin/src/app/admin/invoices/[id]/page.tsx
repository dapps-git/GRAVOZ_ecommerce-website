'use client';

import { useState, useEffect, use } from 'react';
import { Footprints, Printer, ArrowLeft } from 'lucide-react';
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
  items: Array<{ name: string; size: string; color: string; quantity: number; price: number }>;
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
}

export default function PrintableInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => setOrder(data))
      .catch((err) => console.error(err));
  }, [resolvedParams.id]);

  if (!order) {
    return <div className="p-8 text-center text-slate-400">Loading invoice...</div>;
  }

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
              <p className="text-xs text-slate-500 font-semibold">Premium Shoes for Men, Women & Babies</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-extrabold text-indigo-600">INVOICE</h2>
            <p className="text-xs font-bold text-slate-700">#INV-{order.orderNumber}</p>
            <p className="text-[11px] text-slate-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Customer & Billed Address */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div>
            <h3 className="font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To:</h3>
            <p className="font-extrabold text-slate-900 text-sm">{order.customer.name}</p>
            <p className="text-slate-600">{order.customer.email}</p>
            <p className="text-slate-600">{order.customer.phone}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider mb-1">Shipping Address:</h3>
            <p className="text-slate-700">{order.customer.shippingAddress?.street}</p>
            <p className="text-slate-700">
              {order.customer.shippingAddress?.city}, {order.customer.shippingAddress?.state}{' '}
              {order.customer.shippingAddress?.postalCode}
            </p>
            <p className="font-bold text-slate-900">{order.customer.shippingAddress?.country}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3">Size / Spec</th>
              <th className="py-2.5 px-3 text-center">Qty</th>
              <th className="py-2.5 px-3 text-right">Price</th>
              <th className="py-2.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 px-3 font-bold text-slate-900">{item.name}</td>
                <td className="py-3 px-3 text-slate-600">Size {item.size}</td>
                <td className="py-3 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                <td className="py-3 px-3 text-right text-slate-700">${item.price.toFixed(2)}</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">
                  ${(item.price * item.quantity).toFixed(2)}
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
              <span className="font-semibold text-slate-900">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span className="font-semibold text-slate-900">${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-slate-900">${order.shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Paid</span>
              <span className="text-indigo-600">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500">
          <p>Thank you for choosing GRAVOZ eCommerce Shoes!</p>
          <p>For questions or support, contact support@gravoz.com</p>
        </div>
      </div>
    </div>
  );
}
