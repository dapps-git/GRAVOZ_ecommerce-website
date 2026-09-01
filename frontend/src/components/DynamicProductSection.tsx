'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

interface ApiProduct {
  _id: string;
  name: string;
  brand?: string;
  price: number;
  discountPrice?: number;
  originalPrice?: number;
  rating?: number;
  images: { url: string; alt?: string }[];
  slug?: string;
  targetAudience?: string;
  subCategory?: string;
}

interface MappedProduct {
  id: string;
  title: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  imageUrl: string;
  href: string;
}

interface Props {
  /** Section heading */
  heading: string;
  /** Sub-label shown above heading (optional) */
  subLabel?: string;
  /** API filter param — one of: isLatest, isFeatured, isBestSeller, isTopSeller */
  filter: 'isLatest' | 'isFeatured' | 'isBestSeller' | 'isTopSeller';
  /** Max products to show */
  limit?: number;
  /** Description shown below heading (optional) */
  description?: string;
  /** Layout style: 'grid' | 'list' */
  layout?: 'grid' | 'list';
  /** Static fallback products (shown until DB returns data) */
  fallback?: MappedProduct[];
}

function SkeletonCard() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#ede9e2]" />
      <div className="mt-2 bg-[#ede9e2] rounded-xl px-3 py-2 flex flex-col gap-1.5 border border-[#e3ddd5]">
        <div className="h-2 w-10 rounded bg-[#ddd8cf]" />
        <div className="h-3 w-4/5 rounded bg-[#ddd8cf]" />
        <div className="h-3 w-16 rounded bg-[#c9c3bc]" />
      </div>
    </div>
  );
}

function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-[#e8e2d8] bg-[#faf8f5] animate-pulse">
      <div className="w-20 h-20 flex-shrink-0 rounded-xl bg-[#ede9e2]" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-2 w-16 rounded bg-[#ddd8cf]" />
        <div className="h-3 w-32 rounded bg-[#ddd8cf]" />
        <div className="h-3 w-20 rounded bg-[#c9c3bc]" />
      </div>
    </div>
  );
}

export default function DynamicProductSection({
  heading,
  subLabel,
  filter,
  limit = 8,
  description,
  layout = 'grid',
  fallback = [],
}: Props) {
  const [products, setProducts] = useState<MappedProduct[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?${filter}=true&limit=${limit}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.products) && data.products.length > 0) {
          const mapped: MappedProduct[] = (data.products as ApiProduct[]).map((p, idx) => ({
            id: p._id || `fallback-${idx}`,
            title: p.name || 'Gravoz Footwear',
            brand: p.brand || 'Gravoz',
            price: p.discountPrice || p.price || 1399,
            originalPrice: p.price || p.originalPrice || 1429,
            rating: p.rating ?? 5.0,
            imageUrl: (typeof p.images?.[0] === 'string' ? p.images[0] : p.images?.[0]?.url) || '/products/placeholder.svg',
            href: `/products/${p.slug || p._id}`,
          }));
          setProducts(mapped);
        }
      })
      .catch(() => {/* keep fallback */})
      .finally(() => setLoading(false));
  }, [filter, limit]);

  // Top Selling Layout: 2 items per row on laptop & desktop
  if (layout === 'list') {
    return (
      <section className="space-y-4 pt-2 font-sansation">
        {/* Header */}
        <div className="relative flex items-center justify-center">
          <h2 className="font-sansation font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center px-4">
            {heading}
          </h2>
          <Link
            href="/products"
            className="absolute right-0 font-sansation text-[13px] font-normal text-[#030303] underline underline-offset-2 hover:text-[#89591C] transition-colors"
          >
            View All
          </Link>
        </div>

        <hr className="border-[#e8e2d8]" />

        {/* 2 items in 1 row on laptop / desktop view */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {loading
            ? [0, 1, 2, 3].map((i) => <SkeletonListItem key={i} />)
            : products.slice(0, limit).map((p) => (
              <Link
                key={p.id}
                href={p.href}
                className="flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#faf8f5] hover:bg-[#f3ece2] border border-[#e8e2d8] hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8]">
                  <Image
                    src={p.imageUrl}
                    alt={p.title}
                    fill
                    sizes="96px"
                    className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="font-sansation text-[10px] sm:text-[11px] text-slate-500 tracking-[0.03em] uppercase">
                    {p.brand}
                  </span>
                  <p className="font-sansation font-bold text-xs sm:text-[14px] leading-snug tracking-[0.02em] text-[#030303] truncate">
                    {p.title}
                  </p>
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="font-sansation font-bold text-xs sm:text-[14px] text-[#89591C]">
                      ₹{p.price}
                    </span>
                    {p.originalPrice > p.price && (
                      <span className="font-sansation text-[10px] sm:text-[12px] text-slate-400 line-through">
                        ₹{p.originalPrice}
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

  // Grid Layout for Latest Products, Featured Products, Best Sellers
  return (
    <section className="space-y-4 pt-2 font-sansation">
      {/* Header — clean centered uppercase font-light title */}
      <div className="flex flex-col items-center justify-center gap-1 text-center">
        {subLabel && (
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#89591C]">
            {subLabel}
          </span>
        )}
        <h2 className="font-sansation font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center px-4">
          {heading}
        </h2>
        {description && (
          <p className="text-xs text-slate-400">{description}</p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {loading
          ? [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
          : products.slice(0, limit).map((product) => (
            <Link
              key={product.id}
              href={product.href}
              className="group flex flex-col cursor-pointer"
            >
              {/* Product Image */}
              <div className="relative aspect-square w-full flex items-center justify-center p-1 sm:p-2 overflow-hidden bg-transparent">
                {/* Star Rating */}
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 z-10 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded-full shadow-2xs">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C19968] fill-[#C19968]" />
                  <span>{(product.rating || 5).toFixed(1)}</span>
                </div>
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Info Pill */}
              <div className="mt-1.5 sm:mt-2 bg-[#f4f2ee] rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between border border-[#e8e2d8] shadow-2xs gap-1 sm:gap-3 group-hover:border-slate-300 transition-colors">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="font-sansation font-normal text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.03em] block">
                    {product.brand}
                  </span>
                  <h3 className="font-sansation font-normal text-[11px] sm:text-[13px] leading-[1.31] tracking-[0.03em] text-[#030303] truncate">
                    {product.title}
                  </h3>
                </div>
                <div className="flex items-baseline gap-1 flex-shrink-0">
                  <span className="font-sansation text-xs sm:text-sm font-bold text-[#89591C]">
                    ₹{product.price}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="font-sansation text-[9px] sm:text-[10px] text-slate-400 line-through">
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
