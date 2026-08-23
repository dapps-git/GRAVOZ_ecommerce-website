'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { ArrowRight, ChevronLeft, ChevronRight, Star, Eye } from 'lucide-react';

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

export default function StorefrontHomePage() {
  // Banner state pointing to static demo banner.webp
  const [bannerImageUrl, setBannerImageUrl] = useState<string>('/images/banner.webp');

  // Dynamic Category Cards state
  const [categoryCards, setCategoryCards] = useState<CategoryCardData[]>([
    { key: 'men', title: 'Men', href: '/category/men', imageUrl: '/images/men.webp' },
    { key: 'women', title: 'Women', href: '/category/women', imageUrl: '/images/women.webp' },
    { key: 'kids', title: 'Kids', href: '/category/kids', imageUrl: '/images/kid.webp' },
  ]);

  // Suggested Products state (Using images from /products folder)
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: 'p1',
      brand: 'Gravoz',
      title: "Men's Casual Comfort Sandals – WGP50020 Black",
      price: 1399,
      originalPrice: 1429,
      rating: 5.0,
      imageUrl: '/products/product1.webp',
      href: '/products/p1',
    },
    {
      id: 'p2',
      brand: 'Gravoz',
      title: "Men's Casual Comfort Sandals – WGP50020 Tan",
      price: 1399,
      originalPrice: 1429,
      rating: 5.0,
      imageUrl: '/products/product2.webp',
      href: '/products/p2',
    },
    {
      id: 'p3',
      brand: 'Gravoz',
      title: "Men's Casual Comfort Sandals – WGP50020 Brown",
      price: 1399,
      originalPrice: 1429,
      rating: 5.0,
      imageUrl: '/products/product3.webp',
      href: '/products/p3',
    },
    {
      id: 'p4',
      brand: 'Gravoz',
      title: "Men's Casual Comfort Sandals – WGP50020 Olive",
      price: 1399,
      originalPrice: 1429,
      rating: 5.0,
      imageUrl: '/products/product4.webp',
      href: '/products/p4',
    },
  ]);

  // Optional backend sync for live API data
  useEffect(() => {
    fetch('/api/products?limit=4')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.products) && data.products.length > 0) {
          const apiProducts: ProductItem[] = data.products.map((p: any, idx: number) => ({
            id: p._id || `p${idx + 1}`,
            brand: p.brand?.name || 'Gravoz',
            title: p.name || `Men's Casual Comfort Sandals – WGP50020`,
            price: p.price || 1399,
            originalPrice: p.compareAtPrice || 1429,
            rating: p.rating || 5.0,
            imageUrl: p.images?.[0] || `/products/product${(idx % 4) + 1}.webp`,
            href: `/products/${p._id || idx + 1}`,
          }));
          setProducts(apiProducts);
        }
      })
      .catch(() => {
        // Silently use static demo products from /products folder
      });
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#030303] font-sans flex flex-col justify-between">
      {/* 1. Official Top Navigation Header Bar */}
      <Header />

      {/* 2. Main Body Content (Overall Pure White Background & Wide Container) */}
      <main className="flex-1 max-w-[1530px] w-full mx-auto px-8 sm:px-12 md:px-20 lg:px-28 py-4 md:py-6 space-y-10 bg-white">
        
        {/* A. Top Hero Banner Card */}
        <section className="relative w-[calc(100%+4rem)] sm:w-[calc(100%+6rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[21/9] sm:aspect-[16/7] md:aspect-[16/6.2] -mx-8 sm:-mx-12 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
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

        {/* B. 3 Category Cards Section (Men, Women, Kids) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {categoryCards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className="group flex flex-col rounded-2xl overflow-hidden border border-[#e8e2d8] shadow-xs hover:shadow-md transition-all bg-[#f4f2ee]"
            >
              <div className="relative aspect-[4/5] w-full bg-[#f4f2ee] overflow-hidden">
                <Image
                  src={card.imageUrl}
                  alt={`${card.title} Footwear Collection`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="bg-[#f4f2ee] px-5 py-3.5 flex items-center justify-between border-t border-[#e8e2d8]">
                <span className="text-base font-semibold text-[#030303]">{card.title}</span>
                <ArrowRight className="w-4 h-4 text-[#030303] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </section>

        {/* C. "Suggested for You" Products Section */}
        <section className="space-y-4 pt-2">
          {/* Header Row: Centered title, arrows pinned right */}
          <div className="relative flex items-center justify-center">
            <h2 className="font-sansation font-light text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center">
              Suggested for You
            </h2>
            {/* Circular Carousel Controls (< >) — pinned right */}
            <div className="absolute right-0 flex items-center gap-2">
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

          {/* Product Cards Grid (Floating images, Sansation font for product details) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {products.map((product) => (
              <div key={product.id} className="group flex flex-col cursor-pointer">
                
                {/* Floating Product Image (Boxless & Borderless) */}
                <div className="relative aspect-square w-full flex items-center justify-center p-2 overflow-hidden bg-transparent">
                  
                  {/* Star Rating Badge (Top Right) with #C19968 Star Color */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-semibold text-slate-700 z-10">
                    <Star className="w-3.5 h-3.5 text-[#C19968] fill-[#C19968]" />
                    <span>{product.rating.toFixed(1)}</span>
                  </div>

                  {/* Product Shoe Image */}
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Bottom Info Pill Box with Sansation Typography */}
                <div className="mt-2 bg-[#f4f2ee] rounded-2xl px-4 py-3 flex items-center justify-between border border-[#e8e2d8] shadow-2xs gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="font-sansation font-normal text-[10px] text-slate-500 uppercase tracking-[0.03em] block">
                      {product.brand}
                    </span>
                    <h3 className="font-sansation font-normal text-[13px] leading-[1.31] tracking-[0.03em] text-[#030303] truncate">
                      {product.title}
                    </h3>
                  </div>

                  {/* Pricing (Right Aligned) */}
                  <div className="flex items-baseline gap-1 flex-shrink-0 text-right">
                    <span className="font-sansation text-xs sm:text-sm font-bold text-[#89591C]">
                      ₹{product.price}
                    </span>
                    <span className="font-sansation text-[10px] text-slate-400 line-through">
                      ₹{product.originalPrice}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* D. Promotional Secondary Banner Section (banner1.webp) */}
        <section className="relative w-[calc(100%+4rem)] sm:w-[calc(100%+6rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[21/8] sm:aspect-[16/6] -mx-8 sm:-mx-12 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
          <Image
            src="/images/banner1.webp"
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
            <h2 className="font-sansation font-light text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center">
              Category
            </h2>
          </div>

          {/* Category Product Cards Grid with absolute edge buttons */}
          <div className="relative">
            {/* Left Edge Button */}
            <button
              type="button"
              aria-label="Previous Category Product"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-[#030303] text-white flex items-center justify-center shadow-md hover:bg-[#89591C] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {[
                { id: 'c1', label: 'Casual Shoe',    imageUrl: '/products/product5.webp' },
                { id: 'c2', label: 'Casual Sandal',  imageUrl: '/products/product6.webp' },
                { id: 'c3', label: 'Leather Shoe',   imageUrl: '/products/product7.webp' },
                { id: 'c4', label: 'Leather Sandal', imageUrl: '/products/product.8.png' },
              ].map((cat) => (
                <div key={cat.id} className="group flex flex-col items-center cursor-pointer">
                  {/* Product Image */}
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8]">
                    <Image
                      src={cat.imageUrl}
                      alt={cat.label}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {/* Label */}
                  <p className="mt-2.5 font-sansation font-normal text-[13px] leading-[1.31] tracking-[0.03em] text-[#030303] text-center">
                    {cat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Right Edge Button */}
            <button
              type="button"
              aria-label="Next Category Product"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-[#030303] text-white flex items-center justify-center shadow-md hover:bg-[#89591C] transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* F. Promotional Banner (banner3.webp — Comfort Sandal) */}
        <section className="relative w-[calc(100%+4rem)] sm:w-[calc(100%+6rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[21/8] sm:aspect-[16/6] -mx-8 sm:-mx-12 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
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
            <h2 className="font-sansation font-light text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center">
              Best Seller
            </h2>
            {/* Nav arrows — pinned right */}
            <div className="absolute right-0 flex items-center gap-2">
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
            <div className="group flex flex-col cursor-pointer h-full">
              <div className="relative w-full h-full min-h-[340px] lg:min-h-[480px] rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8]">
                <Image
                  src="/products/product9.webp"
                  alt="Men's Casual Comfort Sandals – WGP50020"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              {/* Info pill */}
              <div className="mt-2 bg-[#f4f2ee] rounded-2xl px-4 py-3 flex items-center justify-between border border-[#e8e2d8] gap-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="font-sansation font-normal text-[10px] text-slate-500 uppercase tracking-[0.03em] block">Gravoz</span>
                  <h3 className="font-sansation font-normal text-[13px] leading-[1.31] tracking-[0.03em] text-[#030303]">
                    Men&apos;s Casual Comfort Sandals – WGP50020 Black
                  </h3>
                </div>
                <div className="flex items-baseline gap-1 flex-shrink-0">
                  <span className="font-sansation text-sm font-bold text-[#89591C]">₹1399</span>
                  <span className="font-sansation text-[10px] text-slate-400 line-through">₹1429</span>
                </div>
              </div>
            </div>

            {/* Right — 2×2 Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'b1', imageUrl: '/products/product10.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black" },
                { id: 'b2', imageUrl: '/products/product11.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black" },
                { id: 'b3', imageUrl: '/products/product12.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black" },
                { id: 'b4', imageUrl: '/products/product13.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              ].map((item) => (
                <div key={item.id} className="group flex flex-col cursor-pointer">
                  {/* Image with star badge */}
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8]">
                    {/* Star Badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-semibold text-slate-700 z-10">
                      <Star className="w-3.5 h-3.5 text-[#C19968] fill-[#C19968]" />
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
                  <div className="mt-2 bg-[#f4f2ee] rounded-2xl px-3 py-2.5 flex items-center justify-between border border-[#e8e2d8] gap-2">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="font-sansation font-normal text-[10px] text-slate-500 uppercase tracking-[0.03em] block">Gravoz</span>
                      <h3 className="font-sansation font-normal text-[12px] leading-[1.31] tracking-[0.03em] text-[#030303] line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex items-baseline gap-1 flex-shrink-0">
                      <span className="font-sansation text-xs font-bold text-[#89591C]">₹1399</span>
                      <span className="font-sansation text-[10px] text-slate-400 line-through">₹1429</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* H. Product Showcase — 2 products side by side */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Product 1 — Men's (p1=main, p2=tall right, p3=thumbnail overlay) */}
          <div className="grid grid-cols-2 gap-3 items-start">

            {/* Left col: main image with overlapping thumbnail + info + button */}
            <div className="flex flex-col gap-2">
              {/* Main image with p3 thumbnail overlapping bottom-left */}
              <div className="relative rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] aspect-[3/4]">
                <Image
                  src="/products/p1.webp"
                  alt="Men's Casual Comfort Sandals – main"
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
                {/* Thumbnail floating at bottom-left */}
                <div className="absolute bottom-3 left-3 w-[38%] aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
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
                <p className="font-sansation font-normal text-[14px] leading-[1.31] tracking-[0.03em] text-[#030303]">
                  Men&apos;s Casual Comfort Sandals
                </p>
                <p className="font-sansation font-bold text-[14px] text-[#89591C]">₹1399</p>
              </div>
              {/* Add to Cart */}
              <button
                type="button"
                className="w-full bg-[#030303] text-white font-sansation font-normal text-[13px] tracking-[0.03em] py-3 rounded-xl hover:bg-[#89591C] transition-colors duration-300 cursor-pointer"
              >
                Add to Cart
              </button>
            </div>

            {/* Right col: tall portrait image only */}
            <div className="relative rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] h-full min-h-[420px]">
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
              <div className="relative rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] aspect-[3/4]">
                <Image
                  src="/products/p4.webp"
                  alt="Women's Casual Comfort Sandals – main"
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
                {/* Thumbnail floating at bottom-left */}
                <div className="absolute bottom-3 left-3 w-[38%] aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
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
                <p className="font-sansation font-normal text-[14px] leading-[1.31] tracking-[0.03em] text-[#030303]">
                  Women&apos;s Casual Comfort Sandals
                </p>
                <p className="font-sansation font-bold text-[14px] text-[#89591C]">₹1399</p>
              </div>
              {/* Add to Cart */}
              <button
                type="button"
                className="w-full bg-[#030303] text-white font-sansation font-normal text-[13px] tracking-[0.03em] py-3 rounded-xl hover:bg-[#89591C] transition-colors duration-300 cursor-pointer"
              >
                Add to Cart
              </button>
            </div>

            {/* Right col: tall portrait image only */}
            <div className="relative rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] h-full min-h-[420px]">
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
        <section className="relative w-[calc(100%+4rem)] sm:w-[calc(100%+6rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[21/8] sm:aspect-[16/6] -mx-8 sm:-mx-12 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
          <Image
            src="/images/banner4.webp"
            alt="GRAVOZ Promotional Banner"
            fill
            sizes="100vw"
            className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
          />
        </section>

        {/* J. New Arrivals Row — product14 to product17 (4 floating cards) */}
        <section className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
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
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-semibold text-slate-700 z-10">
                      <Star className="w-3.5 h-3.5 text-[#C19968] fill-[#C19968]" />
                      <span>5.0</span>
                    </div>
                  )}

                  {/* Eye icon badge — only on featured card */}
                  {item.featured && (
                    <div className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white border border-[#e8e2d8] flex items-center justify-center shadow-sm">
                      <Eye className="w-3.5 h-3.5 text-[#030303]" />
                    </div>
                  )}

                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* "Choose Option" hover overlay — only on featured card */}
                  {item.featured && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="bg-white text-[#030303] font-sansation font-normal text-[12px] tracking-[0.03em] px-4 py-1.5 rounded-full shadow border border-[#e8e2d8]">
                        Choose Option
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Pill */}
                <div className="mt-2 bg-[#f4f2ee] rounded-2xl px-4 py-3 flex items-center justify-between border border-[#e8e2d8] shadow-2xs gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="font-sansation font-normal text-[10px] text-slate-500 uppercase tracking-[0.03em] block">Gravoz</span>
                    <h3 className="font-sansation font-normal text-[13px] leading-[1.31] tracking-[0.03em] text-[#030303] truncate">
                      {item.title}
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-1 flex-shrink-0">
                    <span className="font-sansation text-xs sm:text-sm font-bold text-[#89591C]">₹1399</span>
                    <span className="font-sansation text-[10px] text-slate-400 line-through">₹1429</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* K. Year Sale Section — product18 to product21 */}
        <section className="space-y-4 pt-2">
          {/* Header Row — centered title only */}
          <div className="flex justify-center">
            <h2 className="font-sansation font-light text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center">
              Year Sale
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[
              { id: 'y1', imageUrl: '/products/product18.webp', price: 1199, original: 1169, sale: false,  discount: null },
              { id: 'y2', imageUrl: '/products/product19.webp', price: 1669, original: 1699, sale: true,   discount: '20% off' },
              { id: 'y3', imageUrl: '/products/product20.webp', price: 1199, original: 1169, sale: false,  discount: null },
              { id: 'y4', imageUrl: '/products/product21.webp', price: 1199, original: 1169, sale: false,  discount: null },
            ].map((item) => (
              <div key={item.id} className="group relative flex flex-col cursor-pointer bg-[#f4f2ee] border border-[#e8e2d8] rounded-2xl overflow-hidden hover:shadow-md transition-shadow">

                {/* Sale badge — top left, only on sale card */}
                {item.sale && (
                  <div className="absolute top-3 left-3 z-10 bg-[#030303] text-white font-sansation text-[11px] font-bold tracking-wide px-3 py-1 rounded-md">
                    Sale
                  </div>
                )}

                {/* Product Image */}
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={`GRAVOZ Product ${item.id}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Price row */}
                <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
                  {/* 20% off pill */}
                  {item.discount && (
                    <span className="font-sansation text-[10px] font-bold text-white bg-[#89591C] px-2 py-0.5 rounded-full">
                      {item.discount}
                    </span>
                  )}
                  <span className="font-sansation font-bold text-[14px] text-[#89591C]">₹{item.price}</span>
                  <span className="font-sansation text-[12px] text-slate-400 line-through">₹{item.original}</span>
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* L. Top Selling — Infinite Logo Marquee Strip */}
        <section className="pt-2">
          {/* Marquee container */}
          <div className="w-full overflow-hidden border-y border-[#e8e2d8] py-5 bg-white -mx-8 sm:-mx-12 md:-mx-20 lg:-mx-28 px-8 sm:px-12 md:px-20 lg:px-28">
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

        {/* M. Top Selling Products List */}
        <section className="space-y-3 pt-2">
          {/* Header */}
          <div className="relative flex items-center justify-center">
            <h2 className="font-sansation font-light text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center">
              Top Selling
            </h2>
            <a href="/products" className="absolute right-0 font-sansation text-[13px] font-normal text-[#030303] underline underline-offset-2 hover:text-[#89591C] transition-colors">
              View All
            </a>
          </div>

          <hr className="border-[#e8e2d8]" />

          {/* 3 col × 3 row grid */}
          {[
            [
              { img: '/products/product1.webp',  brand: 'Gravoz',  name: 'Leather Shoe',   price: 1969, original: 1999 },
              { img: '/products/product9.webp',   brand: 'Jackrob', name: 'Leather Sandal', price: 1169, original: 1199 },
              { img: '/products/product13.webp',  brand: 'Ellora',  name: 'Leather Sandal', price: 1169, original: 1199 },
            ],
            [
              { img: '/products/product10.webp', brand: 'Gravoz',  name: 'Leather Shoe',   price: 1969, original: 1999 },
              { img: '/products/product11.webp', brand: 'Ellora',  name: 'Leather Sandal', price: 969,  original: 999  },
              { img: '/products/product12.webp', brand: 'Ellora',  name: 'Leather Sandal', price: 1969, original: 1699 },
            ],
            [
              { img: '/products/product5.webp',  brand: 'Ellora',  name: 'Leather Sandal', price: 1169, original: 1199 },
              { img: '/products/product7.webp',  brand: 'Ellora',  name: 'Leather Shoe',   price: 1669, original: 1699 },
              { img: '/products/product6.webp',  brand: 'Ellora',  name: 'Leather Sandal', price: 1069, original: 1099 },
            ],
          ].map((row, rowIdx) => (
            <div key={rowIdx}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#e8e2d8]">
                {row.map((item, colIdx) => (
                  <div key={colIdx} className="flex items-center gap-4 px-4 py-4 hover:bg-[#faf8f5] transition-colors cursor-pointer group">
                    {/* Small product image */}
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8]">
                      <Image
                        src={item.img}
                        alt={`${item.brand} ${item.name}`}
                        fill
                        sizes="80px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    {/* Info */}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-sansation text-[11px] text-slate-500 tracking-[0.03em]">{item.brand}</span>
                      <p className="font-sansation font-bold text-[14px] leading-[1.31] tracking-[0.03em] text-[#030303]">{item.name}</p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-sansation font-bold text-[13px] text-[#89591C]">₹{item.price}</span>
                        <span className="font-sansation text-[12px] text-slate-400 line-through">₹{item.original}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {rowIdx < 2 && <hr className="border-[#e8e2d8]" />}
            </div>
          ))}
        </section>

        {/* N. Promotional Banner (banner5.webp) */}
        <section className="relative w-[calc(100%+4rem)] sm:w-[calc(100%+6rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[21/8] sm:aspect-[16/6] -mx-8 sm:-mx-12 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
          <Image
            src="/images/banner5.webp"
            alt="GRAVOZ Daily Collection Banner"
            fill
            sizes="100vw"
            className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
          />
        </section>

        {/* O. Daily Collection Section — 12 Product Cards Grid (3 rows × 4 cols) */}
        <section className="space-y-4 pt-2">
          {/* Header Row — centered title only */}
          <div className="flex justify-center">
            <h2 className="font-sansation font-light text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center">
              Daily Collection
            </h2>
          </div>

          {/* 12 Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[
              { id: 'dc1',  imageUrl: '/products/product1.webp',  title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              { id: 'dc2',  imageUrl: '/products/product2.webp',  title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              { id: 'dc3',  imageUrl: '/products/product3.webp',  title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              { id: 'dc4',  imageUrl: '/products/product4.webp',  title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              { id: 'dc5',  imageUrl: '/products/product5.webp',  title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              { id: 'dc6',  imageUrl: '/products/product6.webp',  title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              { id: 'dc7',  imageUrl: '/products/product7.webp',  title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              { id: 'dc8',  imageUrl: '/products/product.8.png',  title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              { id: 'dc9',  imageUrl: '/products/product9.webp',  title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              { id: 'dc10', imageUrl: '/products/product10.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              { id: 'dc11', imageUrl: '/products/product11.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black" },
              { id: 'dc12', imageUrl: '/products/product12.webp', title: "Men's Casual Comfort Sandals – WGP50020 Black" },
            ].map((product) => (
              <div key={product.id} className="group flex flex-col cursor-pointer">

                {/* Floating Product Image (Boxless & Borderless) */}
                <div className="relative aspect-square w-full flex items-center justify-center p-2 overflow-hidden bg-transparent">
                  {/* Star Rating Badge (Top Right) */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-semibold text-slate-700 z-10">
                    <Star className="w-3.5 h-3.5 text-[#C19968] fill-[#C19968]" />
                    <span>5.0</span>
                  </div>

                  {/* Product Shoe Image */}
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Bottom Info Pill Box */}
                <div className="mt-2 bg-[#f4f2ee] rounded-2xl px-4 py-3 flex items-center justify-between border border-[#e8e2d8] shadow-2xs gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="font-sansation font-normal text-[10px] text-slate-500 uppercase tracking-[0.03em] block">
                      Gravoz
                    </span>
                    <h3 className="font-sansation font-normal text-[13px] leading-[1.31] tracking-[0.03em] text-[#030303] truncate">
                      {product.title}
                    </h3>
                  </div>

                  {/* Pricing (Right Aligned) */}
                  <div className="flex items-baseline gap-1 flex-shrink-0 text-right">
                    <span className="font-sansation text-xs sm:text-sm font-bold text-[#89591C]">
                      ₹1399
                    </span>
                    <span className="font-sansation text-[10px] text-slate-400 line-through">
                      ₹1429
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </section>

      </main>

      {/* 3. Footer */}
      <footer className="bg-white border-t border-[#e8e2d8] py-6 mt-12">
        <div className="max-w-[1530px] w-full mx-auto px-4 text-center space-y-1">
          <p className="text-xs font-semibold text-[#030303] uppercase tracking-wider">GRAVOZ</p>
          <p className="text-[11px] text-slate-500 font-normal">
            © {new Date().getFullYear()} GRAVOZ Shoes. Quality Sandals for Every Family Moment.
          </p>
        </div>
      </footer>
    </div>
  );
}
