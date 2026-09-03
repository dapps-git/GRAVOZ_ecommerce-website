'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RecentlyViewedStrip from '@/components/RecentlyViewedStrip';
import RecommendationStrip from '@/components/RecommendationStrip';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useUser } from '@/context/UserContext';
import {
  Heart,
  Trash2,
  Bookmark,
  Tag,
  ChevronDown,
  ChevronUp,
  Lock,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

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
  const { toggleWishlist, isInWishlist } = useWishlist();
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
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch available coupons from backend
  useEffect(() => {
    fetch('/api/coupons')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.coupons)) {
          setAvailableCoupons(data.coupons);
        }
      })
      .catch(() => { });
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
    <div className="min-h-screen bg-[#faf8f5] text-[#030303] font-sans flex flex-col justify-between selection:bg-[#89591C]/20 selection:text-[#89591C]" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      <Header />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-3.5 sm:px-6 md:px-10 lg:px-12 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-20 lg:pb-12">

        {/* ── Page Header: Shopping Cart + Clear all ── */}
        <div className="flex items-center justify-between pb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
            Shopping Cart ({cartCount})
          </h1>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearCart();
                showToast('Shopping cart cleared.');
              }}
              className="text-xs font-semibold text-[#89591C] hover:underline transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>

        {/* ── EMPTY STATE ── */}
        {!isLoading && items.length === 0 ? (
          <div className="py-12 sm:py-16 text-center space-y-5 bg-white rounded-3xl border border-[#e8e2d8] p-6 shadow-2xs max-w-lg mx-auto animate-in fade-in duration-300">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#faf8f5] border border-[#e8e2d8] flex items-center justify-center text-slate-700 mx-auto shadow-2xs">
              <svg className="w-10 h-10 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
                Your cart is empty
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Explore our handcrafted footwear collection and add your favorite pairs.
              </p>
            </div>

            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#89591C] hover:bg-[#68421A] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-2xs transition-colors cursor-pointer"
            >
              Explore Footwear
            </Link>
          </div>
        ) : (
          /* ── POPULATED CART LAYOUT ── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">

            {/* Left Column: Cart Items + Apply Coupon */}
            <div className="lg:col-span-8 space-y-4">

              {/* Item Cards */}
              {items.map((item, idx) => {
                const isWish = isInWishlist(item.productId);
                return (
                  <div
                    key={`${item.productId}-${item.size}-${idx}`}
                    className="bg-white rounded-2xl border border-[#e8e2d8] p-4 shadow-2xs relative space-y-3.5 hover:shadow-md transition-all duration-300"
                  >
                    {/* Top Row: Thumbnail + Product Info */}
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      {/* Product Thumbnail */}
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-[#faf8f5] flex items-center justify-center overflow-hidden border border-[#f0ece5] flex-shrink-0">
                        <Image
                          src={item.imageUrl || '/products/placeholder.svg'}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100px, 120px"
                          className="object-contain p-2"
                        />
                      </div>

                      {/* Info & Details */}
                      <div className="flex-1 min-w-0 pr-7 sm:pr-8 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                          GRAVOZ
                        </span>
                        <Link
                          href={`/products/${item.productId}`}
                          className="text-xs sm:text-sm font-bold text-[#111111] uppercase tracking-wide hover:text-[#89591C] transition-colors line-clamp-2 block leading-snug"
                        >
                          {item.title}
                        </Link>
                        {item.size && (
                          <div className="pt-0.5">
                            <span className="inline-block bg-[#f4f2ee] text-slate-700 text-[11px] font-medium px-2.5 py-0.5 rounded-lg border border-[#e8e2d8]">
                              Size: {item.size}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Top-Right Wishlist Heart Button */}
                      <button
                        type="button"
                        aria-label="Wishlist toggle"
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
                          showToast(isWish ? `Removed from Wishlist` : `Saved to Wishlist ❤️`);
                        }}
                        className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Heart
                          className={`w-4 h-4 ${isWish ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`}
                        />
                      </button>
                    </div>

                    {/* Middle Controls Row: Price + Quantity Stepper + Remove Item */}
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap sm:flex-nowrap">
                      {/* Price */}
                      <span className="text-base sm:text-lg font-bold text-[#111111] min-w-[70px]">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center bg-[#f4f2ee] border border-[#e8e2d8] rounded-xl px-2.5 py-1 gap-3.5 text-xs font-bold text-[#111111] shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                          className="text-slate-600 hover:text-[#111111] font-bold text-sm px-1 cursor-pointer transition-colors"
                        >
                          −
                        </button>
                        <span className="text-xs font-bold select-none">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                          className="text-slate-600 hover:text-[#111111] font-bold text-sm px-1 cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Item Button */}
                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(item.productId, item.size);
                          showToast(`Removed ${item.title} from cart.`);
                        }}
                        className="bg-[#111111] hover:bg-black text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                        <span>Remove Item</span>
                      </button>
                    </div>

                    {/* Bottom Action: Save for Later */}
                    <div className="pt-0.5">
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
                          showToast(`Moved ${item.title} to Saved Items ❤️`);
                        }}
                        className="bg-[#faf8f5] hover:bg-slate-100 border border-[#e8e2d8] text-slate-700 text-xs font-medium px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-slate-600" />
                        <span>Save for later</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* ── APPLY COUPON CARD ── */}
              <div className="bg-white rounded-2xl border border-[#e8e2d8] shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowCoupons((prev) => !prev)}
                  className="w-full p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-[#faf8f5] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-[#89591C]" />
                    <div className="text-left">
                      <h3 className="text-xs sm:text-sm font-bold text-[#111111]">Apply Coupon</h3>
                      <p className="text-[10px] sm:text-xs text-slate-500">Get discounts on your order</p>
                    </div>
                  </div>

                  {showCoupons ? (
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                {/* Applied Coupon Badge */}
                {appliedCoupon && !showCoupons && (
                  <div className="px-4 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-[#89591C] text-white text-[11px] font-bold rounded-lg tracking-wide">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-xs text-emerald-700 font-semibold">
                        -₹{discountAmount.toLocaleString('en-IN')} saved!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Coupon Input & Available Coupons Dropdown */}
                {showCoupons && (
                  <div className="border-t border-[#f0ece5] p-4 space-y-3 bg-[#fdfcfa]">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleApplyCoupon();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        placeholder="ENTER COUPON CODE"
                        className="flex-1 px-3 py-2 text-xs bg-white border border-[#e8e2d8] rounded-xl focus:outline-none focus:border-[#89591C] uppercase font-sans tracking-wider"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading}
                        className="px-4 py-2 bg-[#89591C] hover:bg-[#68421A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
                      >
                        {couponLoading ? '...' : 'APPLY'}
                      </button>
                    </form>

                    {couponError && (
                      <p className="text-[11px] text-rose-500 font-medium">{couponError}</p>
                    )}

                    {/* List of Coupons */}
                    {availableCoupons.length > 0 && (
                      <div className="space-y-2 pt-1 max-h-60 overflow-y-auto pr-1">
                        {availableCoupons.map((c) => (
                          <div
                            key={c.code}
                            className="flex items-center justify-between gap-3 border border-dashed border-[#c9a46e] rounded-xl px-3 py-2.5 bg-white hover:bg-[#faf4ec] transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="px-2.5 py-1.5 bg-[#89591C] text-white text-[11px] font-bold rounded-lg tracking-wide flex-shrink-0">
                                {c.code}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#111111] truncate">{c.description}</p>
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
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-[#e8e2d8] p-4 sm:p-5 shadow-2xs space-y-4 sticky top-24">
                <h3 className="text-base font-bold text-[#111111] tracking-tight">
                  Order Summary
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
                    <span className="font-bold text-[#111111]">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>−₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span className="font-bold text-emerald-600">FREE</span>
                  </div>

                  <div className="border-t border-[#e8e2d8] pt-3 flex justify-between items-baseline text-sm sm:text-base font-bold text-[#111111]">
                    <span>Total Amount</span>
                    <span className="text-base sm:text-lg font-bold text-[#111111]">
                      ₹{finalTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      router.push('/login?redirect=/checkout');
                      return;
                    }
                    router.push('/checkout');
                  }}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-[#68421A] hover:bg-[#543212] text-white text-xs sm:text-sm font-bold tracking-wide shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-white" />
                  <span>Proceed to Checkout</span>
                </button>

                {/* Trust text */}
                <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Secure checkout • 100% genuine products</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Dynamic Recently Viewed & Recommendations */}
        <RecentlyViewedStrip limit={4} />
        <RecommendationStrip limit={4} title="You May Also Like" />

      </main>

      <Footer />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 bg-[#030303] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 border border-white/20 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-5 h-5 rounded-full bg-[#89591C] flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
