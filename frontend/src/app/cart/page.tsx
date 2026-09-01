'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useUser } from '@/context/UserContext';
import {
  ArrowRight,
  ShoppingBag,
  Star,
  ShieldCheck,
  Truck,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  X,
} from 'lucide-react';

const RECENTLY_VIEWED_FALLBACK = [
  { id: 'p1', title: "Men's Casual Comfort Sandals – WGP50020 Black", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product1.webp' },
  { id: 'p2', title: "Men's Casual Comfort Sandals – WGP50020 Tan", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product2.webp' },
  { id: 'p3', title: "Men's Casual Comfort Sandals – WGP50020 Brown", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product3.webp' },
  { id: 'p4', title: "Men's Casual Comfort Sandals – WGP50020 Olive", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product4.webp' },
];

interface CouponData {
  code: string;
  type: string;
  value: number;
  description: string;
  minPurchaseAmount: number;
}

export default function CartPage() {
  const router = useRouter();
  const { isLoggedIn } = useUser();
  const { items, cartCount, subtotal, updateQuantity, removeFromCart, clearCart, isLoading } = useCart();
  const { toggleWishlist } = useWishlist();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<CouponData[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch available coupons from backend
  useEffect(() => {
    fetch('/api/coupons')
      .then((r) => r.json())
      .then((data) => { if (data.success) setAvailableCoupons(data.coupons); })
      .catch(() => {});
  }, []);

  const handleApplyCoupon = useCallback(async (code?: string) => {
    const target = (code || couponCode).trim().toUpperCase();
    if (!target) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: target, cartTotal: subtotal }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedCoupon(data.coupon);
        setDiscountAmount(data.discountAmount || 0);
        setCouponCode(target);
        setShowCoupons(false);
        showToast(`Coupon ${target} applied! You saved ₹${data.discountAmount?.toLocaleString('en-IN') || 0}`);
      } else {
        setCouponError(data.error || 'Invalid coupon code.');
      }
    } catch {
      setCouponError('Network error. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, subtotal]);

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    setCouponError('');
    showToast('Coupon removed.');
  };

  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="min-h-screen bg-white text-[#030303] font-sans flex flex-col justify-between selection:bg-[#89591C]/20 selection:text-[#89591C]">
      <Header />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-6 sm:py-10 space-y-12">

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* CASE A: CART IS EMPTY (Matches User Screenshot 1)                 */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {!isLoading && items.length === 0 ? (
          <div className="py-8 sm:py-14 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
            {/* Empty Cart Illustration */}
            <div className="flex justify-center">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
                {/* Clean minimalist cart illustration */}
                <svg className="w-24 h-24 sm:w-32 sm:h-32 text-slate-700 stroke-[1.2]" viewBox="0 0 200 200" fill="none">
                  {/* Person with cart vector outline */}
                  <circle cx="115" cy="45" r="16" stroke="currentColor" strokeWidth="3" />
                  <path d="M100 65 Q115 58 130 65 L138 105 L115 110 L105 85" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path d="M115 110 L125 155 L135 155" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path d="M105 110 L95 155 L85 155" stroke="currentColor" strokeWidth="3" fill="none" />
                  {/* Wireframe shopping cart */}
                  <path d="M50 85 L110 85 L98 135 L58 135 Z" stroke="currentColor" strokeWidth="3" strokeDasharray="6 4" fill="#faf8f5" />
                  <line x1="68" y1="85" x2="68" y2="135" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                  <line x1="88" y1="85" x2="88" y2="135" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                  <line x1="53" y1="105" x2="105" y2="105" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                  <line x1="56" y1="120" x2="101" y2="120" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                  <circle cx="65" cy="145" r="7" stroke="currentColor" strokeWidth="3" fill="white" />
                  <circle cx="92" cy="145" r="7" stroke="currentColor" strokeWidth="3" fill="white" />
                  <path d="M42 75 L50 85" stroke="currentColor" strokeWidth="3" />
                </svg>
              </div>
            </div>

            {/* Empty Heading */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#030303] tracking-tight font-sansation">
                Your cart is currently empty.
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-sansation">
                Looks like you haven't added any footwear to your cart yet.
              </p>
            </div>

            {/* Continue Shopping Button */}
            <div>
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#c26a1b] hover:bg-[#89591C] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-sm hover:shadow transition-all font-sansation"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════════ */
          /* CASE B: CART HAS ITEMS (Matches User Screenshot 2)                */
          /* ═════════════════════════════════════════════════════════════════ */
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-[#e8e2d8] pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#030303] tracking-tight font-sansation">
                  Shopping Cart ({cartCount})
                </h1>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  showToast('Shopping cart cleared.');
                }}
                className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: List of Cart Items */}
              <div className="lg:col-span-8 space-y-3.5">
                {items.map((item, idx) => (
                  <div
                    key={`${item.productId}-${item.size}-${idx}`}
                    className="bg-white border border-[#e8e2d8] rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    {/* Item Thumbnail & Details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] flex-shrink-0">
                        <Image
                          src={item.imageUrl || '/products/placeholder.svg'}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block font-sansation">
                          Gravoz
                        </span>
                        <Link
                          href={`/products/${item.productId}`}
                          className="text-xs sm:text-sm font-semibold text-[#030303] hover:text-[#89591C] transition-colors truncate block font-sansation"
                        >
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-sansation">
                          <span className="px-2 py-0.5 rounded bg-[#f4f2ee] font-medium text-slate-700 border border-[#e8e2d8]">
                            Size: {item.size}
                          </span>
                          {item.color && (
                            <span>Color: {item.color}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline sm:flex-col sm:items-end gap-1.5 flex-shrink-0">
                      <span className="text-base sm:text-lg font-bold text-[#c26a1b]">
                        ₹{item.price * item.quantity}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{item.originalPrice * item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Quantity & Action Buttons */}
                    <div className="flex items-center gap-2.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Quantity Selector */}
                      <div className="flex items-center justify-between w-20 h-9 px-2 rounded-full bg-[#f4f2ee] border border-[#e8e2d8] text-slate-800">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                          className="text-slate-600 hover:text-black font-semibold text-xs px-1 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                          className="text-slate-600 hover:text-black font-semibold text-xs px-1 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Item Button (Black Pill matching screenshot) */}
                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(item.productId, item.size);
                          showToast(`Removed ${item.title} (Size: ${item.size}) from cart.`);
                        }}
                        className="h-9 px-3.5 rounded-full bg-[#030303] hover:bg-rose-700 text-white text-[11px] font-semibold tracking-wide transition-colors cursor-pointer shadow-2xs"
                      >
                        Remove Item
                      </button>

                      {/* Move to Wishlist */}
                      <button
                        type="button"
                        onClick={() => {
                          toggleWishlist({
                            productId: item.productId,
                            title: item.title,
                            price: item.price,
                            originalPrice: item.originalPrice,
                            imageUrl: item.imageUrl,
                            size: item.size,
                            color: item.color,
                          });
                          removeFromCart(item.productId, item.size);
                          showToast(`Moved ${item.title} to Wishlist ❤️`);
                        }}
                        title="Move to Wishlist"
                        className="h-9 px-3 rounded-full bg-[#f4f2ee] hover:bg-[#e8e2d8] text-slate-700 text-[11px] font-medium transition-colors border border-[#e8e2d8] cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Order Summary Box */}
              <div className="lg:col-span-4 space-y-4">

                {/* ── COUPONS PANEL ── */}
                <div className="bg-white border border-[#e8e2d8] rounded-2xl shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowCoupons((p) => !p)}
                    className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-[#faf8f5] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#89591C]" />
                      <span className="text-sm font-bold text-[#030303] font-sansation">Apply Coupon</span>
                    </div>
                    {showCoupons ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Applied coupon badge */}
                  {appliedCoupon && !showCoupons && (
                    <div className="px-4 pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#89591C] text-white text-[11px] font-bold rounded-lg tracking-wide">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-xs text-emerald-700 font-semibold">-₹{discountAmount.toLocaleString('en-IN')} saved!</span>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {showCoupons && (
                    <div className="border-t border-[#f0ece5] p-4 space-y-3">
                      {/* Manual input */}
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleApplyCoupon(); }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                          placeholder="ENTER COUPON CODE"
                          className="flex-1 px-3 py-2 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl focus:outline-none focus:border-[#89591C] uppercase font-sansation tracking-widest"
                        />
                        <button
                          type="submit"
                          disabled={couponLoading}
                          className="px-4 py-2 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {couponLoading ? '...' : 'APPLY'}
                        </button>
                      </form>
                      {couponError && (
                        <p className="text-[11px] text-rose-500 font-medium">{couponError}</p>
                      )}

                      {/* Available coupons from backend */}
                      <div className="space-y-2 pt-1 max-h-64 overflow-y-auto pr-1">
                        {availableCoupons.map((c) => (
                          <div
                            key={c.code}
                            className="flex items-center justify-between gap-3 border border-dashed border-[#c9a46e] rounded-xl px-3 py-2.5 bg-[#fdf8f2] hover:bg-[#faf4ec] transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="px-2.5 py-1.5 bg-[#89591C] text-white text-[11px] font-bold rounded-lg tracking-wide flex-shrink-0">
                                {c.code}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#030303] truncate">{c.description}</p>
                                <p className="text-[10px] text-slate-500">Min. order ₹{c.minPurchaseAmount.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyCoupon(c.code)}
                              disabled={couponLoading}
                              className="px-3 py-1.5 border border-[#89591C] text-[#89591C] text-[11px] font-bold rounded-lg hover:bg-[#89591C] hover:text-white transition-colors cursor-pointer flex-shrink-0 disabled:opacity-60"
                            >
                              APPLY
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── ORDER SUMMARY ── */}
                <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-2xl p-5 sm:p-6 space-y-4 sticky top-24">
                  <h3 className="text-base font-bold text-[#030303] tracking-tight font-sansation">
                    Order Summary
                  </h3>

                  <div className="space-y-2 text-xs font-sansation divide-y divide-[#f0ece5]">
                    <div className="flex justify-between py-1.5 text-slate-600">
                      <span>Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
                      <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>

                    {appliedCoupon && discountAmount > 0 && (
                      <div className="flex justify-between py-1.5 text-emerald-700 font-semibold">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span>−₹{discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1.5 text-slate-600">
                      <span>Shipping</span>
                      <span className="font-semibold text-emerald-700">FREE</span>
                    </div>

                    <div className="flex justify-between py-2 text-sm sm:text-base font-bold text-[#030303]">
                      <span>Total Amount</span>
                      <span className="text-[#c26a1b]">₹{finalTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLoggedIn) {
                        router.push('/login?redirect=/checkout');
                        return;
                      }
                      router.push('/checkout');
                    }}
                    className="w-full h-11 rounded-full bg-[#c26a1b] hover:bg-[#89591C] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer font-sansation"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-1 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-sansation">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Secure Checkout
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-500" /> Free Delivery
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* RECENTLY VIEWED / PRODUCT YOU MAY LIKE STRIP (Matches Screenshot) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <section className="pt-8 border-t border-[#f0ece5] space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#030303] tracking-tight font-sansation">
              {items.length === 0 ? 'Recently Viewed' : 'You May Also Like'}
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {RECENTLY_VIEWED_FALLBACK.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex flex-col cursor-pointer bg-white"
              >
                {/* Floating Shoe Image */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-transparent flex items-center justify-center p-2">
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-semibold text-slate-700 z-10">
                    <Star className="w-3 h-3 text-[#C19968] fill-[#C19968]" />
                    <span>5.0</span>
                  </div>
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Bottom Info Pill Box (Exact match to screenshot) */}
                <div className="mt-1.5 bg-[#f4f2ee] rounded-xl sm:rounded-2xl px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between border border-[#e8e2d8] shadow-2xs gap-1">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="font-sansation font-normal text-[9px] text-slate-500 uppercase tracking-wider block">
                      Gravoz
                    </span>
                    <h3 className="font-sansation font-normal text-[11px] sm:text-xs text-[#030303] truncate">
                      {product.title}
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-1 flex-shrink-0">
                    <span className="font-sansation text-xs font-bold text-[#89591C]">₹{product.price}</span>
                    <span className="font-sansation text-[9px] text-slate-400 line-through">₹{product.originalPrice}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>

      {/* Footer with Black Feature Bar */}
      <Footer />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#030303] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 border border-white/20 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-5 h-5 rounded-full bg-[#89591C] flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
