'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ShoppingBag,
} from 'lucide-react';
import { trackEvent } from '@/lib/userBehavior';

interface SearchProduct {
  _id: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  subCategory?: string;
  targetAudience?: string;
  images: { url: string; alt: string }[];
}

const TRENDING_SEARCHES = [
  'Black Sandals',
  'Brown Leather',
  'Women Sandals',
  'Comfort Shoes',
  'Formal Shoes',
];

const QUICK_CATEGORIES = [
  { label: "Men's Shoes", href: '/category/men', emoji: '👟', color: 'from-slate-100 to-slate-50' },
  { label: "Women's Shoes", href: '/category/women', emoji: '👠', color: 'from-rose-50 to-pink-50' },
  { label: 'Sandals', href: '/products?q=sandals', emoji: '🩴', color: 'from-amber-50 to-yellow-50' },
  { label: 'Leather Shoes', href: '/products?q=leather', emoji: '👞', color: 'from-orange-50 to-amber-50' },
];

export default function SearchBar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gravoz_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
    } catch { /* ignore */ }
  }, []);

  const saveRecentSearch = (q: string) => {
    try {
      const updated = [q, ...recentSearches.filter((r) => r !== q)].slice(0, 5);
      localStorage.setItem('gravoz_recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch { /* ignore */ }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setResults(data.products || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length >= 2) {
      setIsLoading(true);
      debounceRef.current = setTimeout(() => runSearch(val), 280);
    } else {
      setResults([]);
      setIsLoading(false);
    }
  };

  const handleSubmit = (q?: string) => {
    const finalQ = (q || query).trim();
    if (!finalQ) return;
    saveRecentSearch(finalQ);
    // Track search for recommendation engine
    trackEvent({ type: 'search', query: finalQ });
    setIsOpen(false);
    setQuery('');
    setResults([]);
    router.push(`/products?q=${encodeURIComponent(finalQ)}`);
  };

  const handleProductClick = (product: SearchProduct) => {
    saveRecentSearch(query || product.name);
    setIsOpen(false);
    setQuery('');
    setResults([]);
    router.push(`/products/${product._id}`);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try { localStorage.removeItem('gravoz_recent_searches'); } catch { /* ignore */ }
  };

  const hasQuery = query.trim().length >= 2;
  const hasResults = results.length > 0;

  return (
    <div ref={containerRef} className="relative">
      {/* ── Search Trigger Button ── */}
      <button
        type="button"
        onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 60); }}
        aria-label="Search products"
        className="p-1 text-[#030303] hover:text-[#89591C] transition-colors"
      >
        <Search className="w-[18px] h-[18px]" strokeWidth={2} />
      </button>

      {/* ── Backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[3px] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Search Panel ── */}
      {isOpen && (
        <div className="fixed top-0 left-0 right-0 z-[51] bg-white/95 backdrop-blur-xl border-b border-[#e8e2d8] shadow-2xl">

          {/* Search Input Row */}
          <div className="max-w-[780px] mx-auto px-4 pt-4 pb-3 flex items-center gap-2.5">
            
            {/* Input Wrapper */}
            <div className="relative flex-1 flex items-center">
              {/* Search Icon */}
              <Search
                className="absolute left-3.5 w-4 h-4 text-[#89591C] flex-shrink-0 pointer-events-none"
                strokeWidth={2.5}
              />

              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder="Search shoes, sandals, colours…"
                autoComplete="off"
                spellCheck={false}
                autoFocus
                className="w-full pl-10 pr-9 py-2.5 text-[13px] bg-[#f8f6f2] border border-[#e0dbd2] rounded-xl focus:outline-none focus:border-[#89591C] focus:ring-2 focus:ring-[#89591C]/15 text-[#030303] placeholder:text-slate-400 font-sansation transition-all"
              />

              {/* Clear Query Button */}
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                  className="absolute right-2.5 w-5 h-5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Search Submit */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="h-[42px] px-5 rounded-xl bg-[#030303] hover:bg-[#89591C] text-white text-[13px] font-semibold tracking-wide transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" strokeWidth={2.5} />
              Search
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close search"
              className="w-9 h-9 rounded-xl border border-[#e8e2d8] hover:bg-[#faf8f5] text-slate-500 hover:text-[#030303] flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* ── Dropdown Results Panel ── */}
          <div className="max-w-[780px] mx-auto px-4 pb-5 max-h-[72vh] overflow-y-auto scrollbar-thin">

            {/* Loading spinner */}
            {isLoading && (
              <div className="flex items-center gap-2.5 py-4 text-[13px] text-slate-500">
                <div className="w-4 h-4 border-2 border-[#89591C]/30 border-t-[#89591C] rounded-full animate-spin" />
                Searching for <span className="font-medium text-[#030303]">"{query}"</span>…
              </div>
            )}

            {/* ── Live Product Results ── */}
            {!isLoading && hasQuery && hasResults && (
              <div>
                {/* Results Header */}
                <div className="flex items-center justify-between py-2 mb-1">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-3 h-3" />
                    {results.length} product{results.length !== 1 ? 's' : ''} found
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    className="text-[11px] text-[#89591C] font-semibold flex items-center gap-0.5 hover:underline"
                  >
                    View all results <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Product Result Rows */}
                <div className="space-y-1">
                  {results.map((product, idx) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => handleProductClick(product)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#faf8f5] transition-colors text-left group"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Product Thumbnail — cached by Next.js Image with 1yr TTL */}
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] flex-shrink-0 shadow-2xs">
                        <Image
                          src={product.images?.[0]?.url || '/products/product1.webp'}
                          alt={product.images?.[0]?.alt || product.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                          // Next.js Image auto-caches via minimumCacheTTL in next.config.js
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#030303] truncate group-hover:text-[#89591C] transition-colors leading-snug">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="px-1.5 py-px bg-[#f0ece5] rounded text-[9px] uppercase tracking-wide font-semibold text-slate-500">
                            {product.subCategory}
                          </span>
                          <span>·</span>
                          <span>{product.targetAudience}</span>
                        </p>
                      </div>

                      {/* Price */}
                      <div className="flex-shrink-0 text-right space-y-0.5">
                        <p className="text-[13px] font-bold text-[#89591C] leading-none">₹{product.price}</p>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <p className="text-[10px] text-slate-400 line-through leading-none">₹{product.originalPrice}</p>
                        )}
                      </div>

                      {/* Arrow */}
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#89591C] flex-shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>

                {/* View all CTA */}
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="mt-3 w-full py-2.5 rounded-xl border border-[#e8e2d8] hover:border-[#89591C] hover:bg-[#faf8f5] text-[12px] font-medium text-[#030303] hover:text-[#89591C] transition-all flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  See all results for "{query}"
                </button>
              </div>
            )}

            {/* ── No Results ── */}
            {!isLoading && hasQuery && !hasResults && (
              <div className="py-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#f4f2ee] flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-[#030303]">No results for "{query}"</p>
                <p className="text-xs text-slate-500 font-sansation">Try "black sandals", "brown shoes", "women sandals"</p>
              </div>
            )}

            {/* ── Default State: Recents + Trending + Categories ── */}
            {!hasQuery && (
              <div className="space-y-5 pt-1 pb-2">

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" strokeWidth={2} />
                        Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={clearRecentSearches}
                        className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors font-medium"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSubmit(s)}
                          className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full border border-[#e8e2d8] bg-[#faf8f5] text-[12px] text-[#030303] hover:border-[#89591C] hover:text-[#89591C] transition-colors font-sansation group"
                        >
                          <Clock className="w-3 h-3 text-slate-400 group-hover:text-[#89591C] transition-colors" strokeWidth={2} />
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <TrendingUp className="w-3 h-3 text-[#89591C]" strokeWidth={2.5} />
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
                      Trending Now
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSubmit(s)}
                        className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full border border-[#e8e2d8] bg-white text-[12px] text-[#030303] hover:bg-[#89591C] hover:text-white hover:border-[#89591C] transition-all font-sansation shadow-2xs group"
                      >
                        <Sparkles
                          className={`w-3 h-3 flex-shrink-0 transition-colors ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-orange-400' : 'text-[#89591C]'} group-hover:text-white`}
                          strokeWidth={2}
                        />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-[#e8e2d8] to-transparent" />

                {/* Browse Categories */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <ShoppingBag className="w-3 h-3 text-[#89591C]" strokeWidth={2.5} />
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
                      Browse Categories
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {QUICK_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br ${cat.color} border border-[#e8e2d8] hover:border-[#89591C] hover:shadow-xs text-[12px] font-medium text-[#030303] transition-all group`}
                      >
                        <span className="text-xl leading-none">{cat.emoji}</span>
                        <span className="group-hover:text-[#89591C] transition-colors truncate">{cat.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
