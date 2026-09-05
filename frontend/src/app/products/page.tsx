'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Star,
  Heart,
  ChevronDown,
  ChevronUp,
  Check,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  X,
  Tag,
  FolderTree,
  Package,
} from 'lucide-react';
import { getProductRating } from '@/lib/ratingUtils';

interface ProductItem {
  _id: string;
  name: string;
  slug?: string;
  brand?: string | { name: string };
  price: number;
  discountPrice?: number;
  originalPrice?: number;
  subCategory?: string;
  category?: string | { name: string; slug?: string };
  targetAudience?: string;
  rating?: number;
  reviewsCount?: number;
  images: { url: string; alt?: string }[];
  sizes?: string[];
  colors?: string[];
  colorVariants?: Array<{ name: string; colorCode?: string }>;
  stock?: number;
  isBestSeller?: boolean;
}

interface CategoryOption {
  _id: string;
  name?: string;
  title?: string;
  slug?: string;
  targetAudience?: string;
}

interface BrandOption {
  _id: string;
  name?: string;
  title?: string;
  slug?: string;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL parameters
  const catParam = searchParams.get('category') || searchParams.get('subCategory') || '';
  const audParam = searchParams.get('audience') || searchParams.get('gender') || '';
  const brandParam = searchParams.get('brand') || '';
  const qParam = searchParams.get('q') || searchParams.get('search') || '';

