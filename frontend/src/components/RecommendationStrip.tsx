'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart } from 'lucide-react';
import { extractSignals } from '@/lib/userBehavior';

interface RecProduct {
  _id: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  subCategory?: string;
  targetAudience?: string;
  rating?: number;
  images: { url: string; alt: string }[];
}

interface Props {
  /** Title of the recommendation strip */
  title?: string;
  /** Product IDs to exclude (e.g. current product page) */
  excludeIds?: string[];
  /** Max products to show */
  limit?: number;
  /** Contextual override signals (e.g. "user just searched black shoes") */
  contextQuery?: string;
}

export default function RecommendationStrip({
  title,
  excludeIds = [],
  limit = 6,
  contextQuery,
}: Props) {
  const [products, setProducts] = useState<RecProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState<'personalized' | 'popular'>('personalized');

  const fetchRecommendations = useCallback(async () => {
    try {
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
          excludeIds,
          limit,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          setReason(data.reason || 'personalized');
        }
      }
    } catch {
      // Fallback stays in state
    }
  }, [excludeIds, limit, contextQuery]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const displayTitle = title || 'YOU MAY ALSO LIKE';

  return (
    <section className="space-y-4 font-sansation pt-2">
      {/* Centered Section Header */}
      <div className="flex justify-center">
        <h2 className="font-sansation font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center px-4">
          {displayTitle}
        </h2>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-4">
        {products.slice(0, limit).map((product, idx) => (
          <Link
            key={product._id}
            href={`/products/${product._id}`}
            className="group bg-white rounded-2xl border border-[#e8e2d8] p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#89591C]/40 transition-all duration-300 cursor-pointer"
          >
            {/* Product Image Card */}
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#faf8f5]">
              {/* Wishlist Button */}
              <div className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs border border-white/80 shadow-xs flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-slate-600" />
              </div>

              <Image
                src={product.images?.[0]?.url || '/products/placeholder.svg'}
                alt={product.images?.[0]?.alt || product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Card Meta (Title, Rating, Discount Price) */}
            <div className="mt-2 space-y-1">
              <h3 className="text-[11px] sm:text-xs font-bold text-[#111111] uppercase tracking-wide truncate group-hover:text-[#89591C] transition-colors leading-tight">
                {product.name}
              </h3>

              {/* Star Rating */}
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-600">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="font-bold text-slate-800">{(product.rating || 5).toFixed(1)}</span>
                <span className="text-slate-400 font-normal">(120)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1.5 pt-0.5">
                <span className="text-xs sm:text-sm font-bold text-[#89591C]">₹{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">₹{product.originalPrice}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
