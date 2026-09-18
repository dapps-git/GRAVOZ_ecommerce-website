'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart } from 'lucide-react';
import { getProductRating } from '@/lib/ratingUtils';
import { useWishlist } from '@/context/WishlistContext';

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
  images?: string[];
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
    <div className="flex flex-col animate-pulse bg-white rounded-none border border-[#e8e2d8] p-3 sm:p-3.5">
      <div className="w-full aspect-square rounded-none bg-[#ede9e2]" />
      <div className="mt-2.5 space-y-2">
        <div className="h-3 w-3/4 rounded-none bg-[#ddd8cf]" />
        <div className="h-3 w-1/3 rounded-none bg-[#ddd8cf]" />
        <div className="h-4 w-1/2 rounded-none bg-[#c9c3bc]" />
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
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<MappedProduct[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?${filter}=true&limit=${limit}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.products) && data.products.length > 0) {
          const mapped: MappedProduct[] = (data.products as ApiProduct[]).map((p, idx) => {
            const allImgs: string[] = Array.isArray(p.images) && p.images.length > 0
              ? p.images.map((im: any) => (typeof im === 'string' ? im : im.url)).filter(Boolean)
              : [(typeof p.images?.[0] === 'string' ? p.images[0] : p.images?.[0]?.url) || '/products/placeholder.svg'];
            return {
              id: p._id || `fallback-${idx}`,
              title: p.name || 'Gravoz Footwear',
              brand: typeof p.brand === 'object' && p.brand !== null ? (p.brand as any).name || 'Gravoz' : (p.brand || 'Gravoz'),
              price: p.discountPrice || p.price || 1399,
              originalPrice: p.price || p.originalPrice || 1429,
              rating: p.rating ?? 5.0,
              imageUrl: allImgs[0] || '/products/placeholder.svg',
              images: allImgs,
              href: `/products/${p.slug || p._id}`,
            };
          });
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
    <section className="space-y-4 pt-2 font-poppins">
      {/* Header — clean centered uppercase font-light title */}
      <div className="flex flex-col items-center justify-center gap-1 text-center">
        {subLabel && (
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#8A5B2A]">
            {subLabel}
          </span>
        )}
        <h2 className="font-poppins font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#111111] uppercase text-center px-4">
          {heading}
        </h2>
        {description && (
          <p className="text-xs text-slate-400">{description}</p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {loading
          ? [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
          : products.slice(0, limit).map((product) => (
            <DynamicGridCard
              key={product.id}
              product={product}
              isInWishlist={isInWishlist}
              toggleWishlist={toggleWishlist}
            />
          ))}
      </div>
    </section>
  );
}

function DynamicGridCard({
  product,
  isInWishlist,
  toggleWishlist,
}: {
  product: MappedProduct;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (item: any) => void;
}) {
  const images = (product.images && product.images.length > 0)
    ? product.images
    : [product.imageUrl];
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link
      href={product.href}
      className="group bg-white rounded-none border border-[#e8e2d8] p-3 sm:p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#89591C]/40 transition-all duration-300 cursor-pointer"
    >
      {/* Product Image Card - aspect-square gives bigger size, rounded-none */}
      <div className="relative aspect-square w-full rounded-none overflow-hidden bg-[#faf8f5]">
        {/* Badge if present (top most left) */}
        {discount > 0 ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB]">
              {discount}% OFF
            </span>
          </div>
        ) : (product as any).badge ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB]">
              {(product as any).badge}
            </span>
          </div>
        ) : (product as any).isBestSeller ? (
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
              productId: product.id,
              title: product.title,
              price: product.price,
              originalPrice: product.originalPrice,
              imageUrl: product.imageUrl,
            });
          }}
          className="absolute top-2.5 right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-xs border border-white/80 shadow-xs flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
              isInWishlist(product.id)
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
              alt={`${product.title} - photo ${idx + 1}`}
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
          {product.title}
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

        {/* Price with Discount */}
        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="text-xs sm:text-sm font-medium text-[#89591C]">
            ₹{product.price}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-light">
              ₹{product.originalPrice}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
