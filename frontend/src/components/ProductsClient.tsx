'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from 'lucide-react';
import { getProductRating } from '@/lib/ratingUtils';
import { optimizeCloudinaryUrl, isDirectCdnUrl } from '@/lib/cloudinaryUrl';

export interface ProductItem {
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

export interface CategoryOption {
  _id: string;
  key?: string;
  name?: string;
  title?: string;
  slug?: string;
  targetAudience?: string;
}

export interface BrandOption {
  _id: string;
  name?: string;
  title?: string;
  slug?: string;
}

interface ProductsClientProps {
  initialProducts?: ProductItem[];
  initialCategories?: CategoryOption[];
  initialBrands?: BrandOption[];
  hasServerData?: boolean;
}

const MAX_PRICE_LIMIT = 10000;
const ITEMS_PER_PAGE = 48;

function ListingProductCard({
  product,
  index,
  isWishlisted,
  onToggleWishlist,
}: {
  product: ProductItem;
  index: number;
  isWishlisted: boolean;
  onToggleWishlist: (e: React.MouseEvent) => void;
}) {
  const rawImg =
    product.images && product.images.length > 0
      ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url) || '/products/placeholder.svg'
      : '/products/placeholder.svg';
  const primaryImg = optimizeCloudinaryUrl(rawImg, 500);

  const salePrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
  const regPrice = product.price;
  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;

