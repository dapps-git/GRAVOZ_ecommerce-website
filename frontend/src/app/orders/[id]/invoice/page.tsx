'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Printer, Download, ArrowLeft, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function OrderInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { user, isLoggedIn } = useUser();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (res.ok && data.success && data.order) {
          const ord = data.order;
          if (isLoggedIn && user?.email) {
            const ordEmail = (ord.customerEmail || '').toLowerCase().trim();
            const userEmail = (user.email || '').toLowerCase().trim();
            if (ordEmail && userEmail && ordEmail !== userEmail) {
              setError('You are not authorized to view this invoice.');
              setOrder(null);
              return;
            }
          }
          setOrder(ord);
        } else {
          setError(data.error || 'Invoice not found.');
        }
      } catch {
        setError('Failed to load invoice.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId, user, isLoggedIn]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center font-sans text-xs text-[#89591C]">
        Loading Invoice...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Invoice Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-sm">{error || 'Unable to retrieve order details.'}</p>
        <Link
          href="/profile"
          className="px-5 py-2 bg-[#89591C] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#724816] transition-colors"
        >
          Return to Profile
        </Link>
      </div>
    );
  }

  const subtotal = order.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || order.totalAmount;
  const shippingFee = order.shippingFee || (order.totalAmount > 1299 ? 0 : 99);
  const discount = order.discountAmount || 0;
  const grandTotal = order.totalAmount;
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#f4f2ee] py-6 sm:py-10 px-3 sm:px-6 font-sans">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/orders/${order._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#89591C] bg-white border border-[#e8e2d8] px-3.5 py-2 rounded-xl shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Order
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#89591C] hover:bg-[#724816] px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Download PDF
          </button>
        </div>
      </div>

      {/* Official Tax Invoice Container */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#e8e2d8] p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0 print:rounded-none">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ece7de] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-[#030303] uppercase" style={{ fontFamily: 'var(--font-playfair), Playfair Display, Georgia, serif' }}>
              GRAVOZ
            </h1>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-0.5">
              Premium Handcrafted Footwear
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              gravozcontact@gmail.com | +91 00000 000000
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#faf4ec] text-[#89591C] border border-[#e8e2d8]">
              TAX INVOICE
            </span>
            <p className="text-xs font-bold text-slate-900">
              Invoice #{order.orderNumber}
            </p>
            <p className="text-[11px] text-slate-500">
              Date: {orderDate}
            </p>
            <p className="text-[11px] text-slate-500 capitalize">
              Status: <span className="font-semibold text-emerald-700">{order.paymentStatus || 'Paid / Confirmed'}</span>
            </p>
          </div>
        </div>

        {/* Bill To & Ship To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
          <div className="space-y-1 bg-[#faf8f5] p-4 rounded-xl border border-[#f0ece5]">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Billed & Shipped To:</h3>
            <p className="font-bold text-slate-800">{order.shippingAddress?.fullName || order.customerName}</p>
            <p>{order.shippingAddress?.addressLine1 || order.customerAddress}</p>
            {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
            <p>
              {order.shippingAddress?.city}{order.shippingAddress?.city && ', '}
              {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
            </p>
            <p className="text-slate-500 pt-1">Email: {order.customerEmail}</p>
            {order.customerPhone && <p className="text-slate-500">Phone: {order.customerPhone}</p>}
          </div>

          <div className="space-y-1 bg-[#faf8f5] p-4 rounded-xl border border-[#f0ece5]">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Order Summary:</h3>
            <p><span className="text-slate-400">Order ID:</span> <span className="font-bold text-slate-800">#{order.orderNumber}</span></p>
            <p><span className="text-slate-400">Payment Method:</span> <span className="font-semibold uppercase text-slate-800">{order.paymentMethod || 'Prepaid / Online'}</span></p>
            <p><span className="text-slate-400">Fulfillment:</span> <span className="capitalize font-semibold text-slate-800">{order.orderStatus?.replace(/_/g, ' ')}</span></p>
            {order.shippingCourier && (
              <p><span className="text-slate-400">Courier:</span> <span className="font-semibold text-slate-800">{order.shippingCourier} ({order.shippingTrackingId})</span></p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-2">Item Description</th>
                <th className="py-3 px-2 text-center">Size</th>
                <th className="py-3 px-2 text-center">Qty</th>
                <th className="py-3 px-2 text-right">Price</th>
                <th className="py-3 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {order.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-3.5 px-2">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    {item.color && <p className="text-[10px] text-slate-400">Color: {item.color}</p>}
                  </td>
                  <td className="py-3.5 px-2 text-center font-medium">{item.size || '-'}</td>
                  <td className="py-3.5 px-2 text-center font-medium">{item.quantity}</td>
                  <td className="py-3.5 px-2 text-right">₹{item.price?.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-2 text-right font-bold text-slate-900">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Totals */}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon / Discount:</span>
                <span className="font-semibold">-₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Shipping Fee:</span>
              <span className="font-semibold text-slate-800">
                {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 text-[10.5px]">
              <span>Estimated GST (Included):</span>
              <span>18%</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="text-[#89591C] text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer Guarantee & Terms */}
        <div className="pt-6 border-t border-[#ece7de] text-center space-y-2 text-[11px] text-slate-400">
          <div className="flex items-center justify-center gap-4 text-slate-600 font-medium text-xs">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#89591C]" /> 100% Authentic Handcrafted
            </span>
            <span>•</span>
            <span>7-Day Easy Returns & Exchanges</span>
          </div>
          <p>This is an authentic computer-generated tax invoice from GRAVOZ Footwear. No signature is required.</p>
          <p className="text-[10px] text-slate-400">© {new Date().getFullYear()} GRAVOZ Store. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}