  // Data State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [dbCategories, setDbCategories] = useState<CategoryOption[]>([]);
  const [dbBrands, setDbBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>(catParam);
  const [selectedAudience, setSelectedAudience] = useState<string>(audParam);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(brandParam ? [brandParam] : []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number>(4000);
  const [sortBy, setSortBy] = useState<string>('popularity');

  // Accordion toggles
  const [brandOpen, setBrandOpen] = useState(true);
  const [sizeOpen, setSizeOpen] = useState(true);
  const [colorOpen, setColorOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  // Mobile Drawer Toggle
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Wishlist local state
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  // Sync params from URL
  useEffect(() => {
    if (catParam) setSelectedCategory(catParam);
    if (audParam) setSelectedAudience(audParam);
    if (brandParam) setSelectedBrands([brandParam]);
  }, [catParam, audParam, brandParam]);

  // Fetch DB Categories & Brands
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.categories;
        if (Array.isArray(list)) setDbCategories(list);
      })
      .catch(() => { });

    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.brands;
        if (Array.isArray(list)) setDbBrands(list);
      })
      .catch(() => { });
  }, []);

  // Fetch Products
  useEffect(() => {
    setLoading(true);
    fetch('/api/products?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (data?.products && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleCategorySelect = (catName: string) => {
    const current = (selectedCategory || '').trim().toLowerCase();
    const target = (catName || '').trim().toLowerCase();
    if (current && current === target) {
      setSelectedCategory('');
      router.push('/products');
    } else {
      setSelectedCategory(catName);
      router.push(`/products?category=${encodeURIComponent(catName)}`);
    }
  };

  const toggleBrand = (brandName: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const resetAllFilters = () => {
    setSelectedCategory('');
    setSelectedAudience('');
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange(4000);
    router.push('/products');
  };

  // Extract REAL categories from actual products and DB
  const realCategories = useMemo(() => {
    const map = new Map<string, number>();

    products.forEach((p) => {
      const catName =
        (typeof p.category === 'object' && p.category !== null ? p.category.name : p.category) ||
        p.subCategory ||
        '';
      if (catName && typeof catName === 'string' && catName.trim()) {
        const clean = catName.trim();
        map.set(clean, (map.get(clean) || 0) + 1);
      }
    });

    dbCategories.forEach((c) => {
      const cName = (c?.name || c?.title || '').trim();
      if (cName && !map.has(cName)) {
        map.set(cName, 0);
      }
    });

    return Array.from(map.entries())
      .filter(([name]) => Boolean(name && typeof name === 'string' && name.trim()))
      .map(([name, count]) => ({ name, count }));
  }, [products, dbCategories]);

  // Extract REAL brands from actual products
  const realBrands = useMemo(() => {
    const map = new Map<string, number>();

    products.forEach((p) => {
      const bName =
        (typeof p.brand === 'object' && p.brand !== null ? p.brand.name : p.brand) || 'Gravoz';
      if (bName && typeof bName === 'string' && bName.trim()) {
        const clean = bName.trim();
        map.set(clean, (map.get(clean) || 0) + 1);
      }
    });

    dbBrands.forEach((b) => {
      const bName = (b?.name || b?.title || '').trim();
      if (bName && !map.has(bName)) {
        map.set(bName, 0);
      }
    });

    return Array.from(map.entries())
      .filter(([name]) => Boolean(name && typeof name === 'string' && name.trim()))
      .map(([name, count]) => ({ name, count }));
  }, [products, dbBrands]);

  // Extract REAL sizes and their exact product counts
  const realSizes = useMemo(() => {
    const map = new Map<string, number>();
    ['4', '5', '6', '7', '8', '9', '10', '11'].forEach((s) => map.set(s, 0));

    products.forEach((p) => {
      const sizes = Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['6', '7', '8', '9', '10'];
      sizes.forEach((s) => {
        if (s) {
          map.set(s, (map.get(s) || 0) + 1);
        }
      });
    });

    return Array.from(map.entries())
      .filter(([_, count]) => count > 0 || ['6', '7', '8', '9', '10'].includes(_))
      .map(([size, count]) => ({ size, count }));
  }, [products]);

  // Extract REAL colors and their exact product counts
  const realColors = useMemo(() => {
    const colorHexMap: Record<string, string> = {
      brown: '#633e21',
      black: '#1a1a1a',
      tan: '#c28b57',
      olive: '#556b2f',
      cream: '#f0e6d6',
      beige: '#d4c4b0',
      white: '#ffffff',
      navy: '#1b2a4a',
      red: '#b91c1c',
      gray: '#6b7280',
    };

    const map = new Map<string, { count: number; hex: string }>();

    products.forEach((p) => {
      if (Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
        p.colorVariants.forEach((cv) => {
          if (cv && cv.name) {
            const cleanName = cv.name.trim();
            const hex = cv.colorCode || colorHexMap[cleanName.toLowerCase()] || '#89591C';
            const prev = map.get(cleanName) || { count: 0, hex };
            map.set(cleanName, { count: prev.count + 1, hex });
          }
        });
      } else if (Array.isArray(p.colors) && p.colors.length > 0) {
        p.colors.forEach((c) => {
          if (c && typeof c === 'string') {
            const cleanName = c.trim();
            const hex = colorHexMap[cleanName.toLowerCase()] || '#89591C';
            const prev = map.get(cleanName) || { count: 0, hex };
            map.set(cleanName, { count: prev.count + 1, hex });
          }
        });
      }
    });

    if (map.size === 0) {
      map.set('Brown', { count: products.length, hex: '#633e21' });
      map.set('Black', { count: products.length, hex: '#1a1a1a' });
      map.set('Tan', { count: Math.ceil(products.length * 0.7), hex: '#c28b57' });
      map.set('Beige', { count: Math.ceil(products.length * 0.5), hex: '#d4c4b0' });
    }

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      hex: data.hex,
    }));
  }, [products]);

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory) {
          const target = (selectedCategory || '').toLowerCase().replace(/[-_]/g, ' ');
          const pCat = (
            typeof p.category === 'object' && p.category !== null
              ? p.category.name || ''
              : p.category || ''
          ).toLowerCase();
          const pSub = (p.subCategory || '').toLowerCase();
          const pName = (p.name || '').toLowerCase();
          const matches =
            pCat.includes(target) ||
            pSub.includes(target) ||
            pName.includes(target) ||
            target.includes(pSub) ||
            (target.includes('leather') && (pName.includes('leather') || pSub.includes('leather'))) ||
            (target.includes('sandal') && (pName.includes('sandal') || pSub.includes('sandal'))) ||
            (target.includes('shoe') && (pName.includes('shoe') || pSub.includes('shoe')));
          if (!matches) return false;
        }

        // Brand filter
        if (selectedBrands.length > 0) {
          const pBrand = (
            typeof p.brand === 'object' && p.brand !== null
              ? p.brand.name || ''
              : p.brand || 'gravoz'
          ).toLowerCase();
          const matchesBrand = selectedBrands.some((b) => pBrand.includes((b || '').toLowerCase()));
          if (!matchesBrand) return false;
        }

        // Audience filter
        if (selectedAudience) {
          if (
            p.targetAudience &&
            !p.targetAudience.toLowerCase().includes(selectedAudience.toLowerCase())
          ) {
            return false;
          }
        }

        // Search query
        if (qParam) {
          const q = qParam.toLowerCase();
          const match =
            (p.name || '').toLowerCase().includes(q) ||
            (p.subCategory && p.subCategory.toLowerCase().includes(q));
          if (!match) return false;
        }

        // Size filter
        if (selectedSizes.length > 0) {
          const pSizes = p.sizes || ['6', '7', '8', '9', '10'];
          const hasSize = selectedSizes.some((s) => pSizes.includes(s));
          if (!hasSize) return false;
        }

        // Color filter
        if (selectedColors.length > 0) {
          const pColors = (p.colors || []).map((c) => (c || '').toLowerCase());
          const pName = (p.name || '').toLowerCase();
          const hasColor = selectedColors.some(
            (c) => pColors.includes((c || '').toLowerCase()) || pName.includes((c || '').toLowerCase())
          );
          if (!hasColor) return false;
        }

        // Price range
        const actualPrice = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price;
        if (actualPrice > priceRange) return false;

        return true;
      })
      .sort((a, b) => {
        const priceA = a.discountPrice && a.discountPrice > 0 ? a.discountPrice : a.price;
        const priceB = b.discountPrice && b.discountPrice > 0 ? b.discountPrice : b.price;

        if (sortBy === 'price_low') return priceA - priceB;
        if (sortBy === 'price_high') return priceB - priceA;
        if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
        if (sortBy === 'newest') return b._id > a._id ? 1 : -1;
        return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      });
  }, [
    products,
    selectedCategory,
    selectedBrands,
    selectedAudience,
    qParam,
    selectedSizes,
    selectedColors,
    priceRange,
    sortBy,
  ]);

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedAudience ? 1 : 0) +
    selectedBrands.length +
    selectedSizes.length +
    selectedColors.length +
    (priceRange < 4000 ? 1 : 0);

  const pageTitle = selectedCategory
    ? selectedCategory.toUpperCase()
    : selectedAudience
      ? `${selectedAudience.toUpperCase()}'S FOOTWEAR`
      : qParam
        ? `SEARCH: ${qParam.toUpperCase()}`
        : 'ALL FOOTWEAR';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#030303] font-sans flex flex-col justify-between" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      <Header />

      <main className="flex-1 w-full max-w-[1530px] mx-auto px-4 sm:px-6 md:px-8 pt-2 pb-14 space-y-3 font-sansation">

        {/* ── Breadcrumb Navigation ── */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-normal py-1 overflow-x-auto">
          <Link href="/" className="hover:text-[#89591C] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <Link href="/products" className="hover:text-[#89591C] transition-colors truncate">
            {selectedAudience ? `${selectedAudience}'s Footwear` : 'Discover Footwear'}
          </Link>
          {selectedCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-[#89591C] font-semibold truncate">{selectedCategory}</span>
            </>
          )}
        </nav>

        {/* ── Mobile Title & Product Count (Desktop has heading inside product grid) ── */}
        <div className="lg:hidden pt-1 pb-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#030303]">
            {selectedCategory
              ? `${selectedCategory} Footwear`
              : selectedAudience
                ? `${selectedAudience}'s Footwear`
                : 'All Footwear'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* ── Mobile Filter & Sort Bar ── */}
        <div className="lg:hidden flex items-center justify-between gap-2.5 pt-1 pb-2">
          {/* Filter Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex-1 py-2 px-3 bg-white border border-[#e8e2d8] rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-center gap-2 shadow-2xs hover:border-[#89591C] transition-colors cursor-pointer"
          >
            <span>Filter</span>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#89591C] text-white text-[9px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort By Dropdown */}
          <div className="flex-1 relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none bg-white border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#89591C] shadow-2xs pr-7 cursor-pointer"
            >
              <option value="popularity">Sort by: Popularity</option>
              <option value="newest">Sort by: Newest</option>
              <option value="price_low">Sort by: Price: Low to High</option>
              <option value="price_high">Sort by: Price: High to Low</option>
              <option value="rating">Sort by: Rating</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* ── Mobile Filter Drawer ── */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-6 shadow-2xl border-t border-[#e8e2d8]">
              <div className="flex items-center justify-between border-b border-[#e8e2d8] pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#89591C]" />
                  <h3 className="text-sm font-bold text-slate-900">Filter &amp; Refine</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              {realCategories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {realCategories.map((c) => {
                      const isSelected = (selectedCategory || '').toLowerCase() === (c.name || '').toLowerCase();
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleCategorySelect(c.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${isSelected
                              ? 'bg-[#89591C] text-white border-[#89591C]'
                              : 'bg-[#faf8f5] text-slate-700 border-[#e8e2d8]'
                            }`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Brands */}
              {realBrands.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Brands</h4>
                  <div className="flex flex-wrap gap-2">
                    {realBrands.map((b) => {
                      const isChecked = selectedBrands.includes(b.name);
                      return (
                        <button
                          key={b.name}
                          type="button"
                          onClick={() => toggleBrand(b.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${isChecked
                              ? 'bg-[#89591C] text-white border-[#89591C]'
                              : 'bg-[#faf8f5] text-slate-700 border-[#e8e2d8]'
                            }`}
                        >
                          {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sizes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Available Sizes</h4>
                <div className="flex flex-wrap gap-2">
                  {realSizes.map((s) => (
                    <button
                      key={s.size}
                      type="button"
                      onClick={() => toggleSize(s.size)}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all ${selectedSizes.includes(s.size)
                          ? 'bg-[#89591C] text-white border-[#89591C]'
                          : 'bg-[#faf8f5] text-slate-700 border-[#e8e2d8]'
                        }`}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-[#e8e2d8]">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="flex-1 py-3 rounded-xl border border-[#e8e2d8] text-xs font-bold text-slate-700"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-[#89591C] text-white text-xs font-bold shadow-xs"
                >
                  Show {filteredProducts.length} Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main 2-Column Grid (Desktop Sidebar + Products) ── */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-7 items-start">

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* LEFT SIDEBAR FILTERS (Desktop) - Sleek 220px Compact Width        */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <aside className="hidden lg:block w-48 xl:w-52 shrink-0 space-y-4 sticky top-24 bg-white">

            {/* 1. CATEGORIES */}
            {realCategories.length > 0 && (
              <div className="space-y-2 pb-3.5 border-b border-[#ece7de]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#030303]">
                    Categories
                  </h3>
                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={() => handleCategorySelect(selectedCategory)}
                      className="text-[11px] text-[#89591C] hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="space-y-0.5">
                  {realCategories.map((cat) => {
                    const isSelected =
                      (selectedCategory || '').trim().toLowerCase() === (cat.name || '').trim().toLowerCase();
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => handleCategorySelect(cat.name)}
                        className={`w-full flex items-center justify-between py-0.5 px-0 text-xs text-left transition-all cursor-pointer ${isSelected
                            ? 'font-bold text-[#89591C]'
                            : 'font-normal text-slate-700 hover:text-[#89591C]'
                          }`}
                      >
                        <span className="truncate text-[11.5px] sm:text-xs">{cat.name}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#89591C] flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. FILTER BY SECTIONS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#030303]">
                  Filter By
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {/* BRAND FILTER */}
              {realBrands.length > 0 && (
                <div className="border-b border-[#ece7de] pb-4">
                  <button
                    type="button"
                    onClick={() => setBrandOpen(!brandOpen)}
                    className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 py-1 cursor-pointer"
                  >
                    <span>Brand</span>
                    {brandOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>

                  {brandOpen && (
                    <div className="space-y-2 pt-2.5">
                      {realBrands.map((b) => {
                        const isChecked = selectedBrands.includes(b.name);
                        return (
                          <label
                            key={b.name}
                            className="flex items-center text-xs text-slate-700 cursor-pointer hover:text-[#89591C]"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleBrand(b.name)}
                                className="w-3.5 h-3.5 rounded text-[#89591C] focus:ring-0 border-slate-300"
                              />
                              <span>{b.name}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SIZE FILTER */}
              <div className="border-b border-[#ece7de] pb-4">
                <button
                  type="button"
                  onClick={() => setSizeOpen(!sizeOpen)}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 py-1 cursor-pointer"
                >
                  <span>Size</span>
                  {sizeOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {sizeOpen && (
                  <div className="space-y-2 pt-2.5">
                    {realSizes.map((s) => {
                      const isChecked = selectedSizes.includes(s.size);
                      return (
                        <label
                          key={s.size}
                          className="flex items-center text-xs text-slate-700 cursor-pointer hover:text-[#89591C]"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSize(s.size)}
                              className="w-3.5 h-3.5 rounded text-[#89591C] focus:ring-0 border-slate-300"
                            />
                            <span>{s.size}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* COLOR FILTER */}
              <div className="border-b border-[#ece7de] pb-4">
                <button
                  type="button"
                  onClick={() => setColorOpen(!colorOpen)}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 py-1 cursor-pointer"
                >
                  <span>Color</span>
                  {colorOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {colorOpen && (
                  <div className="space-y-2 pt-2.5">
                    {realColors.map((col) => {
                      const isChecked = selectedColors.includes(col.name);
                      return (
                        <label
                          key={col.name}
                          className="flex items-center text-xs text-slate-700 cursor-pointer hover:text-[#89591C]"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleColor(col.name)}
                              className="w-3.5 h-3.5 rounded text-[#89591C] focus:ring-0 border-slate-300"
                            />
                            <span
                              className="w-3 h-3 rounded-full border border-black/10 inline-block flex-shrink-0"
                              style={{ backgroundColor: col.hex }}
                            />
                            <span>{col.name}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PRICE FILTER */}
              <div className="space-y-3 pb-2">
                <button
                  type="button"
                  onClick={() => setPriceOpen(!priceOpen)}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 py-1 cursor-pointer"
                >
                  <span>Price Range</span>
                  {priceOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {priceOpen && (
                  <div className="space-y-2.5 pt-1">
                    <input
                      type="range"
                      min="499"
                      max="4000"
                      step="100"
                      value={priceRange}
                      onChange={(e) => setPriceRange(Number(e.target.value))}
                      className="w-full accent-[#89591C] cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>₹499</span>
                      <span className="text-[#89591C]">Max: ₹{priceRange}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* RIGHT PRODUCT GRID                                               */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <section className="flex-1 min-w-0 space-y-5">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between gap-3 border-b border-[#ece7de] pb-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#030303] uppercase">
                  {pageTitle}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#89591C] cursor-pointer shadow-2xs"
                >
                  <option value="popularity">Popularity</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] bg-[#f4f2ee] rounded-2xl animate-pulse border border-[#e8e2d8]"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-[#faf8f5] rounded-3xl border border-[#e8e2d8] p-8">
                <div className="w-12 h-12 rounded-full bg-[#f4f2ee] text-slate-400 mx-auto flex items-center justify-center">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Footwear Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing active filters or selecting a different category.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2 bg-[#89591C] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#724816] transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4.5 pb-20 lg:pb-8">
                {filteredProducts.map((product) => {
                  const isWishlisted = Boolean(wishlist[product._id]);
                  const validImg =
                    product.images?.find((img) => img?.url && !img.url.includes('placeholder.svg'))?.url ||
                    (product.images && product.images[0]?.url) ||
                    '/products/placeholder.svg';
                  const salePrice =
                    product.discountPrice && product.discountPrice > 0
                      ? product.discountPrice
                      : product.price;
                  const regPrice = product.price;
                  const hasDiscount =
                    product.discountPrice &&
                    product.discountPrice > 0 &&
                    product.discountPrice < product.price;

                  return (
                    <Link
                      key={product._id}
                      href={`/products/${product.slug || product._id}`}
                      className="group bg-white rounded-2xl border border-[#e8e2d8] p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#89591C]/40 transition-all duration-300 cursor-pointer"
                    >
                      {/* Product Image Card */}
                      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#faf8f5]">
                        {/* Wishlist Button */}
                        <button
                          type="button"
                          aria-label="Add to Wishlist"
                          onClick={(e) => toggleWishlist(product._id, e)}
                          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs border border-white/80 shadow-xs flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-colors ${isWishlisted
                                ? 'fill-rose-500 text-rose-500'
                                : 'text-slate-600 hover:text-rose-500'
                              }`}
                          />
                        </button>

                        {/* Out of Stock / Low Stock / Best Seller Badges */}
                        {product.stock !== undefined && product.stock <= 0 ? (
                          <div className="absolute top-2 left-2 z-10">
                            <span className="px-2 py-0.5 rounded-none text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                              OUT OF STOCK
                            </span>
                          </div>
                        ) : product.stock !== undefined && product.stock > 0 && product.stock <= 3 ? (
                          <div className="absolute top-2 left-2 z-10">
                            <span className="px-2 py-0.5 rounded-none text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-amber-600 text-white shadow-xs">
                              {product.stock === 1 ? '1 LEFT' : `${product.stock} LEFT`}
                            </span>
                          </div>
                        ) : product.isBestSeller ? (
                          <div className="absolute top-2 left-2 z-10">
                            <span className="px-2 py-0.5 rounded-none text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-[#68421A] text-white shadow-xs">
                              BEST SELLER
                            </span>
                          </div>
                        ) : null}

                        {/* Product Photo */}
                        <Image
                          src={validImg}
                          alt={product.name || 'Footwear'}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className={`object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
                            product.stock !== undefined && product.stock <= 0 ? 'grayscale-[20%] opacity-85' : ''
                          }`}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="mt-2 space-y-1">
                        <h3 className="text-[11px] sm:text-xs font-bold text-[#111111] uppercase tracking-wide truncate group-hover:text-[#89591C] transition-colors leading-tight">
                          {product.name}
                        </h3>

                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-[#111111]">
                            ₹{salePrice}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">
                              ₹{regPrice}
                            </span>
                          )}
                        </div>

                        {/* Star Rating */}
                        {(() => {
                          const { rating, reviewsCount } = getProductRating(product);
                          return (
                            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-600">
                              <Star className="w-3.5 h-3.5 text-[#8A5B2A] fill-[#8A5B2A]" strokeWidth={1.5} />
                              <span className="font-bold text-slate-800">{rating.toFixed(1)}</span>
                              <span className="text-slate-400 font-normal">
                                ({reviewsCount})
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-xs font-semibold text-[#89591C]">
          Loading Footwear Collection...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
