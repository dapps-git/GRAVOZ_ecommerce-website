'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Clock,
  Flame,
  ShoppingBag,
  ArrowUpRight,
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

export default function SearchBar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Black Sandals',
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gravoz_recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentSearches(parsed.slice(0, 6));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveRecentSearch = (q: string) => {
    try {
      const updated = [q, ...recentSearches.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 6);
      localStorage.setItem('gravoz_recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {
      /* ignore */
    }
  };

  const removeRecentSearch = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== itemToRemove);
    try {
      localStorage.setItem('gravoz_recent_searches', JSON.stringify(updated));
    } catch {
      /* ignore */
    }
    setRecentSearches(updated);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('gravoz_recent_searches');
    } catch {
      /* ignore */
    }
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
    if (!q.trim() || q.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }
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

  const hasQuery = query.trim().length >= 2;
  const hasResults = results.length > 0;

  return (
    <div ref={containerRef} className="relative font-poppins">
      {/* ── Search Trigger Button (Header Icon) ── */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 80);
        }}
        aria-label="Search products"
        className="p-1 text-[#171717] hover:text-[#8B4A12] transition-colors cursor-pointer"
      >
        <Search className="w-[19px] h-[19px]" strokeWidth={2} />
      </button>

      {/* ── Modal Backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[3px] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Search Popup Modal (Matching exact reference design) ── */}
      {isOpen && (
        <div className="fixed top-3 sm:top-6 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 z-[51] w-auto sm:w-full max-w-[600px] bg-white rounded-[16px] border border-[#E8E1D9] shadow-2xl overflow-hidden p-4 sm:p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Top Search Input Box (Rounded pill with search icon) */}
          <div className="relative flex items-center w-full h-[48px] px-3.5 rounded-[12px] border border-[#E8E1D9] bg-white focus-within:border-[#8B4A12] focus-within:ring-2 focus-within:ring-[#8B4A12]/15 transition-all">
            <Search className="w-4 h-4 text-[#171717] flex-shrink-0 mr-2.5 stroke-[2.2]" />

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder="Search for shoes, sandals..."
              autoComplete="off"
              spellCheck={false}
              autoFocus
              className="w-full text-[13px] bg-transparent text-[#171717] placeholder:text-[#667085] focus:outline-none"
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#667085] flex items-center justify-center transition-colors cursor-pointer mr-1"
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close search"
              className="text-[#667085] hover:text-[#171717] p-1 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── DEFAULT STATE: Recent Searches + Trending Now (When query is empty) ── */}
          {!hasQuery && (
            <div className="space-y-4 pt-1">
              
              {/* 1. RECENT SEARCHES */}
              {recentSearches.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8B4A12] uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-[#8B4A12] stroke-[2.2]" />
                      <span>RECENT SEARCHES</span>
                    </div>

                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-xs font-semibold text-[#8B4A12] hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Recent Pills */}
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <div
                        key={item}
                        onClick={() => handleSubmit(item)}
                        className="group bg-[#FCF8F3] border border-[#E8E1D9] hover:border-[#8B4A12] text-[#171717] rounded-full px-3.5 py-1.5 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(item, e)}
                          className="text-[#667085] hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3 stroke-[2]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider Line */}
              {recentSearches.length > 0 && (
                <div className="border-b border-[#F0ECE5]" />
              )}

              {/* 2. TRENDING NOW */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8B4A12] uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-[#8B4A12] stroke-[2.2]" />
                  <span>TRENDING NOW</span>
                </div>

                {/* Trending Pills */}
                <div className="flex flex-wrap gap-2">
                  {TRENDING_SEARCHES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSubmit(item)}
                      className="border border-[#E8E1D9] bg-white hover:bg-[#FCF8F3] hover:border-[#8B4A12] text-[#171717] rounded-full px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs group"
                    >
                      <Flame className="w-3.5 h-3.5 text-[#8B4A12] stroke-[2.2] group-hover:scale-110 transition-transform" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ── LIVE SEARCH RESULTS (When user is typing) ── */}
          {hasQuery && (
            <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-[#667085]">
                  <div className="w-4 h-4 border-2 border-[#8B4A12]/30 border-t-[#8B4A12] rounded-full animate-spin" />
                  <span>Searching for &quot;{query}&quot;...</span>
                </div>
              ) : hasResults ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1 text-[11px] text-[#667085] font-medium">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-[#8B4A12]" />
                      {results.length} result{results.length !== 1 ? 's' : ''} found
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSubmit()}
                      className="text-[#8B4A12] font-semibold hover:underline cursor-pointer"
                    >
                      View all results &rarr;
                    </button>
                  </div>

                  {results.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => handleProductClick(product)}
                      className="w-full flex items-center gap-3 p-2 rounded-[10px] hover:bg-[#FCF8F3] transition-colors text-left group cursor-pointer border border-transparent hover:border-[#E8E1D9]"
                    >
                      <div className="relative w-11 h-11 rounded-[8px] overflow-hidden bg-[#FAF8F5] border border-[#E8E1D9] flex-shrink-0">
                        <Image
                          src={product.images?.[0]?.url || '/products/placeholder.svg'}
                          alt={product.images?.[0]?.alt || product.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#171717] truncate group-hover:text-[#8B4A12] transition-colors">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-[#667085] mt-0.5">
                          {product.subCategory || 'Footwear'} • {product.targetAudience || 'All'}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-[#8B4A12]">
                          ₹{product.price}
                        </span>
                      </div>

                      <ArrowUpRight className="w-3.5 h-3.5 text-[#667085] group-hover:text-[#8B4A12] flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-1">
                  <p className="text-sm font-semibold text-[#171717]">No results found for &quot;{query}&quot;</p>
                  <p className="text-xs text-[#667085]">Try searching for &quot;black sandals&quot; or &quot;brown leather&quot;</p>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