  return (
    <Link
      href={`/products/${product.slug || product._id}`}
      className="group bg-white rounded-md border border-[#E5E5E5] p-3 sm:p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#F37021]/40 transition-all duration-300 cursor-pointer"
    >
      {/* Product Image Card */}
      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-[#F7F7F7]">
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

        {/* Badges */}
        {product.stock !== undefined && product.stock <= 0 ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-br-md rounded-tl-md text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC]">
              OUT OF STOCK
            </span>
          </div>
        ) : product.noReturnRefundExchange ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-br-md rounded-tl-md text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC]">
              FINAL SALE
            </span>
          </div>
        ) : product.stock !== undefined && product.stock > 0 && product.stock <= 3 ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-br-md rounded-tl-md text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC]">
              {product.stock === 1 ? '1 LEFT' : `${product.stock} LEFT`}
            </span>
          </div>
        ) : product.isBestSeller ? (
          <div className="absolute top-0 left-0 z-20">
            <span className="px-2.5 py-0.5 rounded-br-md rounded-tl-md text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC]">
              BEST SELLER
            </span>
          </div>
        ) : null}

        {/* Primary image optimized via CDN */}
        <Image
          src={primaryImg}
          alt={product.name || 'Footwear'}
          fill
          unoptimized={isDirectCdnUrl(primaryImg)}
          priority={index < 4}
          loading={index < 8 ? 'eager' : 'lazy'}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
            product.stock !== undefined && product.stock <= 0 ? 'grayscale-[20%] opacity-85' : ''
          }`}
        />
      </div>

      {/* Product Info */}
      <div className="mt-2.5 space-y-1">
        <h3 className="text-xs sm:text-[13px] font-normal text-[#111111] uppercase tracking-wide truncate group-hover:text-[#F37021] transition-colors leading-tight">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5 pt-0.5 font-normal">
          <span className="text-xs sm:text-sm font-medium text-[#F37021]">
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
              <Star className="w-3.5 h-3.5 text-[#F37021] fill-[#F37021]" strokeWidth={1.5} />
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

export default function ProductsClient({
  initialProducts = [],
  initialCategories = [],
  initialBrands = [],
  hasServerData = false,
}: ProductsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const catParam = searchParams.get('category') || searchParams.get('subCategory') || '';
  const audParam = searchParams.get('audience') || searchParams.get('gender') || '';
  const brandParam = searchParams.get('brand') || '';
  const qParam = searchParams.get('q') || searchParams.get('search') || '';

  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [dbCategories, setDbCategories] = useState<CategoryOption[]>(initialCategories);
  const [dbBrands, setDbBrands] = useState<BrandOption[]>(initialBrands);
  const [loading, setLoading] = useState(!hasServerData);

  const [selectedCategory, setSelectedCategory] = useState<string>(catParam);
  const [selectedAudience, setSelectedAudience] = useState<string>(audParam);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(brandParam ? [brandParam] : []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number>(MAX_PRICE_LIMIT);
  const [sortBy, setSortBy] = useState<string>('popularity');

  const [currentPage, setCurrentPage] = useState<number>(1);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCategory,
    selectedAudience,
    selectedBrands,
    selectedSizes,
    selectedColors,
    priceRange,
    sortBy,
    qParam,
  ]);

  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [brandOpen, setBrandOpen] = useState(true);
  const [sizeOpen, setSizeOpen] = useState(true);
  const [colorOpen, setColorOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  // Sync URL query params cleanly (including clears back to /products)
  useEffect(() => {
    setSelectedCategory(catParam);
    setSelectedAudience(audParam);
    setSelectedBrands(brandParam ? [brandParam] : []);
  }, [catParam, audParam, brandParam]);

  // Client fallback fetch ONLY if SSR did not pre-populate data
  useEffect(() => {
    if (hasServerData && initialProducts.length > 0) return;

    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.categories;
        if (Array.isArray(list)) setDbCategories(list);
      })
      .catch(() => {});

    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.brands;
        if (Array.isArray(list)) setDbBrands(list);
      })
      .catch(() => {});

    setLoading(true);
    fetch('/api/products?limit=200')
      .then((res) => res.json())
      .then((data) => {
        if (data?.products && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [hasServerData, initialProducts.length]);

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
    setPriceRange(MAX_PRICE_LIMIT);
    setCurrentPage(1);
    router.push('/products');
  };

  const resolveCategoryName = useCallback(
    (cat: string) => {
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
    },
    [dbCategories]
  );

  const displayCategory = useMemo(
    () => resolveCategoryName(selectedCategory),
    [selectedCategory, resolveCategoryName]
  );

  const realCategories = useMemo(() => {
    const map = new Map<string, number>();

    dbCategories.forEach((c) => {
      const cName = (c?.name || c?.title || '').trim();
      if (cName && !/^[0-9a-fA-F]{24}$/.test(cName)) {
        map.set(cName, 0);
      }
    });

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

  const realBrands = useMemo(() => {
    const map = new Map<string, number>();

    products.forEach((p) => {
      const bName =
        (typeof p.brand === 'object' && p.brand !== null ? p.brand.name : p.brand) || 'SERCHER';
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
      .filter(([s, count]) => count > 0 || ['6', '7', '8', '9', '10'].includes(s))
      .map(([size, count]) => ({ size, count }));
  }, [products]);

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
            const hex = cv.colorCode || colorHexMap[cleanName.toLowerCase()] || '#F37021';
            const prev = map.get(cleanName) || { count: 0, hex };
            map.set(cleanName, { count: prev.count + 1, hex });
          }
        });
      } else if (Array.isArray(p.colors) && p.colors.length > 0) {
        p.colors.forEach((c) => {
          if (c && typeof c === 'string') {
            const cleanName = c.trim();
            const hex = colorHexMap[cleanName.toLowerCase()] || '#F37021';
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

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCategory) {
          const target = (selectedCategory || '').toLowerCase().replace(/[-_]/g, ' ').trim();
          // Top-level umbrella category "Footwear" / "All Footwear" encompasses all products
          if (target !== 'footwear' && target !== 'all footwear') {
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
              (pSub && target.includes(pSub)) ||
              (target.includes('leather') && (pName.includes('leather') || pSub.includes('leather'))) ||
              (target.includes('sandal') && (pName.includes('sandal') || pSub.includes('sandal'))) ||
              (target.includes('shoe') && (pName.includes('shoe') || pSub.includes('shoe')));
            if (!matches) return false;
          }
        }

        if (selectedBrands.length > 0) {
          const pBrand = (
            typeof p.brand === 'object' && p.brand !== null
              ? p.brand.name || ''
              : p.brand || 'sercher'
          ).toLowerCase();
          const matchesBrand = selectedBrands.some((b) => pBrand.includes((b || '').toLowerCase()));
          if (!matchesBrand) return false;
        }

        if (selectedAudience) {
          if (
            p.targetAudience &&
            !p.targetAudience.toLowerCase().includes(selectedAudience.toLowerCase())
          ) {
            return false;
          }
        }

        if (qParam) {
          const q = qParam.toLowerCase();
          const match =
            (p.name || '').toLowerCase().includes(q) ||
            (p.subCategory && p.subCategory.toLowerCase().includes(q));
          if (!match) return false;
        }

        if (selectedSizes.length > 0) {
          const pSizes = p.sizes || ['6', '7', '8', '9', '10'];
          const hasSize = selectedSizes.some((s) => pSizes.includes(s));
          if (!hasSize) return false;
        }

        if (selectedColors.length > 0) {
          const pColors = (p.colors || []).map((c) => (c || '').toLowerCase());
          const pName = (p.name || '').toLowerCase();
          const hasColor = selectedColors.some(
            (c) => pColors.includes((c || '').toLowerCase()) || pName.includes((c || '').toLowerCase())
          );
          if (!hasColor) return false;
        }

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

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedAudience ? 1 : 0) +
    selectedBrands.length +
    selectedSizes.length +
    selectedColors.length +
    (priceRange < MAX_PRICE_LIMIT ? 1 : 0);

  const pageTitle = (displayCategory || selectedCategory)
    ? (displayCategory || selectedCategory).toUpperCase()
    : selectedAudience
      ? `${selectedAudience.toUpperCase()}'S FOOTWEAR`
      : qParam
        ? `SEARCH: ${qParam.toUpperCase()}`
        : 'ALL FOOTWEAR';

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#030303] font-sans flex flex-col justify-between" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      <Header />

      <main className="flex-1 w-full max-w-[1530px] mx-auto px-4 sm:px-6 md:px-8 pt-1 pb-14 space-y-2 font-sansation">

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1 text-[11px] text-slate-400 font-normal py-0.5 overflow-x-auto">
          <Link href="/" className="hover:text-[#F37021] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
          <Link href="/products" className="hover:text-[#F37021] transition-colors truncate">
            {selectedAudience ? `${selectedAudience}'s Footwear` : 'Footwear'}
          </Link>
          {(displayCategory || selectedCategory) && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
              <span className="text-[#F37021] font-medium truncate">{displayCategory || selectedCategory}</span>
            </>
          )}
        </nav>

        {/* Compact Header & Filter Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-[#E5E5E5] pb-2 pt-0.5">
          <div className="min-w-0 flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-[#111111] uppercase truncate">
              {pageTitle}
            </h1>
            {!loading && (
              <span className="px-2 py-0.5 rounded-full bg-white border border-[#E5E5E5] text-[10px] font-semibold text-[#F37021] whitespace-nowrap">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className="py-1 px-2.5 sm:px-3 bg-white border border-[#E5E5E5] rounded-md text-[11px] font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs hover:border-[#F37021] hover:text-[#F37021] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3 text-slate-600" />
              <span className="tracking-wide">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-[#F37021] text-white text-[8px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-[#E5E5E5] rounded-md pl-2.5 pr-6 py-1 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-[#F37021] shadow-2xs cursor-pointer"
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

        {/* Active Filter Pills */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
            {(displayCategory || selectedCategory) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC] rounded-md font-normal">
                <span>Category: {displayCategory || selectedCategory}</span>
                <button type="button" onClick={() => setSelectedCategory('')} className="hover:text-black cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBrands.map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC] rounded-md font-normal">
                <span>Brand: {b}</span>
                <button type="button" onClick={() => toggleBrand(b)} className="hover:text-black cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedSizes.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC] rounded-md font-normal">
                <span>Size: {s}</span>
                <button type="button" onClick={() => toggleSize(s)} className="hover:text-black cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedColors.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC] rounded-md font-normal">
                <span>Color: {c}</span>
                <button type="button" onClick={() => toggleColor(c)} className="hover:text-black cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {priceRange < MAX_PRICE_LIMIT && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC] rounded-md font-normal">
                <span>Max: ₹{priceRange}</span>
                <button type="button" onClick={() => setPriceRange(MAX_PRICE_LIMIT)} className="hover:text-black cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs text-[#F37021] hover:underline font-medium ml-1 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Products Grid */}
        <section className="w-full min-w-0 pt-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square bg-[#F3F3F3] rounded-md animate-pulse border border-[#E5E5E5]" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-[#F7F7F7] rounded-md border border-[#E5E5E5] p-8">
              <div className="w-12 h-12 rounded-full bg-[#F3F3F3] text-slate-400 mx-auto flex items-center justify-center">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Footwear Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing active filters or selecting a different category.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-4 py-2 bg-[#F37021] text-white text-xs font-medium rounded-md shadow-xs hover:bg-[#D95B10] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 pb-8">
                {paginatedProducts.map((product, index) => (
                  <ListingProductCard
                    key={product._id}
                    product={product}
                    index={index}
                    isWishlisted={Boolean(wishlist[product._id])}
                    onToggleWishlist={(e) => toggleWishlist(product._id, e)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pt-6 pb-16 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E5E5E5] mt-2">
                  <div className="text-xs text-slate-600 font-medium">
                    Showing <span className="font-semibold text-slate-900">{filteredProducts.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to{' '}
                    <span className="font-semibold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> of{' '}
                    <span className="font-semibold text-[#F37021]">{filteredProducts.length}</span> products
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-semibold text-slate-700 hover:border-[#F37021] hover:text-[#F37021] disabled:opacity-40 disabled:hover:border-[#E5E5E5] disabled:hover:text-slate-700 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .map((pageNum, idx, visiblePages) => {
                        const prevPage = visiblePages[idx - 1];
                        const showEllipsis = prevPage && pageNum - prevPage > 1;

                        return (
                          <React.Fragment key={pageNum}>
                            {showEllipsis && <span className="px-1 text-xs text-slate-400 select-none">...</span>}
                            <button
                              type="button"
                              onClick={() => handlePageChange(pageNum)}
                              className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                                currentPage === pageNum
                                  ? 'bg-[#F37021] text-white shadow-xs'
                                  : 'border border-[#E5E5E5] bg-white text-slate-700 hover:border-[#F37021] hover:text-[#F37021]'
                              }`}
                            >
                              {pageNum}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-semibold text-slate-700 hover:border-[#F37021] hover:text-[#F37021] disabled:opacity-40 disabled:hover:border-[#E5E5E5] disabled:hover:text-slate-700 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Right-Side Slide-Over Filter Modal Drawer */}
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
              onClick={() => setIsFilterDrawerOpen(false)}
            />

            <div className="relative w-full max-w-[340px] sm:max-w-[380px] bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] bg-white">
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

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {realCategories.length > 0 && (
                  <div className="border-b border-[#E5E5E5] pb-5">
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
                            <label key={c.name} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-[#F37021]">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleCategorySelect(c.name)}
                                className="w-4 h-4 rounded-none text-[#F37021] focus:ring-0 border-slate-300 accent-[#F37021]"
                              />
                              <span className={isSelected ? 'font-medium text-[#F37021]' : 'font-normal'}>
                                {c.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {realBrands.length > 0 && (
                  <div className="border-b border-[#E5E5E5] pb-5">
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
                            <label key={b.name} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-[#F37021]">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleBrand(b.name)}
                                className="w-4 h-4 rounded-none text-[#F37021] focus:ring-0 border-slate-300 accent-[#F37021]"
                              />
                              <span className={isChecked ? 'font-medium text-[#F37021]' : 'font-normal'}>
                                {b.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="border-b border-[#E5E5E5] pb-5">
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
                          <label key={s.size} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-[#F37021]">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSize(s.size)}
                              className="w-4 h-4 rounded-none text-[#F37021] focus:ring-0 border-slate-300 accent-[#F37021]"
                            />
                            <span className={isChecked ? 'font-medium text-[#F37021]' : 'font-normal'}>
                              {s.size}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-b border-[#E5E5E5] pb-5">
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
                                ? 'ring-2 ring-[#F37021] ring-offset-2 scale-110'
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
                        <span className="font-medium text-[#F37021]">₹{priceRange}</span>
                        <span>₹{MAX_PRICE_LIMIT}</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max={MAX_PRICE_LIMIT}
                        step="100"
                        value={priceRange}
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="w-full accent-[#F37021] cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 border-t border-[#E5E5E5] bg-white">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-slate-800 hover:text-[#F37021] transition-colors cursor-pointer border border-[#E5E5E5] bg-white text-center"
                >
                  CLEAR ALL
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 py-3 bg-[#F37021] hover:bg-[#D95B10] text-white text-xs font-semibold uppercase tracking-wider shadow-xs transition-colors cursor-pointer text-center"
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

