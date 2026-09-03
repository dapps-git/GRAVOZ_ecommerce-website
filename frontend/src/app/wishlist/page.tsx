'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import {
  Heart,
  Star,
  Trash2,
  ShoppingBag,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Check,
} from 'lucide-react';

interface RecentProduct {
  _id: string;
  name: string;
  slug?: string;
  price: number;
  discountPrice?: number;
  rating?: number;
  reviewsCount?: number;
  isBestSeller?: boolean;
  images?: { url: string }[];
}

export default function WishlistPage() {
  const router = useRouter();
  const { items, wishlistCount, removeFromWishlist, clearWishlist, isLoading } = useWishlist();
  const { addToCart } = useCart();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch recent/suggested items for Recently Viewed section
  useEffect(() => {
    fetch('/api/products?limit=4')
      .then((res) => res.json())
      .then((data) => {
        if (data?.products && Array.isArray(data.products)) {
          setRecentProducts(data.products.slice(0, 2));
        }
      })
      .catch(() => { });
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#030303] font-sans flex flex-col justify-between selection:bg-[#89591C]/20 selection:text-[#89591C]" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      <Header />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-3.5 sm:px-6 md:px-10 lg:px-12 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-20 lg:pb-12">

        {/* ── Page Header: My Wishlist + Clear All ── */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
              My Wishlist ({wishlistCount})
            </h1>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Saved items ready for your cart
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearWishlist();
                showToast('Wishlist cleared.');
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
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#faf8f5] border border-[#e8e2d8] flex items-center justify-center text-rose-500 mx-auto shadow-2xs">
              <Heart className="w-10 h-10 stroke-[1.5]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
                Your wishlist is empty
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Explore our handcrafted footwear collection and save your favorite pairs.
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
          /* ── POPULATED WISHLIST ITEMS ── */
          <div className="space-y-4 animate-in fade-in duration-300">
            {items.map((item) => (
              <div
                key={item.productId}
                className="bg-white rounded-2xl border border-[#e8e2d8] p-3.5 sm:p-4 shadow-2xs relative flex flex-col sm:flex-row items-stretch sm:items-center gap-4 hover:shadow-md transition-all duration-300"
              >
                {/* Product Image */}
                <div className="relative w-full sm:w-36 h-36 rounded-xl bg-[#faf8f5] flex items-center justify-center overflow-hidden border border-[#f0ece5] flex-shrink-0">
                  <Image
                    src={item.imageUrl || '/products/placeholder.svg'}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 150px"
                    className="object-contain p-2"
                  />
                </div>

                {/* Wishlist Top Right Heart Icon */}
                <button
                  type="button"
                  aria-label="Remove from wishlist"
                  onClick={() => {
                    removeFromWishlist(item.productId);
                    showToast(`Removed ${item.title} from wishlist.`);
                  }}
                  className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white shadow-xs border border-[#e8e2d8]/60 flex items-center justify-center text-slate-600 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                </button>

                {/* Details & Actions */}
                <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0 pr-6 sm:pr-8">
                  <div className="space-y-1">
                    <Link
                      href={`/products/${item.productId}`}
                      className="text-xs sm:text-sm font-bold text-[#111111] hover:text-[#89591C] uppercase tracking-wide truncate block transition-colors"
                    >
                      {item.title}
                    </Link>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-slate-800">5.0</span>
                      <span className="text-slate-400 font-normal">(120)</span>
                    </div>

                    {/* Price */}
                    <div className="pt-0.5">
                      <span className="text-base sm:text-lg font-bold text-[#111111]">
                        ₹{item.price}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-xs text-slate-400 line-through ml-2">
                          ₹{item.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-2.5 pt-1">
                    {/* Remove Item Button */}
                    <button
                      type="button"
                      onClick={() => {
                        removeFromWishlist(item.productId);
                        showToast(`Removed ${item.title} from wishlist.`);
                      }}
                      className="flex-1 sm:flex-none border border-[#e8e2d8] bg-white hover:bg-slate-50 text-[#111111] text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-700" />
                      <span>Remove Item</span>
                    </button>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={async () => {
                        await addToCart({
                          productId: item.productId,
                          title: item.title,
                          price: item.price,
                          originalPrice: item.originalPrice,
                          size: item.size || '9',
                          quantity: 1,
                          imageUrl: item.imageUrl,
                          color: item.color,
                        });
                        await removeFromWishlist(item.productId);
                        showToast(`Moved ${item.title} to Cart! Redirecting...`);
                        router.push('/cart');
                      }}
                      className="flex-1 sm:flex-none bg-[#89591C] hover:bg-[#68421A] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-white" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── RECENTLY VIEWED SECTION ── */}
        <div className="space-y-4 pt-2">
          {/* Section Header with Divider Line */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base sm:text-lg font-bold text-[#111111] whitespace-nowrap">
              Recently Viewed
            </h2>
            <div className="h-[1px] bg-[#e8e2d8] flex-1" />
            <Link
              href="/products"
              className="text-xs font-semibold text-[#89591C] hover:underline whitespace-nowrap cursor-pointer"
            >
              View all
            </Link>
          </div>

          {/* 2-Column Product Cards Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {recentProducts.map((prod, idx) => {
              const imgUrl = prod.images?.[0]?.url || '/products/placeholder.svg';
              return (
                <Link
                  key={prod._id || idx}
                  href={`/products/${prod.slug || prod._id}`}
                  className="group bg-white rounded-2xl border border-[#e8e2d8] p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#89591C]/40 transition-all duration-300 cursor-pointer"
                >
                  {/* Card Image */}
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#faf8f5]">
                    {/* Best Seller Pill */}
                    {prod.isBestSeller && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-[#68421A] text-white shadow-xs">
                          BEST SELLER
                        </span>
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <div className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs border border-white/80 shadow-xs flex items-center justify-center">
                      <Heart className="w-3.5 h-3.5 text-slate-600" />
                    </div>

                    <Image
                      src={imgUrl}
                      alt={prod.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 300px"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Card Meta */}
                  <div className="mt-2 space-y-1">
                    <h3 className="text-[11px] sm:text-xs font-bold text-[#111111] uppercase tracking-wide truncate group-hover:text-[#89591C] transition-colors leading-tight">
                      {prod.name}
                    </h3>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-600">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-slate-800">
                        {(prod.rating || 5.0).toFixed(1)}
                      </span>
                      <span className="text-slate-400 font-normal">
                        ({prod.reviewsCount || 120})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 pt-0.5">
                      <span className="text-xs sm:text-sm font-bold text-[#111111]">
                        ₹{prod.discountPrice || prod.price}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── TRUST BADGES STRIP ── */}
        <div className="bg-[#faf8f5] rounded-2xl border border-[#e8e2d8] p-3.5 sm:p-4 grid grid-cols-3 gap-2 text-center sm:text-left shadow-2xs">
          {/* Badge 1 */}
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-[#e8e2d8] flex items-center justify-center text-[#89591C] shadow-2xs flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-[#111111]">Secure Checkout</h4>
              <p className="text-[9px] sm:text-[10px] text-slate-500">100% Protected</p>
            </div>
          </div>

          {/* Badge 2 */}
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 border-x border-[#e8e2d8]/80 px-1.5 sm:px-4">
            <div className="w-8 h-8 rounded-full bg-white border border-[#e8e2d8] flex items-center justify-center text-[#89591C] shadow-2xs flex-shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-[#111111]">Easy Returns</h4>
              <p className="text-[9px] sm:text-[10px] text-slate-500">Hassle Free</p>
            </div>
          </div>

          {/* Badge 3 */}
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-[#e8e2d8] flex items-center justify-center text-[#89591C] shadow-2xs flex-shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-[#111111]">24/7 Support</h4>
              <p className="text-[9px] sm:text-[10px] text-slate-500">We&apos;re here</p>
            </div>
          </div>
        </div>

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
