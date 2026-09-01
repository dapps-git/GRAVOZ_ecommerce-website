'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ChevronRight } from 'lucide-react';

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
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('gravoz_recently_viewed');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed.slice(0, limit));
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
    <section className="space-y-4 font-sansation">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-[#030303] tracking-tight">
          Recently Viewed
        </h2>
        <Link
          href="/products"
          className="text-xs font-semibold text-[#89591C] hover:underline flex items-center gap-0.5 whitespace-nowrap flex-shrink-0"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {items.map((product, idx) => (
          <Link
            key={`${product._id}-${idx}`}
            href={`/products/${product._id}`}
            className="group flex flex-col cursor-pointer bg-white"
          >
            {/* Product Image Box */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] p-2 flex items-center justify-center shadow-2xs group-hover:border-slate-300 transition-colors">
              {/* Star Rating Badge */}
              <div className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-semibold text-slate-700 z-10 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded-full shadow-2xs">
                <Star className="w-2.5 h-2.5 text-[#C19968] fill-[#C19968]" />
                <span>{(product.rating || 5).toFixed(1)}</span>
              </div>

              {/* Tag/Badge */}
              {product.badge && (
                <div className="absolute top-2 left-2 z-10">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#89591C] text-white">
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Product Image */}
              <Image
                src={product.imageUrl || '/products/product1.webp'}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Info Container */}
            <div className="mt-1.5 bg-[#f4f2ee] rounded-xl px-2.5 py-2 flex flex-col gap-0.5 border border-[#e8e2d8] group-hover:border-slate-300 transition-colors">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-sansation truncate">
                Gravoz Footwear
              </span>
              <h3 className="text-[11px] sm:text-xs font-normal text-[#030303] truncate font-sansation leading-snug">
                {product.name}
              </h3>
              <div className="flex items-baseline gap-1 pt-0.5">
                <span className="text-[11px] sm:text-xs font-bold text-[#c25e09]">₹{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[9px] text-slate-400 line-through">₹{product.originalPrice}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
