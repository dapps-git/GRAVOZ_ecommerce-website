'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart } from 'lucide-react';
import { getProductRating } from '@/lib/ratingUtils';
import { useWishlist } from '@/context/WishlistContext';
import { error } from 'console';

interface RecentlyViewedItem {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  imageUrl: string;
  badge?: string;
  viewedAt?: number;
}

export default function RecentlyViewedStrip({ limit = 6 }: { limit?: number }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('gravoz_recently_viewed');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out legacy mock IDs from prior testing
          const valid = parsed.filter((item: any) => item?._id && !item._id.startsWith('p'));
          setItems(valid.slice(0, limit));
        }
      }
    } catch {
      // ignore
    }
  }, [limit]);

  if (items.length === 0) {
    return null; // Clean: only displays when user has viewed products
  }

  return (
    <section className="space-y-4 font-poppins pt-2">
      {/* Section Header */}
      <div className="relative flex items-center justify-center">
        <h2 className="font-poppins font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#111111] uppercase text-center px-4">
          Recently Viewed
        </h2>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {items.map((product, idx) => (
          <Link
            key={`${product._id}-${idx}`}
            href={`/products/${product._id}`}
            className="group bg-white rounded-none border border-[#e8e2d8] p-3 sm:p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#89591C]/40 transition-all duration-300 cursor-pointer"
          >
            {/* Product Image Card */}
            <div className="relative aspect-square w-full rounded-none overflow-hidden bg-[#faf8f5]">
              {/* Best Seller Badge (top most left) */}
              {product.badge && (
                <div className="absolute top-0 left-0 z-10">
                  <span className="px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB]">
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Wishlist Button */}
              <button
                type="button"
                aria-label="Wishlist toggle"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleWishlist({
                    productId: product._id,
                    title: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    imageUrl: product.imageUrl,
                  });
                }}
                className="absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white backdrop-blur-xs border border-white/80 shadow-xs flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
              >
                <Heart
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isInWishlist(product._id)
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-slate-600 hover:text-rose-500'
                    }`}
                />
              </button>

              {/* Product Shoe Image */}
              <Image
                src={product.imageUrl || '/products/placeholder.svg'}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Card Meta (Title, Rating, Discount Price) */}
            <div className="mt-2.5 space-y-1">
              <h3 className="text-xs sm:text-[13px] font-normal text-[#111111] uppercase tracking-wide truncate group-hover:text-[#89591C] transition-colors leading-tight">
                {product.name}
              </h3>

              {/* Star Rating */}
              {(() => {
                const { rating, reviewsCount } = getProductRating(product);
                return (
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 font-normal">
                    <Star className="w-3.5 h-3.5 text-[#8A5B2A] fill-[#8A5B2A]" strokeWidth={1.5} />
                    <span className="font-normal text-slate-700">{rating.toFixed(1)}</span>
                    <span className="text-slate-400 font-light">
                      ({reviewsCount})
                    </span>
                  </div>
                );
              })()}

              {/* Pricing with Discount */}
              <div className="flex items-baseline gap-1.5 pt-0.5">
                <span className="text-xs sm:text-sm font-medium text-[#89591C]">
                  ₹{product.price}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-light">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}


