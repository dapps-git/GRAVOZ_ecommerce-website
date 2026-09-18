'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, Sparkles } from 'lucide-react';
import { extractSignals } from '@/lib/userBehavior';
import { getProductRating } from '@/lib/ratingUtils';
import { useWishlist } from '@/context/WishlistContext';

export interface ContextProduct {
  id?: string;
  name?: string;
  subCategory?: string;
  selectedColor?: string;
  colors?: string[];
  targetAudience?: string;
  price?: number;
  shoeType?: string;
}

interface RecProduct {
  _id: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  subCategory?: string;
  targetAudience?: string;
  rating?: number;
  colors?: string[];
  colorVariants?: { name: string; colorCode?: string; imageUrl?: string }[];
  images: { url: string; alt: string }[];
  noReturnRefundExchange?: boolean;
}

interface Props {
  /** Title of the recommendation strip */
  title?: string;
  /** Optional subtitle or note */
  subtitle?: string;
  /** Product IDs to exclude (e.g. current product page) */
  excludeIds?: string[];
  /** Max products to show */
  limit?: number;
  /** Contextual override signals (e.g. "user just searched black shoes") */
  contextQuery?: string;
  /** Context product for reference taste matching */
  contextProduct?: ContextProduct;
}

export default function RecommendationStrip({
  title,
  subtitle,
  excludeIds = [],
  limit = 6,
  contextQuery,
  contextProduct,
}: Props) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<RecProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sensedColor, setSensedColor] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      const signals = extractSignals();

      if (contextQuery) {
        const terms = contextQuery.toLowerCase().split(/\s+/).filter(Boolean);
        signals.keywords = [...new Set([...terms, ...signals.keywords])].slice(0, 12);
        const colorKeywords = ['black', 'brown', 'tan', 'white', 'olive', 'grey', 'gray', 'beige', 'navy', 'red'];
        for (const color of colorKeywords) {
          if (terms.includes(color) && !signals.colors.includes(color)) {
            signals.colors = [color, ...signals.colors].slice(0, 5);
          }
        }
      }

      const res = await fetch('/api/products/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...signals,
          contextProduct,
          excludeIds,
          limit,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.products && Array.isArray(data.products)) {
          setProducts(data.products);
          if (data.tasteSensed?.referenceColor) {
            setSensedColor(data.tasteSensed.referenceColor);
          }
        }
      }
    } catch {
      // Fallback stays in state
    } finally {
      setIsLoading(false);
    }
  }, [
    excludeIds.join(','),
    limit,
    contextQuery,
    contextProduct?.id,
    contextProduct?.selectedColor,
    contextProduct?.subCategory,
  ]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const displayTitle = title || 'YOU MAY ALSO LIKE';

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 font-sansation pt-2">
      {/* Centered Section Header */}
      <div className="flex flex-col items-center justify-center text-center px-4 space-y-1">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#89591C]" />
          <h2 className="font-sansation font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase">
            {displayTitle}
          </h2>
        </div>
        {subtitle ? (
          <p className="text-xs text-slate-500 font-light">{subtitle}</p>
        ) : contextProduct?.selectedColor ? (
          <p className="text-[11px] sm:text-xs text-slate-400 font-light tracking-wide">
            Curated in <span className="font-semibold text-[#89591C]">{contextProduct.selectedColor}</span> & matching styles for your taste
          </p>
        ) : null}
      </div>

      {/* Product Cards Grid (4 in one row on desktop, rounded-none, bigger size) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {products.slice(0, limit).map((product) => (
          <RecProductCard
            key={product._id}
            product={product}
            isInWishlist={isInWishlist}
            toggleWishlist={toggleWishlist}
            contextProduct={contextProduct}
          />
        ))}
      </div>
    </section>
  );
}

function RecProductCard({
  product,
  isInWishlist,
  toggleWishlist,
  contextProduct,
}: {
  product: RecProduct;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (item: any) => void;
  contextProduct?: ContextProduct;
}) {
  const images =
    product.images && product.images.length > 0
      ? product.images.map((i) => i.url)
      : ['/products/placeholder.svg'];
  const [currentIdx, setCurrentIdx] = useState(0);

  // Auto-cycle through sub-images every 3 seconds (without dots)
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [images.length]);

  const productColors = [
    ...(product.colors || []),
    ...(product.colorVariants?.map((c) => c.name) || []),
  ];
  const hasColorMatch =
    contextProduct?.selectedColor &&
    productColors.some(
      (c) => c.toLowerCase() === contextProduct.selectedColor?.toLowerCase()
    );

  return (
    <Link
      href={`/products/${product._id}`}
      className="group bg-white rounded-none border border-[#e8e2d8] p-3 sm:p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#89591C]/40 transition-all duration-300 cursor-pointer relative"
    >
      {/* Product Image Card - aspect-square gives taller, bigger size, rounded-none */}
      <div className="relative aspect-square w-full rounded-none overflow-hidden bg-[#faf8f5]">
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
              imageUrl: images[0] || '/products/placeholder.svg',
            });
          }}
          className="absolute top-2.5 right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-xs border border-white/80 shadow-xs flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
              isInWishlist(product._id)
                ? 'fill-rose-500 text-rose-500'
                : 'text-slate-600 hover:text-rose-500'
            }`}
          />
        </button>

        {/* Match Badge or Final Sale Badge (top most left) */}
        {product.noReturnRefundExchange ? (
          <span className="absolute top-0 left-0 z-20 px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB]">
            Final Sale
          </span>
        ) : hasColorMatch ? (
          <span className="absolute top-0 left-0 z-20 px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB]">
            In {contextProduct?.selectedColor}
          </span>
        ) : null}

        {/* Sub-images with smooth 3-second transition, NO dots */}
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
              alt={`${product.name} - photo ${idx + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>

      {/* Card Meta (Title, Rating, Color Dots, Price) */}
      <div className="mt-2.5 space-y-1.5">
        <h3 className="text-xs sm:text-[13px] font-normal text-[#111111] uppercase tracking-wide truncate group-hover:text-[#89591C] transition-colors leading-tight">
          {product.name}
        </h3>

        {/* Available Color Dots */}
        {product.colorVariants && product.colorVariants.length > 0 && (
          <div className="flex items-center gap-1 pt-0.5">
            {product.colorVariants.slice(0, 4).map((variant, idx) => {
              const colorHex =
                variant.colorCode ||
                (variant.name.toLowerCase() === 'black'
                  ? '#1a1a1a'
                  : variant.name.toLowerCase() === 'brown'
                  ? '#4a2c11'
                  : variant.name.toLowerCase() === 'tan'
                  ? '#c28b57'
                  : variant.name.toLowerCase() === 'olive'
                  ? '#556b2f'
                  : variant.name.toLowerCase() === 'white'
                  ? '#f3f3f3'
                  : '#888888');
              const isSelectedTaste =
                contextProduct?.selectedColor &&
                variant.name.toLowerCase() === contextProduct.selectedColor.toLowerCase();

              return (
                <span
                  key={idx}
                  title={variant.name}
                  className={`w-2.5 h-2.5 rounded-full border ${
                    isSelectedTaste ? 'border-[#89591C] ring-1 ring-[#89591C]' : 'border-black/20'
                  }`}
                  style={{ backgroundColor: colorHex }}
                />
              );
            })}
            {product.colorVariants.length > 4 && (
              <span className="text-[9px] text-slate-400">+{product.colorVariants.length - 4}</span>
            )}
          </div>
        )}

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

        {/* Price */}
        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="text-xs sm:text-sm font-medium text-[#89591C]">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-light">₹{product.originalPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
