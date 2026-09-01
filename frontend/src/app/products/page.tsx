'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RecommendationStrip from '@/components/RecommendationStrip';
import { trackEvent } from '@/lib/userBehavior';
import { Search, Star, Filter, ChevronDown, X, RefreshCw } from 'lucide-react';

interface SearchProduct {
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

const FILTER_OPTIONS = {
  audience: ['Men', 'Women', 'Kids', 'Unisex'],
  category: ['Casual Sandal', 'Leather Shoe', 'Formal Shoe', 'Sneaker', 'Loafer'],
  price: [
    { label: 'Under ₹999', min: 0, max: 999 },
    { label: '₹999 – ₹1499', min: 999, max: 1499 },
    { label: '₹1499 – ₹1999', min: 1499, max: 1999 },
    { label: 'Above ₹1999', min: 1999, max: Infinity },
  ],
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || searchParams.get('search') || '';

  const [query, setQuery] = useState(q);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    audience: string[];
    category: string[];
    priceIdx: number | null;
  }>({ audience: [], category: [], priceIdx: null });

  const fetchResults = useCallback(async (searchQ: string) => {
    setIsLoading(true);
    if (searchQ.trim()) {
      trackEvent({ type: 'search', query: searchQ.trim() });
    }
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQ.trim())}&limit=50`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    } flexFinally();
  }, []);

  const flexFinally = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    setQuery(q);
    fetchResults(q);
  }, [q, fetchResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/products?q=${encodeURIComponent(query.trim())}`);
  };

  const handleClearQuery = () => {
    setQuery('');
    router.push('/products');
  };

  // Client-side filter applied to fetched products
  const filteredProducts = products.filter((p) => {
    if (
      activeFilters.audience.length > 0 &&
      !activeFilters.audience.some((a) => p.targetAudience?.toLowerCase().includes(a.toLowerCase()))
    ) {
      return false;
    }
    if (
      activeFilters.category.length > 0 &&
      !activeFilters.category.some((c) => p.subCategory?.toLowerCase().includes(c.toLowerCase()))
    ) {
      return false;
    }
    if (activeFilters.priceIdx !== null) {
      const range = FILTER_OPTIONS.price[activeFilters.priceIdx];
      if (p.price < range.min || p.price > range.max) return false;
    }
    return true;
  });

  const toggleAudience = (val: string) =>
    setActiveFilters((f) => ({
      ...f,
      audience: f.audience.includes(val) ? f.audience.filter((a) => a !== val) : [...f.audience, val],
    }));

  const toggleCategory = (val: string) =>
    setActiveFilters((f) => ({
      ...f,
      category: f.category.includes(val) ? f.category.filter((c) => c !== val) : [...f.category, val],
    }));

  const clearFilters = () => setActiveFilters({ audience: [], category: [], priceIdx: null });
  const hasFilters = activeFilters.audience.length > 0 || activeFilters.category.length > 0 || activeFilters.priceIdx !== null;

  return (
    <div className="min-h-screen bg-white text-[#030303] font-sans flex flex-col selection:bg-[#89591C]/20 selection:text-[#89591C]">
      <Header />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-6 sm:py-10 space-y-8">

        {/* Page Title & Search Bar */}
        <div className="space-y-4 font-sansation">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e5e5] pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#030303] tracking-tight font-sansation">
                {q ? `Search Results for "${q}"` : 'Footwear Collection'}
              </h1>
              <p className="text-xs text-slate-500 font-sansation mt-0.5">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[#c25e09] hover:underline flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear all filters
              </button>
            )}
          </div>

          {/* Search Input Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#89591C]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Refine your search (e.g., sandals, leather shoes, black)..."
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#faf8f5] border border-[#e8e2d8] rounded-xl focus:outline-none focus:border-[#89591C] focus:ring-1 focus:ring-[#89591C]/30 text-[#030303] font-sansation"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-10 px-6 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium transition-colors font-sansation cursor-pointer shadow-2xs"
            >
              Search
            </button>
          </form>
        </div>

        {/* Active Filter Pills Bar */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 font-sansation">
            <span className="text-xs text-slate-400 font-medium">Active Filters:</span>
            {activeFilters.audience.map((a) => (
              <span
                key={a}
                onClick={() => toggleAudience(a)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#faf8f5] border border-[#e8e2d8] text-[#89591C] cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                {a} <X className="w-3 h-3" />
              </span>
            ))}
            {activeFilters.category.map((c) => (
              <span
                key={c}
                onClick={() => toggleCategory(c)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#faf8f5] border border-[#e8e2d8] text-[#89591C] cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                {c} <X className="w-3 h-3" />
              </span>
            ))}
            {activeFilters.priceIdx !== null && (
              <span
                onClick={() => setActiveFilters((f) => ({ ...f, priceIdx: null }))}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#faf8f5] border border-[#e8e2d8] text-[#89591C] cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                {FILTER_OPTIONS.price[activeFilters.priceIdx].label} <X className="w-3 h-3" />
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">

          {/* ── Filters Sidebar (Desktop) ── */}
          <aside className="hidden md:flex flex-col gap-5 w-56 flex-shrink-0 bg-[#faf9f6] border border-[#eae6e1] rounded-2xl p-5 sticky top-[90px] shadow-2xs font-sansation">
            <div className="flex items-center justify-between border-b border-[#eae6e1] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#030303]">FILTERS</span>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="text-[11px] text-[#c25e09] hover:underline font-medium">
                  Clear all
                </button>
              )}
            </div>

            {/* Audience Filter */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 block">FOR</span>
              {FILTER_OPTIONS.audience.map((a) => (
                <label key={a} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={activeFilters.audience.includes(a)}
                    onChange={() => toggleAudience(a)}
                    className="w-4 h-4 accent-[#c25e09] rounded cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700 group-hover:text-[#c25e09] transition-colors">{a}</span>
                </label>
              ))}
            </div>

            {/* Category Filter */}
            <div className="space-y-2.5 pt-2 border-t border-[#eae6e1]">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 block">CATEGORY</span>
              {FILTER_OPTIONS.category.map((c) => (
                <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={activeFilters.category.includes(c)}
                    onChange={() => toggleCategory(c)}
                    className="w-4 h-4 accent-[#c25e09] rounded cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700 group-hover:text-[#c25e09] transition-colors">{c}</span>
                </label>
              ))}
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2.5 pt-2 border-t border-[#eae6e1]">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 block">PRICE RANGE</span>
              {FILTER_OPTIONS.price.map((range, idx) => (
                <label key={idx} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="priceFilter"
                    checked={activeFilters.priceIdx === idx}
                    onChange={() => setActiveFilters((f) => ({ ...f, priceIdx: f.priceIdx === idx ? null : idx }))}
                    className="w-4 h-4 accent-[#c25e09] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700 group-hover:text-[#c25e09] transition-colors">{range.label}</span>
                </label>
              ))}
            </div>
          </aside>

          {/* ── Product Results Grid ── */}
          <div className="flex-1 min-w-0 w-full space-y-4">

            {/* Mobile Filter Button */}
            <div className="md:hidden flex items-center justify-between">
              <button
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e8e2d8] text-xs font-semibold text-[#030303] bg-[#faf8f5] font-sansation"
              >
                <Filter className="w-3.5 h-3.5 text-[#89591C]" />
                Filter Options
                {hasFilters && <span className="w-2 h-2 rounded-full bg-[#c25e09]" />}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Mobile Filters Dropdown */}
            {filterOpen && (
              <div className="md:hidden p-4 bg-[#faf8f5] border border-[#e8e2d8] rounded-2xl space-y-4 font-sansation">
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">FOR</span>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_OPTIONS.audience.map((a) => (
                      <button key={a} type="button" onClick={() => toggleAudience(a)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${activeFilters.audience.includes(a) ? 'bg-[#c25e09] text-white border-[#c25e09]' : 'bg-white text-[#030303] border-[#e8e2d8]'}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">CATEGORY</span>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_OPTIONS.category.map((c) => (
                      <button key={c} type="button" onClick={() => toggleCategory(c)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${activeFilters.category.includes(c) ? 'bg-[#c25e09] text-white border-[#c25e09]' : 'bg-white text-[#030303] border-[#e8e2d8]'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredProducts.length === 0 && (
              <div className="py-16 text-center space-y-4 border border-[#e5e5e5] rounded-2xl p-8 bg-[#faf9f6] font-sansation">
                <div className="text-4xl">👟</div>
                <h2 className="text-lg font-bold text-[#030303]">No matching products found</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing some filters or searching for terms like &ldquo;sandals&rdquo;, &ldquo;black shoes&rdquo;, or &ldquo;leather&rdquo;.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-5 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Product Grid */}
            {filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {filteredProducts.map((product) => (
                  <Link
                    key={product._id}
                    href={`/products/${product._id}`}
                    className="group flex flex-col cursor-pointer bg-white"
                  >
                    {/* Image Thumbnail Container */}
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] p-2 flex items-center justify-center shadow-2xs group-hover:border-slate-300 transition-colors">
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-semibold text-slate-700 z-10 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded-full shadow-2xs">
                        <Star className="w-2.5 h-2.5 text-[#C19968] fill-[#C19968]" />
                        <span>{(product.rating || 5).toFixed(1)}</span>
                      </div>
                      <Image
                        src={product.images?.[0]?.url || '/products/product1.webp'}
                        alt={product.images?.[0]?.alt || product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Product Metadata Info Pill */}
                    <div className="mt-1.5 bg-[#f4f2ee] rounded-xl px-2.5 py-2 flex flex-col gap-0.5 border border-[#e8e2d8] group-hover:border-slate-300 transition-colors font-sansation">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-sansation truncate">
                        {product.brand || 'Gravoz'} · {product.targetAudience || 'Men'}
                      </span>
                      <h3 className="text-xs font-normal text-[#030303] truncate font-sansation leading-snug">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        <span className="text-xs font-bold text-[#c25e09]">₹{product.price}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-[10px] text-slate-400 line-through">₹{product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ── Personalized Recommendation Strip below search ── */}
        <div className="mt-12 pt-8 border-t border-[#f0ece5]">
          <RecommendationStrip contextQuery={q} limit={6} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-sm text-slate-400">Loading search…</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
