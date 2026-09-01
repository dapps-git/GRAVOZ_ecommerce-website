'use client';

import React, { useState } from 'react';
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
  Check
} from 'lucide-react';

const RECENTLY_VIEWED_FALLBACK = [
  { id: 'p1', title: "Men's Casual Comfort Sandals – WGP50020 Black", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product1.webp' },
  { id: 'p2', title: "Men's Casual Comfort Sandals – WGP50020 Tan", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product2.webp' },
  { id: 'p3', title: "Men's Casual Comfort Sandals – WGP50020 Brown", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product3.webp' },
  { id: 'p4', title: "Men's Casual Comfort Sandals – WGP50020 Olive", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product4.webp' },
];

export default function WishlistPage() {
  const router = useRouter();
  const { items, wishlistCount, removeFromWishlist, clearWishlist, isLoading } = useWishlist();
  const { addToCart } = useCart();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-white text-[#030303] font-sans flex flex-col justify-between selection:bg-[#89591C]/20 selection:text-[#89591C]">
      <Header />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-6 sm:py-10 space-y-12">

        {/* EMPTY STATE */}
        {!isLoading && items.length === 0 ? (
          <div className="py-8 sm:py-14 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
            <div className="flex justify-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#faf8f5] border border-[#e8e2d8] flex items-center justify-center text-rose-500 shadow-2xs">
                <Heart className="w-12 h-12 stroke-[1.5]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#030303] tracking-tight font-sansation">
                Your wishlist is empty.
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-sansation">
                Save your favorite footwear designs here to buy them anytime later.
              </p>
            </div>

            <div>
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#c25e09] hover:bg-[#a04a05] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-sm hover:shadow transition-all font-sansation"
              >
                Explore Footwear
              </Link>
            </div>
          </div>
        ) : (
          /* POPULATED WISHLIST */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#030303] tracking-tight font-sansation">
                  My Wishlist ({wishlistCount})
                </h1>
                <p className="text-xs text-slate-500 font-sansation mt-0.5">
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
                  className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors font-sansation"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* WISHLIST ROW LIST */}
            <div className="border-t border-b border-[#e5e5e5] divide-y divide-[#e5e5e5]">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 group"
                >
                  {/* Left: Thumbnail Image + Title */}
                  <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#f2f0ed] flex-shrink-0 flex items-center justify-center p-2.5 overflow-hidden border border-[#eae6e1]">
                      <Image
                        src={item.imageUrl || '/products/product1.webp'}
                        alt={item.title}
                        width={112}
                        height={112}
                        className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-sm sm:text-base font-medium text-[#1a1a1a] hover:text-[#c25e09] transition-colors leading-snug font-sansation line-clamp-2"
                      >
                        {item.title}
                      </Link>
                    </div>
                  </div>

                  {/* Middle / Right: Price and Action Buttons */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-4 sm:gap-8 lg:gap-12 flex-shrink-0">
                    {/* Price Section */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="text-base sm:text-lg font-bold text-[#c25e09] font-sansation">
                        ₹{item.price}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-xs sm:text-sm text-[#8a8a8a] line-through font-sansation">
                          ₹{item.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          removeFromWishlist(item.productId);
                          showToast(`Removed ${item.title} from wishlist.`);
                        }}
                        className="bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium px-5 sm:px-6 py-2.5 rounded-full transition-colors cursor-pointer font-sansation whitespace-nowrap"
                      >
                        Remove Item
                      </button>

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
                        className="bg-[#c25e09] hover:bg-[#a04a05] text-white text-xs sm:text-sm font-medium px-5 sm:px-6 py-2.5 rounded-full transition-colors cursor-pointer font-sansation whitespace-nowrap"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Strip */}
        <section className="pt-8 border-t border-[#f0ece5] space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#030303] tracking-tight font-sansation">
              Recently Viewed
            </h2>
            <p className="text-xs text-slate-500 font-sansation">
              Products
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {RECENTLY_VIEWED_FALLBACK.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex flex-col cursor-pointer bg-white"
              >
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

      <Footer />

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

