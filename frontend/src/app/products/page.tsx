'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
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
  noReturnRefundExchange?: boolean;
}

interface CategoryOption {
  _id: string;
  key?: string;
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

function ListingProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
}: {
  product: ProductItem;
  isWishlisted: boolean;
  onToggleWishlist: (e: React.MouseEvent) => void;
}) {
  const images = (product.images && product.images.length > 0)
    ? product.images.map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean) as string[]
    : ['/products/placeholder.svg'];

  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  const salePrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
  const regPrice = product.price;
  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;

  return (
    <Link
      href={`/products/${product.slug || product._id}`}
      className="group bg-white rounded-none border border-[#e8e2d8] p-3 sm:p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#89591C]/40 transition-all duration-300 cursor-pointer"
    >
      {/* Product Image Card - aspect-square gives bigger size, rounded-none */}
      <div className="relative aspect-square w-full rounded-none overflow-hidden bg-[#faf8f5]">
        {/* Wishlist Button */}
        <button
          type="button"
          aria-label="Add to Wishlist"
          onClick={onToggleWishlist}
          className="absolute top-2.5 right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-xs border border-white/80 shadow-xs flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
              isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-600 hover:text-rose-500'
            }`}
          />
        </button>

        {/* Badges: All lightweight font, beige bg with brown text, top most left */}
        {product.stock !== undefined && product.stock <= 0 ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB]">
              OUT OF STOCK
            </span>
          </div>
        ) : product.noReturnRefundExchange ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB]">
              FINAL SALE
            </span>
          </div>
        ) : product.stock !== undefined && product.stock > 0 && product.stock <= 3 ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB]">
              {product.stock === 1 ? '1 LEFT' : `${product.stock} LEFT`}
            </span>
          </div>
        ) : product.isBestSeller ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB]">
              BEST SELLER
            </span>
          </div>
        ) : null}

        {/* Sub-images layer with 3-second animated transition */}
        {images.map((imgUrl, idx) => (
          <div
            key={`${imgUrl}-${idx}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIdx ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <Image
              src={imgUrl}
              alt={`${product.name || 'Footwear'} - photo ${idx + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
                product.stock !== undefined && product.stock <= 0 ? 'grayscale-[20%] opacity-85' : ''
              }`}
            />
          </div>
        ))}
      </div>

      {/* Product Info - Lightweight Typography */}
      <div className="mt-2.5 space-y-1">
        <h3 className="text-xs sm:text-[13px] font-normal text-[#111111] uppercase tracking-wide truncate group-hover:text-[#89591C] transition-colors leading-tight">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5 pt-0.5 font-normal">
          <span className="text-xs sm:text-sm font-medium text-[#89591C]">
            ₹{salePrice}
          </span>
          {hasDiscount && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-light">
              ₹{regPrice}
            </span>
          )}
        </div>

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
      </div>
    </Link>
  );
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
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [brandOpen, setBrandOpen] = useState(true);
  const [sizeOpen, setSizeOpen] = useState(true);
  const [colorOpen, setColorOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  // Filter Drawer Toggle (Right-side slide-over modal)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

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

  // Helper to resolve category ID or slug to human-friendly name
  const resolveCategoryName = useCallback((cat: string) => {
    if (!cat) return '';
    const clean = cat.trim();
    const matched = dbCategories.find(
      (c) =>
        c._id === clean ||
        (c.key && c.key.toLowerCase() === clean.toLowerCase()) ||
        (c.name && c.name.toLowerCase() === clean.toLowerCase()) ||
        (c.title && c.title.toLowerCase() === clean.toLowerCase()) ||
        (c.slug && c.slug.toLowerCase() === clean.toLowerCase())
    );
    if (matched) return matched.name || matched.title || clean;
    if (/^[0-9a-fA-F]{24}$/.test(clean)) {
      return '';
    }
    return clean;
  }, [dbCategories]);

  const displayCategory = useMemo(() => resolveCategoryName(selectedCategory), [selectedCategory, resolveCategoryName]);

  // Extract REAL categories from actual products and DB
  const realCategories = useMemo(() => {
    const map = new Map<string, number>();

    // 1. Seed with DB Categories
    dbCategories.forEach((c) => {
      const cName = (c?.name || c?.title || '').trim();
      if (cName && !/^[0-9a-fA-F]{24}$/.test(cName)) {
        map.set(cName, 0);
      }
    });

    // 2. Count from Products
    products.forEach((p) => {
      let catName = '';
      if (typeof p.category === 'object' && p.category !== null && p.category.name) {
        catName = p.category.name;
      } else if (typeof p.category === 'string' && p.category.trim()) {
        catName = resolveCategoryName(p.category) || p.subCategory || '';
      } else if (p.subCategory) {
        catName = p.subCategory;
      }

      if (catName && typeof catName === 'string' && !/^[0-9a-fA-F]{24}$/.test(catName)) {
        const clean = catName.trim();
        map.set(clean, (map.get(clean) || 0) + 1);
      }
    });

    return Array.from(map.entries())
      .filter(([name]) => Boolean(name && typeof name === 'string' && name.trim() && !/^[0-9a-fA-F]{24}$/.test(name)))
      .map(([name, count]) => ({ name, count }));
  }, [products, dbCategories, resolveCategoryName]);

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

  const pageTitle = (displayCategory || selectedCategory)
    ? (displayCategory || selectedCategory).toUpperCase()
    : selectedAudience
      ? `${selectedAudience.toUpperCase()}'S FOOTWEAR`
      : qParam
        ? `SEARCH: ${qParam.toUpperCase()}`
        : 'ALL FOOTWEAR';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#030303] font-sans flex flex-col justify-between" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      <Header />

      <main className="flex-1 w-full max-w-[1530px] mx-auto px-4 sm:px-6 md:px-8 pt-1 pb-14 space-y-2 font-sansation">

        {/* ── Breadcrumb Navigation ── */}
        <nav className="flex items-center gap-1 text-[11px] text-slate-400 font-normal py-0.5 overflow-x-auto">
          <Link href="/" className="hover:text-[#89591C] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
          <Link href="/products" className="hover:text-[#89591C] transition-colors truncate">
            {selectedAudience ? `${selectedAudience}'s Footwear` : 'Footwear'}
          </Link>
          {(displayCategory || selectedCategory) && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
              <span className="text-[#89591C] font-medium truncate">{displayCategory || selectedCategory}</span>
            </>
          )}
        </nav>

        {/* ── Compact Header & Filter Bar (Single Sleek Row) ── */}
        <div className="flex items-center justify-between gap-2 border-b border-[#ece7de] pb-2 pt-0.5">
          {/* Title */}
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-[#111111] uppercase truncate">
              {pageTitle}
            </h1>
          </div>

          {/* Compact Filter Button & Sort Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Filter Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className="py-1 px-2.5 sm:px-3 bg-white border border-[#e8e2d8] rounded-none text-[11px] font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs hover:border-[#89591C] hover:text-[#89591C] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3 text-slate-600" />
              <span className="tracking-wide">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-[#89591C] text-white text-[8px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort By Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-[#e8e2d8] rounded-none pl-2.5 pr-6 py-1 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-[#89591C] shadow-2xs cursor-pointer"
              >
                <option value="popularity">Sort: Popularity</option>
                <option value="newest">Sort: Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Active Filter Pills (Quick Dismiss) ── */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
            {(displayCategory || selectedCategory) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB] font-normal">
                <span>Category: {displayCategory || selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className="hover:text-black cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBrands.map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB] font-normal">
                <span>Brand: {b}</span>
                <button
                  type="button"
                  onClick={() => toggleBrand(b)}
                  className="hover:text-black cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedSizes.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB] font-normal">
                <span>Size: {s}</span>
                <button
                  type="button"
                  onClick={() => toggleSize(s)}
                  className="hover:text-black cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedColors.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB] font-normal">
                <span>Color: {c}</span>
                <button
                  type="button"
                  onClick={() => toggleColor(c)}
                  className="hover:text-black cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {priceRange < 5000 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#F5EFE6] text-[#68421A] border border-[#E6DBCB] font-normal">
                <span>Max: ₹{priceRange}</span>
                <button
                  type="button"
                  onClick={() => setPriceRange(5000)}
                  className="hover:text-black cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs text-[#89591C] hover:underline font-medium ml-1 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* ── Products Grid (Full-Width, 4 per row on desktop) ── */}
        <section className="w-full min-w-0 pt-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-[#f4f2ee] rounded-none animate-pulse border border-[#e8e2d8]"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-[#faf8f5] rounded-none border border-[#e8e2d8] p-8">
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
                className="px-4 py-2 bg-[#89591C] text-white text-xs font-medium rounded-none shadow-xs hover:bg-[#724816] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 pb-20 lg:pb-8">
              {filteredProducts.map((product) => (
                <ListingProductCard
                  key={product._id}
                  product={product}
                  isWishlisted={Boolean(wishlist[product._id])}
                  onToggleWishlist={(e) => toggleWishlist(product._id, e)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── RIGHT-SIDE SLIDE-OVER FILTER MODAL DRAWER ── */}
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
              onClick={() => setIsFilterDrawerOpen(false)}
            />

            {/* Right-Side Drawer Panel */}
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
              {/* Drawer Header with Title and Close '✕' */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e2d8] bg-white">
                <h2 className="text-sm sm:text-base font-bold text-[#111111] uppercase tracking-wider">
                  FILTER BY
                </h2>
                <button
                  type="button"
                  aria-label="Close Filter"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-black hover:bg-slate-100 rounded-none transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Filters Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* 1. CATEGORIES */}
                {realCategories.length > 0 && (
                  <div className="border-b border-[#ece7de] pb-5">
                    <button
                      type="button"
                      onClick={() => setCategoriesOpen(!categoriesOpen)}
                      className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#111111] py-1 cursor-pointer"
                    >
                      <span>CATEGORIES</span>
                      {categoriesOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>

                    {categoriesOpen && (
                      <div className="space-y-2.5 pt-3">
                        {realCategories.map((c) => {
                          const isSelected =
                            (displayCategory || selectedCategory || '').trim().toLowerCase() === (c.name || '').trim().toLowerCase();
                          return (
                            <label
                              key={c.name}
                              className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-[#89591C]"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleCategorySelect(c.name)}
                                className="w-4 h-4 rounded-none text-[#89591C] focus:ring-0 border-slate-300 accent-[#89591C]"
                              />
                              <span className={isSelected ? 'font-medium text-[#89591C]' : 'font-normal'}>
                                {c.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. BRAND */}
                {realBrands.length > 0 && (
                  <div className="border-b border-[#ece7de] pb-5">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#111111] py-1">
                      <button
                        type="button"
                        onClick={() => setBrandOpen(!brandOpen)}
                        className="flex-1 flex items-center justify-between text-left cursor-pointer"
                      >
                        <span>BRAND</span>
                        {brandOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </button>
                      {selectedBrands.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedBrands([])}
                          className="text-xs text-rose-500 hover:text-rose-600 font-medium ml-3 flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Clear
                        </button>
                      )}
                    </div>

                    {brandOpen && (
                      <div className="space-y-2.5 pt-3">
                        {realBrands.map((b) => {
                          const isChecked = selectedBrands.includes(b.name);
                          return (
                            <label
                              key={b.name}
                              className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-[#89591C]"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleBrand(b.name)}
                                className="w-4 h-4 rounded-none text-[#89591C] focus:ring-0 border-slate-300 accent-[#89591C]"
                              />
                              <span className={isChecked ? 'font-medium text-[#89591C]' : 'font-normal'}>
                                {b.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SIZE (2-column checkbox grid matching screenshot) */}
                <div className="border-b border-[#ece7de] pb-5">
                  <button
                    type="button"
                    onClick={() => setSizeOpen(!sizeOpen)}
                    className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#111111] py-1 cursor-pointer"
                  >
                    <span>SIZE</span>
                    {sizeOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>

                  {sizeOpen && (
                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-3">
                      {realSizes.map((s) => {
                        const isChecked = selectedSizes.includes(s.size);
                        return (
                          <label
                            key={s.size}
                            className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-[#89591C]"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSize(s.size)}
                              className="w-4 h-4 rounded-none text-[#89591C] focus:ring-0 border-slate-300 accent-[#89591C]"
                            />
                            <span className={isChecked ? 'font-medium text-[#89591C]' : 'font-normal'}>
                              {s.size}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. COLOR (Circular swatches matching screenshot) */}
                <div className="border-b border-[#ece7de] pb-5">
                  <button
                    type="button"
                    onClick={() => setColorOpen(!colorOpen)}
                    className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#111111] py-1 cursor-pointer"
                  >
                    <span>COLOR</span>
                    {colorOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>

                  {colorOpen && (
                    <div className="flex flex-wrap items-center gap-3 pt-3">
                      {realColors.map((col) => {
                        const isChecked = selectedColors.includes(col.name);
                        return (
                          <button
                            key={col.name}
                            type="button"
                            title={col.name}
                            onClick={() => toggleColor(col.name)}
                            className={`w-7 h-7 rounded-full p-0.5 transition-all flex items-center justify-center cursor-pointer ${
                              isChecked
                                ? 'ring-2 ring-[#89591C] ring-offset-2 scale-110'
                                : 'hover:scale-105 opacity-90 hover:opacity-100'
                            }`}
                          >
                            <span
                              className="w-full h-full rounded-full border border-black/15 shadow-xs"
                              style={{ backgroundColor: col.hex }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. PRICE RANGE (Min, Max & Slider matching screenshot) */}
                <div className="pb-2">
                  <button
                    type="button"
                    onClick={() => setPriceOpen(!priceOpen)}
                    className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#111111] py-1 cursor-pointer"
                  >
                    <span>PRICE RANGE</span>
                    {priceOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>

                  {priceOpen && (
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-normal">
                        <span>₹500</span>
                        <span className="font-medium text-[#89591C]">₹{priceRange}</span>
                        <span>₹5000</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="5000"
                        step="100"
                        value={priceRange}
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="w-full accent-[#89591C] cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Sticky Action Buttons */}
              <div className="flex items-center gap-3 px-6 py-4 border-t border-[#e8e2d8] bg-white">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-slate-800 hover:text-[#89591C] transition-colors cursor-pointer border border-[#e8e2d8] bg-white text-center"
                >
                  CLEAR ALL
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 py-3 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold uppercase tracking-wider shadow-xs transition-colors cursor-pointer text-center"
                >
                  APPLY FILTERS
                </button>
              </div>
            </div>
          </div>
        )}
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
