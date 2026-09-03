'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';

export interface ShowcaseCardColor {
  name: string;
  colorCode: string;
}

export interface ShowcaseCardSize {
  size: string;
  isAvailable: boolean;
}

export interface ShowcaseCardItem {
  id?: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  insetImageUrl?: string;
  sizes?: ShowcaseCardSize[];
  colors?: ShowcaseCardColor[];
  linkUrl?: string;
  productId?: string;
  isAvailable?: boolean;
}

interface CuratedShowcaseSectionProps {
  sectionKey: 'best_sellers' | 'top_selling' | 'latest_products' | 'featured_products';
  fallbackTitle?: string;
  fallbackSubtitle?: string;
}

export default function CuratedShowcaseSection({
  sectionKey,
  fallbackTitle = 'Best Sellers',
  fallbackSubtitle = 'Our most loved handcrafted designs',
}: CuratedShowcaseSectionProps) {
  const [title, setTitle]     = useState(fallbackTitle);
  const [items, setItems]     = useState<ShowcaseCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/home-sections')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.sectionsByKey?.[sectionKey]) {
          const sec = data.sectionsByKey[sectionKey];
          if (sec.title) setTitle(sec.title);
          if (Array.isArray(sec.items) && sec.items.length > 0) {
            setItems(sec.items);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sectionKey]);

  // Don't render an empty skeleton — wait for items
  if (!loading && items.length === 0) return null;

  return (
    <section className="space-y-4 pt-2 font-poppins">
      {/* ── Section Header (Matches Suggested for You centered header) ── */}
      <div className="relative flex items-center justify-center">
        <h2 className="font-poppins font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#111111] uppercase text-center px-4">
          {title}
        </h2>
      </div>

      {/* ── Skeleton when loading ── */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col animate-pulse bg-white rounded-2xl border border-[#e8e2d8] p-2.5">
              <div className="w-full aspect-[4/3] rounded-xl bg-[#ede9e2]" />
              <div className="mt-2 space-y-1.5">
                <div className="h-3 w-3/4 rounded bg-[#ddd8cf]" />
                <div className="h-3 w-1/3 rounded bg-[#ddd8cf]" />
                <div className="h-3.5 w-1/2 rounded bg-[#c9c3bc]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Product Cards Grid (Matches Mockup Card Style) ── */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {items.slice(0, 8).map((item, idx) => {
            const itemKey = item.id || `${sectionKey}-card-${idx}`;
            const href    = item.linkUrl || (item.productId ? `/products/${item.productId}` : '/products');
            const discount = item.originalPrice && item.originalPrice > item.price
              ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
              : 0;

            return (
              <Link
                key={itemKey}
                href={href}
                className="group bg-white rounded-2xl border border-[#e8e2d8] p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#89591C]/40 transition-all duration-300 cursor-pointer"
              >
                {/* Product Image Card */}
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#faf8f5]">
                  {/* Badge (Top Left if Best Seller / Discount) */}
                  {discount > 0 ? (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-[#22C55E] text-white shadow-xs">
                        {discount}% OFF
                      </span>
                    </div>
                  ) : sectionKey === 'best_sellers' ? (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-[#68421A] text-white shadow-xs">
                        BEST SELLER
                      </span>
                    </div>
                  ) : null}

                  {/* Wishlist Button */}
                  <div className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs border border-white/80 shadow-xs flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-slate-600" />
                  </div>

                  {/* Product Shoe Image */}
                  <Image
                    src={item.imageUrl || '/products/placeholder.svg'}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Card Meta (Title, Rating, Discount Price) */}
                <div className="mt-2 space-y-1">
                  <h3 className="text-[11px] sm:text-xs font-bold text-[#111111] uppercase tracking-wide truncate group-hover:text-[#89591C] transition-colors leading-tight">
                    {item.title}
                  </h3>

                  {/* Star Rating */}
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-600">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-slate-800">5.0</span>
                    <span className="text-slate-400 font-normal">(120)</span>
                  </div>

                  {/* Pricing with Discount */}
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="text-xs sm:text-sm font-bold text-[#89591C]">
                      ₹{item.price}
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">
                        ₹{item.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
