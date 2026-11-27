'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
import { Star, Heart, Sparkles, ArrowRight } from 'lucide-react';
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
  /** Optional SSR preloaded recommendation pool */
  initialProducts?: RecProduct[];
}

export default function RecommendationStrip({
  title,
  subtitle,
  excludeIds = [],
  limit = 6,
  contextQuery,
  contextProduct,
  initialProducts,
}: Props) {
  const hasPreloaded = Array.isArray(initialProducts);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<RecProduct[]>(
    hasPreloaded ? initialProducts.slice(0, limit) : []
  );
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
    if (hasPreloaded && !contextProduct && !contextQuery) {
      setProducts(initialProducts.slice(0, limit));
      return;
    }
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(
        () => {
          fetchRecommendations();
        },
        { timeout: 1200 }
      );
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(fetchRecommendations, 150);
      return () => clearTimeout(timer);
    }
  }, [fetchRecommendations, hasPreloaded, initialProducts, limit, contextProduct, contextQuery]);

  const displayTitle = title || 'YOU MAY ALSO LIKE';

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 font-sansation pt-2">
      {/* Centered Section Header with View All */}
      <div className="relative flex flex-col items-center justify-center text-center px-4 space-y-1">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#F37021]" />
          <h2 className="font-sansation font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase">
            {displayTitle}
          </h2>
        </div>
        {subtitle ? (
          <p className="text-xs text-slate-500 font-light">{subtitle}</p>
        ) : contextProduct?.selectedColor ? (
          <p className="text-[11px] sm:text-xs text-slate-400 font-light tracking-wide">
            Curated in <span className="font-semibold text-[#F37021]">{contextProduct.selectedColor}</span> & matching styles for your taste
          </p>
        ) : null}

        <Link
          href="/products"
          className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 group inline-flex items-center gap-1 font-sansation text-xs sm:text-[13px] font-medium text-[#030303] hover:text-[#F37021] transition-colors mt-1 sm:mt-0"
        >
          <span className="underline underline-offset-4 decoration-[#E5E5E5] group-hover:decoration-[#F37021]">View All</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#F37021] group-hover:translate-x-1 transition-transform" />
        </Link>
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

      {/* Mobile View All Button */}
      <div className="flex justify-center pt-1 sm:hidden">
        <Link
          href="/products"
          className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E5E5E5] bg-white text-xs font-semibold text-slate-800 hover:text-[#F37021] hover:border-[#F37021] transition-all shadow-2xs"
        >
          <span>View All Products</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#F37021] group-hover:translate-x-1 transition-transform" />
        </Link>
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
  const [hovered, setHovered] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);
  const mainImage = (product.images && product.images[0]?.url) || '/products/placeholder.svg';
  const secondaryImage = product.images && product.images.length > 1 ? product.images[1]?.url : null;
  const hasSecondary = Boolean(secondaryImage && secondaryImage !== mainImage);

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
      href={`/products/${(product as any).slug || product._id}`}
      onMouseEnter={() => { if (!hovered) setHovered(true); }}
      className="group bg-white rounded-md border border-[#E5E5E5] p-3 sm:p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#F37021]/40 transition-all duration-300 cursor-pointer relative active:scale-[0.99]"
    >
      {/* Product Image Card - aspect-square gives taller, bigger size, rounded-md */}
      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-[#F7F7F7]">
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
              imageUrl: mainImage,
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
          <span className="pointer-events-none absolute top-0 left-0 z-20 px-2.5 py-0.5 rounded-br-md rounded-tl-md text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC]">
            Final Sale
          </span>
        ) : hasColorMatch ? (
          <span className="pointer-events-none absolute top-0 left-0 z-20 px-2.5 py-0.5 rounded-br-md rounded-tl-md text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC]">
            In {contextProduct?.selectedColor}
          </span>
        ) : null}

        {/* Primary Image */}
        <div className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${hasSecondary && secondaryLoaded ? 'sm:group-hover:opacity-0' : ''}`}>
          <ProductImage
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            optimizeWidth={500}
            loading="lazy"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Secondary Image mounted lazily on Desktop Hover */}
        {hasSecondary && hovered && (
          <div className={`pointer-events-none hidden sm:block absolute inset-0 bg-[#F7F7F7] transition-opacity duration-300 ${secondaryLoaded ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
            <ProductImage
              src={secondaryImage}
              alt={`${product.name} alternate view`}
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

      {/* Card Meta (Title, Rating, Price) */}
      <div className="mt-2.5 space-y-1.5">
        <h3 className="text-xs sm:text-[13px] font-normal text-[#111111] uppercase tracking-wide truncate group-hover:text-[#F37021] transition-colors leading-tight">
          {product.name}
        </h3>

        {/* Star Rating */}
        {(() => {
          const { rating, reviewsCount } = getProductRating(product);
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

        {/* Price */}
        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="text-xs sm:text-sm font-medium text-[#F37021]">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-light">₹{product.originalPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
