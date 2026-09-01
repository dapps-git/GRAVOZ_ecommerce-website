'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import RecommendationStrip from '@/components/RecommendationStrip';
import RecentlyViewedStrip from '@/components/RecentlyViewedStrip';
import DynamicProductSection from '@/components/DynamicProductSection';
import { ArrowRight, ChevronLeft, ChevronRight, Star, Eye, Truck, ShieldCheck, Leaf, Globe } from 'lucide-react';

// ─── Skeleton shimmer components ─────────────────────────────────────────────

function SkeletonProductCard() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#ede9e2]">
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-10 h-5 rounded-full bg-[#ddd8cf]" />
      </div>
      <div className="mt-1.5 sm:mt-2 bg-[#ede9e2] rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-3 flex flex-col gap-1.5 border border-[#e3ddd5]">
        <div className="h-2 w-12 rounded bg-[#ddd8cf]" />
        <div className="h-3 w-3/4 rounded bg-[#ddd8cf]" />
        <div className="flex gap-2 mt-0.5">
          <div className="h-3 w-12 rounded bg-[#c9c3bc]" />
          <div className="h-3 w-8 rounded bg-[#ddd8cf]" />
        </div>
      </div>
    </div>
  );
}

function SkeletonBannerHero() {
  return (
    <div className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[1816/866] -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 overflow-hidden bg-[#ede9e2] animate-pulse rounded-none" />
  );
}

function SkeletonCategoryCard() {
  return (
    <div className="flex flex-col rounded-xl sm:rounded-2xl overflow-hidden border border-[#e8e2d8] bg-[#ede9e2] animate-pulse">
      <div className="aspect-[3/4] sm:aspect-[4/5] w-full bg-[#ddd8cf]" />
      <div className="px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between bg-[#ede9e2]">
        <div className="h-3 w-12 rounded bg-[#c9c3bc]" />
        <div className="h-3 w-3 rounded bg-[#c9c3bc]" />
      </div>
    </div>
  );
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface CategoryCardData {
  key: string;
  title: string;
  href: string;
  imageUrl: string;
}

interface ProductItem {
  id: string;
  brand: string;
  title: string;
  price: number;
  originalPrice: number;
  rating: number;
  imageUrl: string;
  href: string;
}

// ─── Static fallback data ─────────────────────────────────────────────────────

const DEFAULT_PRODUCTS: ProductItem[] = [
  { id: 'p1', brand: 'Gravoz', title: "Men's Casual Comfort Sandals – WGP50020 Black", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product1.webp', href: '/products/p1' },
  { id: 'p2', brand: 'Gravoz', title: "Men's Casual Comfort Sandals – WGP50020 Tan",   price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product2.webp', href: '/products/p2' },
  { id: 'p3', brand: 'Gravoz', title: "Men's Casual Comfort Sandals – WGP50020 Brown",  price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product3.webp', href: '/products/p3' },
  { id: 'p4', brand: 'Gravoz', title: "Men's Casual Comfort Sandals – WGP50020 Olive",  price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product4.webp', href: '/products/p4' },
];

const DEFAULT_CATEGORIES: CategoryCardData[] = [
  { key: 'women', title: 'Women', href: '/category/women', imageUrl: '/images/women.webp' },
  { key: 'men',   title: 'Men',   href: '/category/men',   imageUrl: '/images/men.webp'   },
  { key: 'kids',  title: 'Kids',  href: '/category/kids',  imageUrl: '/images/kid.webp'   },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function StorefrontHomePage() {
  const [banners, setBanners] = useState<Record<string, any>>({});
  const [bannerImageUrl, setBannerImageUrl] = useState<string>('/images/banner.webp');
  const [bannerLoading, setBannerLoading] = useState<boolean>(true);

  const [categoryCards, setCategoryCards] = useState<CategoryCardData[]>(DEFAULT_CATEGORIES);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);

  // ── Fetch banners + categories + products in parallel on mount ──────────────
  useEffect(() => {
    // 1. Banners API
    fetch('/api/banners', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data?.banners) {
          setBanners(data.banners);
          if (data.banners.hero?.imageUrl) {
            setBannerImageUrl(data.banners.hero.imageUrl);
          }
          // Dynamic category card images
          setCategoryCards([
            { key: 'women', title: data.banners.category_women?.title || 'Women', href: data.banners.category_women?.linkUrl || '/category/women', imageUrl: data.banners.category_women?.imageUrl || '/images/women.webp' },
            { key: 'men',   title: data.banners.category_men?.title || 'Men',   href: data.banners.category_men?.linkUrl || '/category/men',   imageUrl: data.banners.category_men?.imageUrl || '/images/men.webp' },
            { key: 'kids',  title: data.banners.category_kids?.title || 'Kids',  href: data.banners.category_kids?.linkUrl || '/category/kids',  imageUrl: data.banners.category_kids?.imageUrl || '/images/kid.webp' },
          ]);
        }
      })
      .catch(() => {/* keep default */})
      .finally(() => {
        setBannerLoading(false);
        setCategoriesLoading(false);
      });

    // 3. Products API (suggested for you — first 4)
    fetch('/api/products?limit=4&section=suggested', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.products) && data.products.length > 0) {
          const mapped: ProductItem[] = data.products.map((p: any, idx: number) => ({
            id:            p._id || `p${idx + 1}`,
            brand:         p.brand || 'Gravoz',
            title:         p.name  || p.title || "Men's Casual Comfort Sandals",
            price:         p.discountPrice || p.price || 1399,
            originalPrice: p.price || p.originalPrice || 1429,
            rating:        p.rating ?? 5.0,
            imageUrl:      p.images?.[0]?.url || p.images?.[0] || `/products/product${(idx % 4) + 1}.webp`,
            href:          `/products/${p.slug || p._id || idx + 1}`,
          }));
          setProducts(mapped);
        }
      })
      .catch(() => {/* keep default */})
      .finally(() => setProductsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#030303] font-sans flex flex-col justify-between">
      {/* 1. Official Top Navigation Header Bar */}
      <Header />

      {/* 2. Main Body Content (Overall Pure White Background & Wide Container) */}
      <main className="flex-1 max-w-[1530px] w-full mx-auto px-4 sm:px-8 md:px-20 lg:px-28 pt-0 pb-6 md:pb-10 space-y-6 sm:space-y-10 bg-white">
        
        {/* A. Top Hero Banner Card */}
        {bannerLoading ? (
          <SkeletonBannerHero />
        ) : (
        <section className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[1816/866] -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
          <Image
            src={bannerImageUrl}
            alt="GRAVOZ Step Better. Feel the Comfort. Quality Sandals for Every Family Moment."
            fill
            priority
            sizes="100vw"
            className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
          />

          {/* Subtle Carousel Arrow Controls */}
          <button
            type="button"
            aria-label="Previous Slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/60 backdrop-blur-xs text-slate-700 hover:bg-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Next Slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/60 backdrop-blur-xs text-slate-700 hover:bg-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>
        )}

        {/* B. 3 Category Cards Section (Women, Men, Kids in 1 row on mobile & desktop) */}
        <section className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
          {categoriesLoading
            ? [0, 1, 2].map((i) => <SkeletonCategoryCard key={i} />)
            : categoryCards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className="group flex flex-col rounded-xl sm:rounded-2xl overflow-hidden border border-[#e8e2d8] shadow-2xs hover:shadow-md transition-all bg-[#f4f2ee]"
            >
              <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full bg-[#f4f2ee] overflow-hidden">
                <Image
                  src={card.imageUrl}
                  alt={`${card.title} Footwear Collection`}
                  fill
                  sizes="(max-width: 768px) 33vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="bg-[#f4f2ee] px-2.5 sm:px-4 md:px-5 py-2 sm:py-3.5 flex items-center justify-between border-t border-[#e8e2d8]">
                <span className="text-[11px] sm:text-sm md:text-base font-semibold text-[#030303] truncate">
                  {card.title}
                </span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#030303] group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </Link>
          ))}
        </section>

        {/* C. "Suggested for You" Products Section */}
        <section className="space-y-4 pt-2">
          {/* Header Row: Centered title, arrows pinned right on desktop only */}
          <div className="relative flex items-center justify-center">
            <h2 className="font-sansation font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center px-4">
              Suggested for You
            </h2>
            {/* Circular Carousel Controls (< >) — pinned right (Desktop only to prevent mobile overlap) */}
            <div className="hidden sm:flex absolute right-0 items-center gap-2">
              <button
                type="button"
                aria-label="Previous Product"
                className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-[#faf4ec] hover:border-[#89591C] hover:text-[#89591C] transition-all cursor-pointer bg-white shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Next Product"
                className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-[#faf4ec] hover:border-[#89591C] hover:text-[#89591C] transition-all cursor-pointer bg-white shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Cards Grid (2 in 1 row on mobile, 4 on desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {productsLoading
              ? [0, 1, 2, 3].map((i) => <SkeletonProductCard key={i} />)
              : products.map((product) => (
              <Link
                key={product.id}
                href={product.href || `/products/${product.id}`}
                className="group flex flex-col cursor-pointer"
              >
                
                {/* Floating Product Image (Boxless & Borderless) */}
                <div className="relative aspect-square w-full flex items-center justify-center p-1 sm:p-2 overflow-hidden bg-transparent">
                  
                  {/* Star Rating Badge (Top Right) with #C19968 Star Color */}
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 z-10 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded-full shadow-2xs">
                    <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C19968] fill-[#C19968]" />
                    <span>{product.rating.toFixed(1)}</span>
                  </div>

                  {/* Product Shoe Image */}
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Bottom Info Pill Box with Sansation Typography */}
                <div className="mt-1.5 sm:mt-2 bg-[#f4f2ee] rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between border border-[#e8e2d8] shadow-2xs gap-1 sm:gap-3 group-hover:border-slate-400 transition-colors">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="font-sansation font-normal text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.03em] block">
                      {product.brand}
                    </span>
                    <h3 className="font-sansation font-normal text-[11px] sm:text-[13px] leading-[1.31] tracking-[0.03em] text-[#030303] truncate">
                      {product.title}
                    </h3>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-1 flex-shrink-0">
                    <span className="font-sansation text-xs sm:text-sm font-bold text-[#89591C]">
                      ₹{product.price}
                    </span>
                    <span className="font-sansation text-[9px] sm:text-[10px] text-slate-400 line-through">
                      ₹{product.originalPrice}
                    </span>
                  </div>
                </div>

              </Link>
            ))}
          </div>
        </section>

        {/* Recently Viewed Products Strip */}
        <RecentlyViewedStrip limit={4} />

        {/* D. Promotional Secondary Banner Section (banner1.webp) */}
        <section className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[2001/786] -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
          <Image
            src={banners.secondary?.imageUrl || '/images/banner1.webp'}
            alt="GRAVOZ Luxury Leather Shoes Banner"
            fill
            sizes="100vw"
            className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
          />
        </section>

        {/* E. "Category" Products Section (product5–8) */}
        <section className="space-y-4 pt-2">
          {/* Header Row — centered title only */}
          <div className="flex justify-center">
            <h2 className="font-sansation font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center px-4">
              Category
            </h2>
          </div>

          {/* Category Product Cards Grid with absolute edge buttons */}
          <div className="relative">
            {/* Left Edge Button */}
            <button
              type="button"
              aria-label="Previous Category Product"
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-[#030303] text-white items-center justify-center shadow-md hover:bg-[#89591C] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Cards Grid (2 in 1 row on mobile) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[
                { id: 'c1', label: 'Casual Shoe',    imageUrl: '/products/product5.webp' },
                { id: 'c2', label: 'Casual Sandal',  imageUrl: '/products/product6.webp' },
                { id: 'c3', label: 'Leather Shoe',   imageUrl: '/products/product7.webp' },
                { id: 'c4', label: 'Leather Sandal', imageUrl: '/products/product.8.png' },
              ].map((cat) => (
                <div key={cat.id} className="group flex flex-col items-center cursor-pointer">
                  {/* Product Image */}
                  <div className="relative w-full aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8]">
                    <Image
                      src={cat.imageUrl}
                      alt={cat.label}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {/* Label */}
                  <p className="mt-2 font-sansation font-normal text-[11px] sm:text-[13px] leading-[1.31] tracking-[0.03em] text-[#030303] text-center">
                    {cat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Right Edge Button */}
            <button
              type="button"
              aria-label="Next Category Product"
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-[#030303] text-white items-center justify-center shadow-md hover:bg-[#89591C] transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* F. Promotional Banner (banner3.webp — Comfort Sandal) */}
        <section className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[3076/1208] -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
          <Image
            src="/images/banner3.webp"
            alt="GRAVOZ Comfort Sandal Banner"
            fill
            sizes="100vw"
            className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
          />
        </section>

        {/* G. Best Seller Section — large featured left + 2×2 grid right */}
        <section className="space-y-4 pt-2">
          {/* Header Row: Centered title, arrows pinned right */}
          <div className="relative flex items-center justify-center">
            <h2 className="font-sansation font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center px-4">
              Best Seller
            </h2>
            {/* Nav arrows — pinned right (Desktop only) */}
            <div className="hidden sm:flex absolute right-0 items-center gap-2">
              <button
                type="button"
                aria-label="Previous Best Seller"
                className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-[#faf4ec] hover:border-[#89591C] hover:text-[#89591C] transition-all cursor-pointer bg-white shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Next Best Seller"
                className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-[#faf4ec] hover:border-[#89591C] hover:text-[#89591C] transition-all cursor-pointer bg-white shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Layout: Large featured left + 2×2 right grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 md:gap-6 items-start">

            {/* Left — Large Featured Product Card */}
            <Link href="/products/p1" className="group flex flex-col cursor-pointer h-full">
              <div className="relative w-full h-full min-h-[280px] sm:min-h-[340px] lg:min-h-[480px] rounded-xl sm:rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8]">
                <Image
                  src="/products/product9.webp"
                  alt="Men's Casual Comfort Sandals – WGP50020"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              {/* Info pill */}
              <div className="mt-2 bg-[#f4f2ee] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between border border-[#e8e2d8] gap-3 group-hover:border-slate-400 transition-colors">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="font-sansation font-normal text-[10px] text-slate-500 uppercase tracking-[0.03em] block">Gravoz</span>
                  <h3 className="font-sansation font-normal text-[12px] sm:text-[13px] leading-[1.31] tracking-[0.03em] text-[#030303]">
                    Men&apos;s Casual Comfort Sandals – WGP50020 Black
                  </h3>
                </div>
                <div className="flex items-baseline gap-1 flex-shrink-0">
                  <span className="font-sansation text-xs sm:text-sm font-bold text-[#89591C]">₹1399</span>
                  <span className="font-sansation text-[10px] text-slate-400 line-through">₹1429</span>
                </div>
              </div>
            </Link>

            {/* Right — 2×2 Grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              {[
                { id: 'p1', imageUrl: '/products/product10.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black" },
                { id: 'p2', imageUrl: '/products/product11.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black" },
                { id: 'p3', imageUrl: '/products/product12.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black" },
                { id: 'p4', imageUrl: '/products/product13.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              ].map((item) => (
                <Link key={item.id} href={`/products/${item.id}`} className="group flex flex-col cursor-pointer">
                  {/* Image with star badge */}
                  <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8]">
                    {/* Star Badge */}
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 z-10 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded-full shadow-2xs">
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C19968] fill-[#C19968]" />
                      <span>5.0</span>
                    </div>
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {/* Info pill */}
                  <div className="mt-1.5 sm:mt-2 bg-[#f4f2ee] rounded-xl sm:rounded-2xl px-2.5 sm:px-3 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between border border-[#e8e2d8] gap-1 sm:gap-2 group-hover:border-slate-400 transition-colors">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="font-sansation font-normal text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.03em] block">Gravoz</span>
                      <h3 className="font-sansation font-normal text-[11px] sm:text-[12px] leading-[1.31] tracking-[0.03em] text-[#030303] line-clamp-1 sm:line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex items-baseline gap-1 flex-shrink-0">
                      <span className="font-sansation text-xs font-bold text-[#89591C]">₹1399</span>
                      <span className="font-sansation text-[9px] sm:text-[10px] text-slate-400 line-through">₹1429</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </section>

        {/* H. Product Showcase — 2 products side by side */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

          {/* Product 1 — Men's (p1=main, p2=tall right, p3=thumbnail overlay) */}
          <div className="grid grid-cols-2 gap-3 items-start">

            {/* Left col: main image with overlapping thumbnail + info + button */}
            <div className="flex flex-col gap-2">
              {/* Main image with p3 thumbnail overlapping bottom-left */}
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] aspect-[3/4]">
                <Image
                  src="/products/p1.webp"
                  alt="Men's Casual Comfort Sandals – main"
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
                {/* Thumbnail floating at bottom-left */}
                <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-[38%] aspect-square rounded-lg sm:rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
                  <Image
                    src="/products/p3.webp"
                    alt="Men's Casual Comfort Sandals – thumbnail"
                    fill
                    sizes="10vw"
                    className="object-cover"
                  />
                </div>
              </div>
              {/* Product Info */}
              <div className="space-y-0.5 pt-1">
                <p className="font-sansation font-normal text-[13px] sm:text-[14px] leading-[1.31] tracking-[0.03em] text-[#030303]">
                  Men&apos;s Casual Comfort Sandals
                </p>
                <p className="font-sansation font-bold text-[13px] sm:text-[14px] text-[#89591C]">₹1399</p>
              </div>
              {/* Add to Cart */}
              <button
                type="button"
                className="w-full bg-[#030303] text-white font-sansation font-normal text-[12px] sm:text-[13px] tracking-[0.03em] py-2.5 sm:py-3 rounded-xl hover:bg-[#89591C] transition-colors duration-300 cursor-pointer"
              >
                Add to Cart
              </button>
            </div>

            {/* Right col: tall portrait image only */}
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] h-full min-h-[300px] sm:min-h-[420px]">
              <Image
                src="/products/p2.webp"
                alt="Men's Casual Comfort Sandals – lifestyle"
                fill
                sizes="25vw"
                className="object-cover object-top"
              />
            </div>

          </div>

          {/* Product 2 — Women's (p4=main, p5=tall right, p6=thumbnail overlay) */}
          <div className="grid grid-cols-2 gap-3 items-start">

            {/* Left col: main image with overlapping thumbnail + info + button */}
            <div className="flex flex-col gap-2">
              {/* Main image with p6 thumbnail overlapping bottom-left */}
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] aspect-[3/4]">
                <Image
                  src="/products/p4.webp"
                  alt="Women's Casual Comfort Sandals – main"
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
                {/* Thumbnail floating at bottom-left */}
                <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-[38%] aspect-square rounded-lg sm:rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
                  <Image
                    src="/products/p6.webp"
                    alt="Women's Casual Comfort Sandals – thumbnail"
                    fill
                    sizes="10vw"
                    className="object-cover"
                  />
                </div>
              </div>
              {/* Product Info */}
              <div className="space-y-0.5 pt-1">
                <p className="font-sansation font-normal text-[13px] sm:text-[14px] leading-[1.31] tracking-[0.03em] text-[#030303]">
                  Women&apos;s Casual Comfort Sandals
                </p>
                <p className="font-sansation font-bold text-[13px] sm:text-[14px] text-[#89591C]">₹1399</p>
              </div>
              {/* Add to Cart */}
              <button
                type="button"
                className="w-full bg-[#030303] text-white font-sansation font-normal text-[12px] sm:text-[13px] tracking-[0.03em] py-2.5 sm:py-3 rounded-xl hover:bg-[#89591C] transition-colors duration-300 cursor-pointer"
              >
                Add to Cart
              </button>
            </div>

            {/* Right col: tall portrait image only */}
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] h-full min-h-[300px] sm:min-h-[420px]">
              <Image
                src="/products/p5.webp"
                alt="Women's Casual Comfort Sandals – lifestyle"
                fill
                sizes="25vw"
                className="object-cover object-top"
              />
            </div>

          </div>

        </section>

        {/* I. Promotional Banner (banner4.webp) */}
        <section className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[3200/1034] -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
          <Image
            src={banners.promo_strip?.imageUrl || '/images/banner4.webp'}
            alt="GRAVOZ Promotional Banner"
            fill
            sizes="100vw"
            className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
          />
        </section>

        {/* J. New Arrivals Row — product14 to product17 (4 floating cards, 2 in 1 row on mobile) */}
        <section className="space-y-4 pt-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[
              { id: 'n1', imageUrl: '/products/product14.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black", featured: false },
              { id: 'n2', imageUrl: '/products/product15.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black", featured: true  },
              { id: 'n3', imageUrl: '/products/product16.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black", featured: false },
              { id: 'n4', imageUrl: '/products/product17.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black", featured: false },
            ].map((item) => (
              <div key={item.id} className="group flex flex-col cursor-pointer">

                {/* Floating Product Image */}
                <div className="relative aspect-square w-full overflow-hidden bg-transparent">
                  {/* Star badge — top right (not on featured card) */}
                  {!item.featured && (
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 z-10">
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C19968] fill-[#C19968]" />
                      <span>5.0</span>
                    </div>
                  )}

                  {/* Eye icon badge — only on featured card */}
                  {item.featured && (
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-[#e8e2d8] flex items-center justify-center shadow-sm">
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#030303]" />
                    </div>
                  )}

                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* "Choose Option" hover overlay — only on featured card */}
                  {item.featured && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-2 sm:pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="bg-white text-[#030303] font-sansation font-normal text-[10px] sm:text-[12px] tracking-[0.03em] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow border border-[#e8e2d8]">
                        Choose Option
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Pill */}
                <div className="mt-1.5 sm:mt-2 bg-[#f4f2ee] rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between border border-[#e8e2d8] shadow-2xs gap-1 sm:gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="font-sansation font-normal text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.03em] block">Gravoz</span>
                    <h3 className="font-sansation font-normal text-[11px] sm:text-[13px] leading-[1.31] tracking-[0.03em] text-[#030303] truncate">
                      {item.title}
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-1 flex-shrink-0">
                    <span className="font-sansation text-xs sm:text-sm font-bold text-[#89591C]">₹1399</span>
                    <span className="font-sansation text-[9px] sm:text-[10px] text-slate-400 line-through">₹1429</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* K. Latest Products — Dynamic from Admin */}
        <DynamicProductSection
          heading="Latest Products"
          filter="isLatest"
          limit={4}
        />

        {/* L. Top Selling — Infinite Logo Marquee Strip */}
        <section className="pt-2">
          {/* Marquee container */}
          <div className="w-full overflow-hidden border-y border-[#e8e2d8] py-3 sm:py-5 bg-white -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 px-4 sm:px-8 md:px-20 lg:px-28">
            {/* The track is doubled (logo set × 2) so the loop is seamless */}
            <div className="flex items-center animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-16 px-8">
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/icons/logo1.webp" alt="Brand Logo 1" fill className="object-contain" sizes="112px" />
                  </div>
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/icons/logo.webp" alt="Brand Logo" fill className="object-contain" sizes="112px" />
                  </div>
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/icons/logo2.webp" alt="Brand Logo 2" fill className="object-contain" sizes="112px" />
                  </div>
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/icons/logo1.webp" alt="Brand Logo 1" fill className="object-contain" sizes="112px" />
                  </div>
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/icons/logo.webp" alt="Brand Logo" fill className="object-contain" sizes="112px" />
                  </div>
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/icons/logo2.webp" alt="Brand Logo 2" fill className="object-contain" sizes="112px" />
                  </div>
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/icons/logo1.webp" alt="Brand Logo 1" fill className="object-contain" sizes="112px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* M. Top Selling — Dynamic from Admin (2 per row on laptop) */}
        <DynamicProductSection
          heading="Top Selling"
          filter="isTopSeller"
          limit={6}
          layout="list"
        />

        {/* N. Featured Products — Dynamic from Admin */}
        <DynamicProductSection
          heading="Featured Products"
          filter="isFeatured"
          limit={8}
        />

        {/* O. Promotional Banner (banner5.webp — below Daily Collection) */}
        <section className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[3172/1230] -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
          <Image
            src={banners.daily_collection?.imageUrl || '/images/banner5.webp'}
            alt="GRAVOZ Daily Collection Banner"
            fill
            sizes="100vw"
            className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
          />
        </section>

        {/* Dynamic Behavioral Recommendation Strip (You May Also Like) */}
        <section className="pt-4">
          <RecommendationStrip limit={6} />
        </section>

        {/* Best Sellers — Dynamic from Admin */}
        <DynamicProductSection
          heading="Best Sellers"
          filter="isBestSeller"
          limit={8}
        />

        {/* P. Testimonials Section ("What Our Client Says") */}
        <section className="space-y-6 pt-6 pb-2">
          {/* Header Title & Subtitle */}
          <div className="text-center space-y-1.5">
            <h2 className="font-sansation font-bold text-2xl sm:text-3xl md:text-4xl text-[#030303] tracking-tight">
              What Our Client Says
            </h2>
            <p className="font-sansation font-normal text-xs sm:text-sm text-slate-600 tracking-[0.1em]">
              Testimonial
            </p>
          </div>

          {/* 2 Testimonial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto">
            
            {/* Card 1 — Hashim */}
            <div className="bg-white border border-[#e8e2d8] rounded-2xl p-6 sm:p-7 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  {/* Avatar Illustration */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-red-500 p-0.5 flex-shrink-0 flex items-center justify-center shadow-xs">
                    <div className="w-full h-full rounded-full bg-[#fceddc] flex items-center justify-center text-lg">
                      🧑‍💼
                    </div>
                  </div>
                  <div>
                    <h4 className="font-sansation font-bold text-sm sm:text-base text-[#030303]">
                      Hashim
                    </h4>
                    <span className="font-sansation text-[11px] text-slate-400 block font-normal">
                      Verified User
                    </span>
                  </div>
                </div>
                {/* 5 Gold Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-[#C19968] fill-[#C19968]" />
                  ))}
                </div>
              </div>
              <p className="font-sansation text-xs sm:text-[13px] leading-relaxed text-slate-700">
                “The quality is exceptional, and the shoes feel incredibly comfortable from the first wear. The craftsmanship and finish are truly impressive.”
              </p>
            </div>

            {/* Card 2 — lakshmi */}
            <div className="bg-white border border-[#e8e2d8] rounded-2xl p-6 sm:p-7 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  {/* Avatar Illustration */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-300 to-yellow-500 p-0.5 flex-shrink-0 flex items-center justify-center shadow-xs">
                    <div className="w-full h-full rounded-full bg-[#fef7ee] flex items-center justify-center text-lg">
                      👩‍💼
                    </div>
                  </div>
                  <div>
                    <h4 className="font-sansation font-bold text-sm sm:text-base text-[#030303]">
                      lakshmi
                    </h4>
                    <span className="font-sansation text-[11px] text-slate-400 block font-normal">
                      Verified User
                    </span>
                  </div>
                </div>
                {/* 5 Gold Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-[#C19968] fill-[#C19968]" />
                  ))}
                </div>
              </div>
              <p className="font-sansation text-xs sm:text-[13px] leading-relaxed text-slate-700">
                “Gravoz has the perfect balance of premium style and comfort. The leather feels luxurious, and the fit is excellent.”
              </p>
            </div>

          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <span className="w-6 h-2 rounded-full bg-slate-500"></span>
            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
          </div>
        </section>

      </main>

      {/* 3. Rich Premium Footer Section */}
      <footer className="w-full bg-white mt-10">
        
        {/* Black Feature Highlights Strip with 4 White Cards (2 in 1 row on mobile, 4 on desktop) */}
        <div className="w-full bg-[#030303] py-6 sm:py-10 px-3 sm:px-8 md:px-20 lg:px-28">
          <div className="max-w-[1530px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            
            {/* Feature 1: Delivery & Shipping */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 flex flex-col justify-between shadow-sm min-h-[125px] sm:min-h-[145px]">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#f4f2ee] border border-[#e8e2d8] flex items-center justify-center text-[#030303] mb-2 sm:mb-3 flex-shrink-0">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
              </div>
              <div>
                <h4 className="font-sansation font-bold text-xs sm:text-[14px] text-[#030303] leading-snug">
                  Delivery & Shipping
                </h4>
                <p className="font-sansation text-[10px] sm:text-[11px] text-slate-600 mt-0.5 sm:mt-1 leading-relaxed">
                  Your shoes will be dispatched within 1-2 business days
                </p>
              </div>
            </div>

            {/* Feature 2: Warranty Included */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 flex flex-col justify-between shadow-sm min-h-[125px] sm:min-h-[145px]">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#f4f2ee] border border-[#e8e2d8] flex items-center justify-center text-[#030303] mb-2 sm:mb-3 flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
              </div>
              <div>
                <h4 className="font-sansation font-bold text-xs sm:text-[14px] text-[#030303] leading-snug">
                  Warranty Included
                </h4>
                <p className="font-sansation text-[10px] sm:text-[11px] text-slate-600 mt-0.5 sm:mt-1 leading-relaxed">
                  Every pair comes with a hassle free 6 month warranty
                </p>
              </div>
            </div>

            {/* Feature 3: Eco-Friendly Fabric */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 flex flex-col justify-between shadow-sm min-h-[125px] sm:min-h-[145px]">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#f4f2ee] border border-[#e8e2d8] flex items-center justify-center text-[#030303] mb-2 sm:mb-3 flex-shrink-0">
                <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
              </div>
              <div>
                <h4 className="font-sansation font-bold text-xs sm:text-[14px] text-[#030303] leading-snug">
                  Eco-Friendly Fabric
                </h4>
                <p className="font-sansation text-[10px] sm:text-[11px] text-slate-600 mt-0.5 sm:mt-1 leading-relaxed">
                  Crafted with sustainability shoes feature echo-friendly fabric
                </p>
              </div>
            </div>

            {/* Feature 4: Sustainable Materials */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 flex flex-col justify-between shadow-sm min-h-[125px] sm:min-h-[145px]">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#f4f2ee] border border-[#e8e2d8] flex items-center justify-center text-[#030303] mb-2 sm:mb-3 flex-shrink-0">
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
              </div>
              <div>
                <h4 className="font-sansation font-bold text-xs sm:text-[14px] text-[#030303] leading-snug">
                  Sustainable Materials
                </h4>
                <p className="font-sansation text-[10px] sm:text-[11px] text-slate-600 mt-0.5 sm:mt-1 leading-relaxed">
                  Where premium comfort meets conscious materials.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Main Footer Links & Branding */}
        <div className="max-w-[1530px] mx-auto px-4 sm:px-8 md:px-20 lg:px-28 pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.2fr_1fr] gap-8 sm:gap-10">
            
            {/* Brand column */}
            <div className="space-y-4 max-w-sm">
              <div className="flex items-center gap-2">
                <span className="font-sansation font-black text-2xl sm:text-3xl tracking-[0.08em] text-[#030303] uppercase">
                  GRAVOZ
                </span>
              </div>
              <p className="font-sansation text-xs leading-relaxed text-slate-600">
                Premium leather footwear crafted with timeless style, exceptional comfort, and attention to every detail. Made for those who appreciate quality that lasts, from everyday essentials to refined classics. Step into quality. Step into Gravoz.
              </p>
            </div>

            {/* SHOP Column */}
            <div className="space-y-3">
              <h5 className="font-sansation font-bold text-xs uppercase tracking-wider text-[#030303]">
                SHOP
              </h5>
              <ul className="space-y-2.5 font-sansation text-xs text-slate-600">
                <li><Link href="/category/men" className="hover:text-[#89591C] transition-colors">Men Shoes</Link></li>
                <li><Link href="/category/women" className="hover:text-[#89591C] transition-colors">Women Shoes</Link></li>
                <li><Link href="/category/unisex" className="hover:text-[#89591C] transition-colors">Unisex</Link></li>
              </ul>
            </div>

            {/* POLICIES Column */}
            <div className="space-y-3">
              <h5 className="font-sansation font-bold text-xs uppercase tracking-wider text-[#030303]">
                POLICIES
              </h5>
              <ul className="space-y-2.5 font-sansation text-xs text-slate-600">
                <li><Link href="/terms" className="hover:text-[#89591C] transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-[#89591C] transition-colors">Privacy policy</Link></li>
                <li><Link href="/refund" className="hover:text-[#89591C] transition-colors">Return & Refund</Link></li>
                <li><Link href="/shipping" className="hover:text-[#89591C] transition-colors">Shipping & Delivery</Link></li>
                <li><Link href="/faq" className="hover:text-[#89591C] transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* FOLLOW US Column */}
            <div className="space-y-3">
              <h5 className="font-sansation font-bold text-xs uppercase tracking-wider text-[#030303]">
                FOLLOW US
              </h5>
              <div className="flex items-center gap-3">
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-lg bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                {/* WhatsApp */}
                <a
                  href="https://whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Payment Methods */}
          <div className="border-t border-[#e8e2d8] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-sansation text-xs text-slate-500">
            <p>© 2026 Gravoz. All Rights Reserved.</p>
            
            {/* Payment Icons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#003087] text-white font-bold text-[10px] px-2 py-0.5 rounded tracking-wider flex items-center gap-0.5">
                <span className="italic font-serif">PayPal</span>
              </span>
              <span className="bg-[#002663] text-white font-bold text-[10px] px-2 py-0.5 rounded tracking-wider">
                AMEX
              </span>
              <span className="bg-[#1A1F71] text-white font-bold text-[10px] px-2 py-0.5 rounded tracking-wider">
                VISA
              </span>
              <span className="bg-[#030303] text-white font-bold text-[10px] px-2 py-0.5 rounded tracking-wider flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] -mr-1 z-10 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block"></span>
                <span className="ml-1 text-[9px]">mastercard</span>
              </span>
              <span className="bg-[#FF6000] text-white font-bold text-[10px] px-2 py-0.5 rounded tracking-wider">
                DISCOVER
              </span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
