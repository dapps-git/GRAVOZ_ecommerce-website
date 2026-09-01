'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Sparkles, ChevronRight } from 'lucide-react';
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

const FALLBACK_RECS: RecProduct[] = [
  {
    _id: 'p1',
    name: "Men's Casual Comfort Sandals – Black",
    brand: 'Gravoz',
    price: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product1.webp', alt: 'Black Sandals' }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
  },
  {
    _id: 'p2',
    name: "Men's Casual Comfort Sandals – Tan",
    brand: 'Gravoz',
    price: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product2.webp', alt: 'Tan Sandals' }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
  },
  {
    _id: 'p3',
    name: "Men's Casual Comfort Sandals – Brown",
    brand: 'Gravoz',
    price: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product3.webp', alt: 'Brown Sandals' }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
  },
  {
    _id: 'p4',
    name: "Men's Casual Comfort Sandals – Olive",
    brand: 'Gravoz',
    price: 1399,
    originalPrice: 1429,
    rating: 5.0,
    images: [{ url: '/products/product4.webp', alt: 'Olive Sandals' }],
    targetAudience: 'Men',
    subCategory: 'Casual Sandal',
  },
  {
    _id: 'p5',
    name: "Men's Casual Sneaker – Classic White",
    brand: 'Gravoz',
    price: 1599,
    originalPrice: 1799,
    rating: 5.0,
    images: [{ url: '/products/product5.webp', alt: 'White Sneakers' }],
    targetAudience: 'Men',
    subCategory: 'Casual Shoe',
  },
  {
    _id: 'p6',
    name: "Women's Comfort Casual Strap Sandal",
    brand: 'Gravoz',
    price: 1299,
    originalPrice: 1499,
    rating: 5.0,
    images: [{ url: '/products/product6.webp', alt: "Women's Sandal" }],
    targetAudience: 'Women',
    subCategory: 'Casual Sandal',
  },
];

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
  const [products, setProducts] = useState<RecProduct[]>(FALLBACK_RECS.slice(0, limit));
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState<'personalized' | 'popular'>('personalized');

  const fetchRecommendations = useCallback(async () => {
    try {
      // Extract signals from local behavior store
      const signals = extractSignals();

      // If a context query is provided, boost its keywords
      if (contextQuery) {
        const terms = contextQuery.toLowerCase().split(/\s+/).filter(Boolean);
        signals.keywords = [...new Set([...terms, ...signals.keywords])].slice(0, 12);
        // Extract color from query
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
      {/* Centered Section Header matching other sections */}
      <div className="flex justify-center">
        <h2 className="font-sansation font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center px-4">
          {displayTitle}
        </h2>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {products.slice(0, limit).map((product, idx) => (
          <Link
            key={product._id}
            href={`/products/${product._id}`}
            className="group flex flex-col cursor-pointer bg-white"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* Product Image Box */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] p-2 flex items-center justify-center shadow-2xs group-hover:border-slate-300 transition-colors">
              {/* Star Rating Badge */}
              <div className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-semibold text-slate-700 z-10 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded-full shadow-2xs">
                <Star className="w-2.5 h-2.5 text-[#C19968] fill-[#C19968]" />
                <span>{(product.rating || 5).toFixed(1)}</span>
              </div>

              {/* Product Image */}
              <Image
                src={product.images?.[0]?.url || '/products/product1.webp'}
                alt={product.images?.[0]?.alt || product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Info Container */}
            <div className="mt-1.5 bg-[#f4f2ee] rounded-xl px-2.5 py-2 flex flex-col gap-0.5 border border-[#e8e2d8] group-hover:border-slate-300 transition-colors">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-sansation truncate">
                {product.brand || 'Gravoz'} · {product.targetAudience || 'Footwear'}
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
