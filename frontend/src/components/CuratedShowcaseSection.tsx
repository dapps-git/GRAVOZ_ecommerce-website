'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
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
  initialSection?: {
    title?: string;
    items?: ShowcaseCardItem[];
  };
}

// Module-level deduplication cache so 4 instances share 1 single network request
let sharedSectionsPromise: Promise<any> | null = null;
let sharedSectionsCache: any = null;

function fetchSharedHomeSections(): Promise<any> {
  if (sharedSectionsCache) {
    return Promise.resolve(sharedSectionsCache);
  }
  if (!sharedSectionsPromise) {
    sharedSectionsPromise = fetch('/api/home-sections')
      .then((r) => r.json())
      .then((data) => {
        sharedSectionsCache = data;
        sharedSectionsPromise = null;
        return data;
      })
      .catch((err) => {
        sharedSectionsPromise = null;
        throw err;
      });
  }
  return sharedSectionsPromise;
}

export default function CuratedShowcaseSection({
  sectionKey,
  fallbackTitle = 'Best Sellers',
  fallbackSubtitle = 'Our most loved handcrafted designs',
  initialSection,
}: CuratedShowcaseSectionProps) {
  const hasInitial = initialSection !== undefined;
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [title, setTitle]     = useState(initialSection?.title || fallbackTitle);
  const [items, setItems]     = useState<ShowcaseCardItem[]>(initialSection?.items || []);
  const [loading, setLoading] = useState(!hasInitial);

  useEffect(() => {
    if (hasInitial) {
      setTitle(initialSection?.title || fallbackTitle);
      setItems(initialSection?.items || []);
      setLoading(false);
      return;
    }
    fetchSharedHomeSections()
      .then((data) => {
        if (data?.success && data.sectionsByKey?.[sectionKey]) {
          const sec = data.sectionsByKey[sectionKey];
          if (sec.title) setTitle(sec.title);
          if (Array.isArray(sec.items) && sec.items.length > 0) {
            setItems(sec.items);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sectionKey, hasInitial, initialSection, fallbackTitle]);

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
            <div key={i} className="flex flex-col animate-pulse bg-white rounded-none border border-[#E5E5E5] p-3 sm:p-3.5">
              <div className="w-full aspect-square rounded-none bg-[#EBEBEB]" />
              <div className="mt-3 space-y-2">
                <div className="h-3.5 w-3/4 rounded-none bg-[#E0E0E0]" />
                <div className="h-3 w-1/3 rounded-none bg-[#E0E0E0]" />
                <div className="h-4 w-1/2 rounded-none bg-[#D0D0D0]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Product Cards Grid (2 in 1 row on mobile, 4 on desktop) ── */}
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
  const [hovered, setHovered] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);
  const mainImage = item.imageUrl || (item.images && item.images[0]) || '/products/placeholder.svg';
  const secondaryImage = item.insetImageUrl || (item.images && item.images.length > 1 ? item.images[1] : null);
  const hasSecondary = Boolean(secondaryImage && secondaryImage !== mainImage);

  const href = item.linkUrl || (item.productId ? `/products/${item.productId}` : '/products');
  const discount = item.originalPrice && item.originalPrice > item.price
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : 0;

  return (
    <Link
      href={href}
      onMouseEnter={() => { if (!hovered) setHovered(true); }}
      className="group bg-white rounded-md border border-[#E5E5E5] p-3 sm:p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#F37021]/40 transition-all duration-300 cursor-pointer"
    >
      {/* Product Image Card - aspect-square gives bigger size, rounded-md */}
      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-[#F7F7F7]">
        {/* Badge (Top Most Left if Best Seller / Discount) */}
        {discount > 0 ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-br-md rounded-tl-md text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC]">
              {discount}% OFF
            </span>
          </div>
        ) : sectionKey === 'best_sellers' ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-br-md rounded-tl-md text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC]">
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

        {/* Primary Image */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${hasSecondary && secondaryLoaded ? 'sm:group-hover:opacity-0' : ''}`}>
          <ProductImage
            src={mainImage}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            optimizeWidth={500}
            loading="lazy"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Secondary Image mounted lazily on Desktop Hover */}
        {hasSecondary && hovered && (
          <div className={`hidden sm:block absolute inset-0 bg-[#F7F7F7] transition-opacity duration-300 ${secondaryLoaded ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
            <ProductImage
              src={secondaryImage}
              alt={`${item.title} alternate view`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              optimizeWidth={500}
              loading="eager"
              onLoad={() => setSecondaryLoaded(true)}
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
      </div>

      {/* Card Meta (Title, Rating, Discount Price) */}
      <div className="mt-2.5 space-y-1">
        <h3 className="text-xs sm:text-[13px] font-normal text-[#111111] uppercase tracking-wide truncate group-hover:text-[#F37021] transition-colors leading-tight">
          {item.title}
        </h3>

        {/* Star Rating */}
        {(() => {
          const { rating, reviewsCount } = getProductRating(item);
          return (
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 font-normal">
              <Star className="w-3.5 h-3.5 text-[#F37021] fill-[#F37021]" strokeWidth={1.5} />
              <span className="font-normal text-slate-700">{rating.toFixed(1)}</span>
              <span className="text-slate-400 font-light">
                ({reviewsCount})
              </span>
            </div>
          );
        })()}

        {/* Pricing with Discount */}
        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="text-xs sm:text-sm font-medium text-[#F37021]">
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

