'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { getProductRating } from '@/lib/ratingUtils';
import { useWishlist } from '@/context/WishlistContext';

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
  images?: string[];
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
  const { isInWishlist, toggleWishlist } = useWishlist();
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col animate-pulse bg-white rounded-none border border-[#e8e2d8] p-3 sm:p-3.5">
              <div className="w-full aspect-square rounded-none bg-[#ede9e2]" />
              <div className="mt-3 space-y-2">
                <div className="h-3.5 w-3/4 rounded-none bg-[#ddd8cf]" />
                <div className="h-3 w-1/3 rounded-none bg-[#ddd8cf]" />
                <div className="h-4 w-1/2 rounded-none bg-[#c9c3bc]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Product Cards Grid (Bigger cards, 4 in row, rounded-none) ── */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {items.slice(0, 8).map((item, idx) => (
            <CuratedCardItem
              key={item.id || `${sectionKey}-card-${idx}`}
              item={item}
              sectionKey={sectionKey}
              isInWishlist={isInWishlist}
              toggleWishlist={toggleWishlist}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CuratedCardItem({
  item,
  sectionKey,
  isInWishlist,
  toggleWishlist,
}: {
  item: ShowcaseCardItem;
  sectionKey: string;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (item: any) => void;
}) {
  const images = (item.images && item.images.length > 0)
    ? item.images
    : ([item.imageUrl, item.insetImageUrl].filter(Boolean) as string[]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  const href = item.linkUrl || (item.productId ? `/products/${item.productId}` : '/products');
  const discount = item.originalPrice && item.originalPrice > item.price
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : 0;

  return (
    <Link
      href={href}
      className="group bg-white rounded-none border border-[#e8e2d8] p-3 sm:p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#89591C]/40 transition-all duration-300 cursor-pointer"
    >
      {/* Product Image Card - aspect-square gives bigger size, rounded-none */}
      <div className="relative aspect-square w-full rounded-none overflow-hidden bg-[#faf8f5]">
        {/* Badge (Top Most Left if Best Seller / Discount) */}
        {discount > 0 ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB]">
              {discount}% OFF
            </span>
          </div>
        ) : sectionKey === 'best_sellers' ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB]">
              BEST SELLER
            </span>
          </div>
        ) : null}

        {/* Wishlist Button */}
        <button
          type="button"
          aria-label="Wishlist toggle"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist({
              productId: item.productId || item.id || '',
              title: item.title,
              price: item.price,
              originalPrice: item.originalPrice,
              imageUrl: item.imageUrl,
            });
          }}
          className="absolute top-2.5 right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-xs border border-white/80 shadow-xs flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
              isInWishlist(item.productId || item.id || '')
                ? 'fill-rose-500 text-rose-500'
                : 'text-slate-600 hover:text-rose-500'
            }`}
          />
        </button>

        {/* Sub-images layer with 3-second animated transition (no dots) */}
        {images.map((imgUrl, idx) => (
          <div
            key={`${imgUrl}-${idx}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIdx
                ? 'opacity-100 z-10 pointer-events-auto'
                : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <Image
              src={imgUrl}
              alt={`${item.title} - photo ${idx + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>

      {/* Card Meta (Title, Rating, Discount Price) */}
      <div className="mt-2.5 space-y-1">
        <h3 className="text-xs sm:text-[13px] font-normal text-[#111111] uppercase tracking-wide truncate group-hover:text-[#89591C] transition-colors leading-tight">
          {item.title}
        </h3>

        {/* Star Rating */}
        {(() => {
          const { rating, reviewsCount } = getProductRating(item);
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
            ₹{item.price}
          </span>
          {item.originalPrice && item.originalPrice > item.price && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-light">
              ₹{item.originalPrice}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

