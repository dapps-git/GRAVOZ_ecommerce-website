'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import RecommendationStrip from '@/components/RecommendationStrip';
import RecentlyViewedStrip from '@/components/RecentlyViewedStrip';
import DynamicProductSection from '@/components/DynamicProductSection';
import CuratedShowcaseSection from '@/components/CuratedShowcaseSection';
import DuoSpotlightSection from '@/components/DuoSpotlightSection';
import { ArrowRight, ChevronLeft, ChevronRight, Star, Truck, ShieldCheck, Leaf, Globe, Heart } from 'lucide-react';
import { getProductRating } from '@/lib/ratingUtils';
import { useWishlist } from '@/context/WishlistContext';
import { optimizeCloudinaryUrl, isDirectCdnUrl } from '@/lib/cloudinaryUrl';

function SkeletonProductCard() {
  return (
    <div className="flex flex-col animate-pulse bg-white rounded-md border border-[#E5E5E5] p-3 sm:p-3.5">
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-[#F7F7F7]" />
      <div className="mt-3 space-y-2">
        <div className="h-3.5 w-3/4 rounded bg-[#EBEBEB]" />
        <div className="h-3 w-1/3 rounded bg-[#EBEBEB]" />
        <div className="h-4 w-1/2 rounded bg-[#EBEBEB]" />
      </div>
    </div>
  );
}

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
  reviewsCount: number;
  imageUrl: string;
  images: string[];
  href: string;
  subCategory?: string;
  targetAudience?: string;
  colors?: string[];
  colorVariants?: Array<{ name: string; colorCode?: string }>;
  isFeatured?: boolean;
  noReturnRefundExchange?: boolean;
}

export interface HomeInitialData {
  banners: Record<string, any>;
  shoeCategories: Array<{ id: string; label: string; href: string; imageUrl: string }> | null;
  categoryCards: CategoryCardData[] | null;
  products: any[];
  homeSections: Record<string, any>;
  hasServerData: boolean;
}

function mapProductToItem(p: any, idx: number): ProductItem {
  const rawImgs = Array.isArray(p.imageUrls)
    ? p.imageUrls
    : Array.isArray(p.images)
    ? p.images
    : [];
  const imgs: string[] = rawImgs
    .map((img: any) => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean);
  const mainImg = imgs[0] || (typeof p.imageUrl === 'string' ? p.imageUrl : '/products/placeholder.svg');
  if (imgs.length === 0 && mainImg) {
    imgs.push(mainImg);
  }
  return {
    id: p._id || `p${idx + 1}`,
    brand: typeof p.brand === 'object' && p.brand !== null ? p.brand.name : (p.brand || 'SERCHER'),
    title: p.name || p.title || '',
    price: p.discountPrice || p.price || 0,
    originalPrice: p.price || p.originalPrice || 0,
    rating: p.rating ?? 5.0,
    reviewsCount: p.reviewsCount ?? 0,
    imageUrl: mainImg,
    images: imgs,
    href: `/products/${p.slug || p._id}`,
    subCategory: p.subCategory,
    targetAudience: p.targetAudience,
    colors: p.colors,
    colorVariants: p.colorVariants,
    isFeatured: Boolean(p.isFeatured),
    noReturnRefundExchange: Boolean(p.noReturnRefundExchange),
  };
}

function AnimatedProductCard({
  product,
  index,
  isInWishlist,
  toggleWishlist,
}: {
  product: ProductItem;
  index: number;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (item: any) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);
  const rawMain = product.imageUrl || (product.images && product.images[0]) || '/products/placeholder.svg';
  const rawSec = product.images && product.images.length > 1 ? product.images[1] : null;
  const mainImage = optimizeCloudinaryUrl(rawMain, 500);
  const secondaryImage = rawSec && rawSec !== rawMain ? optimizeCloudinaryUrl(rawSec, 500) : null;

  return (
    <Link
      href={product.href || `/products/${product.id}`}
      onMouseEnter={() => { if (!hovered) setHovered(true); }}
      className="group bg-white rounded-md border border-[#E5E5E5] p-3 sm:p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#F37021]/40 transition-all duration-300 cursor-pointer active:scale-[0.99]"
    >
      <div className="relative aspect-square w-full rounded-none overflow-hidden bg-[#F7F7F7]">
        {product.noReturnRefundExchange ? (
          <div className="absolute top-0 left-0 z-20 pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC]">
              FINAL SALE
            </span>
          </div>
        ) : (
          <div className="absolute top-0 left-0 z-20 pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-none text-[8px] sm:text-[9px] font-normal tracking-[0.08em] uppercase bg-[#FFF3EB] text-[#D95B10] border border-[#FAD4BC]">
              BEST SELLER
            </span>
          </div>
        )}

        <button
          type="button"
          aria-label="Wishlist toggle"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist({
              productId: product.id,
              title: product.title,
              price: product.price,
              originalPrice: product.originalPrice,
              imageUrl: product.imageUrl,
            });
          }}
          className="absolute top-2.5 right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-xs border border-white/80 shadow-xs flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isInWishlist(product.id)
              ? 'fill-rose-500 text-rose-500'
              : 'text-slate-600 hover:text-rose-500'
              }`}
          />
        </button>

        <div className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${secondaryImage && secondaryLoaded ? 'sm:group-hover:opacity-0' : ''}`}>
          <Image
            src={mainImage}
            alt={product.title}
            fill
            unoptimized={isDirectCdnUrl(mainImage)}
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading={index < 4 ? 'eager' : 'lazy'}
          />
        </div>

        {secondaryImage && hovered && (
          <div className={`pointer-events-none hidden sm:block absolute inset-0 bg-[#F7F7F7] transition-opacity duration-300 ${secondaryLoaded ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
            <Image
              src={secondaryImage}
              alt={`${product.title} alternate view`}
              fill
              unoptimized={isDirectCdnUrl(secondaryImage)}
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="eager"
              onLoad={() => setSecondaryLoaded(true)}
            />
          </div>
        )}
      </div>

      <div className="mt-2.5 space-y-1">
        <h3 className="text-xs sm:text-[13px] font-normal text-[#111111] uppercase tracking-wide truncate group-hover:text-[#F37021] transition-colors leading-tight">
          {product.title}
        </h3>

        {(() => {
          const { rating, reviewsCount } = getProductRating(product);
          return (
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 font-normal">
              <Star className="w-3.5 h-3.5 text-[#F37021] fill-[#F37021]" strokeWidth={1.5} />
              <span className="font-normal text-slate-700">{rating.toFixed(1)}</span>
              <span className="text-slate-400 font-light">({reviewsCount})</span>
            </div>
          );
        })()}

        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="text-xs sm:text-sm font-medium text-[#F37021]">
            ₹{product.price}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-light">
              ₹{product.originalPrice}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

const DEFAULT_CATEGORIES: CategoryCardData[] = [
  { key: 'women', title: 'Women', href: '/category/women', imageUrl: '/images/banner2.webp' },
  { key: 'men', title: 'Men', href: '/category/men', imageUrl: '/images/banner1.webp' },
  { key: 'kids', title: 'Kids', href: '/category/kids', imageUrl: '/images/banner3.webp' },
];

const DEFAULT_SHOE_CATEGORIES = [
  { id: 'c1', label: 'Casual Leather', href: '/products?category=Casual+Leather', imageUrl: '/products/placeholder.svg' },
  { id: 'c2', label: 'Casual Shoe', href: '/products?category=Casual+Shoe', imageUrl: '/products/placeholder.svg' },
  { id: 'c3', label: 'Leather Shoe', href: '/products?category=Leather+Shoe', imageUrl: '/products/placeholder.svg' },
  { id: 'c4', label: 'Women sandals', href: '/products?category=Women+Sandals', imageUrl: '/products/placeholder.svg' },
];

export default function HomeClient({ initialData }: { initialData: HomeInitialData }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [banners, setBanners] = useState<Record<string, any>>(initialData.banners || {});
  const [bannerImageUrl, setBannerImageUrl] = useState<string>(
    initialData.banners?.hero?.imageUrl || '/images/banner.webp'
  );
  const [categoryCards, setCategoryCards] = useState<CategoryCardData[]>(
    initialData.categoryCards || DEFAULT_CATEGORIES
  );
  const [currentHeroSlide, setCurrentHeroSlide] = useState<number>(0);
  // Start with only Slide 0 mounted on SSR so other 3 banners don't compete with initial paint
  const [mountedSlides, setMountedSlides] = useState<number[]>([0]);

  const heroSlides = useMemo(() => {
    const list: Array<{ id: string; imageUrl: string; title?: string; subtitle?: string; linkUrl: string }> = [];
    const heroSlots = ['hero', 'hero_slide_2', 'hero_slide_3', 'hero_slide_4'];

    for (const slotKey of heroSlots) {
      const b = banners[slotKey];
      if (b && b.isActive !== false && b.imageUrl) {
        list.push({
          id: slotKey,
          imageUrl: b.imageUrl,
          title: b.title || '',
          subtitle: b.subtitle || '',
          linkUrl: b.linkUrl || '/products',
        });
      }
    }

    if (list.length === 0) {
      list.push(
        {
          id: 'hero_1',
          imageUrl: bannerImageUrl && bannerImageUrl !== '/images/placeholder.svg' ? bannerImageUrl : '/images/banner.webp',
          title: 'Step Better. Feel the Comfort.',
          subtitle: 'Quality Sandals for Every Family Moment',
          linkUrl: '/products',
        },
        {
          id: 'hero_2',
          imageUrl: '/images/banner3.webp',
          title: 'Ultra Comfort Everyday Sandal',
          subtitle: 'Ergonomic footbed with shock absorption',
          linkUrl: '/products',
        },
        {
          id: 'hero_3',
          imageUrl: '/images/banner4.webp',
          title: 'Seasonal Showcase',
          subtitle: 'New Season New Styles',
          linkUrl: '/products',
        },
        {
          id: 'hero_4',
          imageUrl: '/images/banner5.webp',
          title: 'Daily Collection',
          subtitle: 'Everyday elegance crafted for you',
          linkUrl: '/products',
        }
      );
    }

    return list;
  }, [banners, bannerImageUrl]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Mount the next hero slide ahead of its fade transition without downloading all 4 simultaneously at t=0
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const nextIdx = (currentHeroSlide + 1) % heroSlides.length;
    setMountedSlides((prev) => {
      const next = new Set(prev);
      next.add(currentHeroSlide);
      next.add(nextIdx);
      return next.size === prev.length ? prev : Array.from(next);
    });
  }, [currentHeroSlide, heroSlides.length]);

  const initialMappedProducts = useMemo(
    () => (initialData.products || []).map((p, idx) => mapProductToItem(p, idx)),
    [initialData.products]
  );

  const [products, setProducts] = useState<ProductItem[]>(initialMappedProducts);
  const [productsLoading, setProductsLoading] = useState<boolean>(!initialData.hasServerData);
  const [carouselPage, setCarouselPage] = useState<number>(0);

  const [shoeCategories, setShoeCategories] = useState<any[]>(
    initialData.shoeCategories && initialData.shoeCategories.length > 0
      ? initialData.shoeCategories
      : DEFAULT_SHOE_CATEGORIES
  );

  // Fallback client fetch ONLY if server SSR failed to deliver snapshot
  useEffect(() => {
    if (initialData.hasServerData) return;

    fetch('/api/banners')
      .then((r) => r.json())
      .then((data) => {
        if (data?.banners) {
          setBanners(data.banners);
          if (data.banners.hero?.imageUrl) {
            setBannerImageUrl(data.banners.hero.imageUrl);
          }
          setCategoryCards([
            { key: 'women', title: data.banners.category_women?.title || 'Women', href: data.banners.category_women?.linkUrl || '/category/women', imageUrl: data.banners.category_women?.imageUrl || '/images/placeholder.svg' },
            { key: 'men', title: data.banners.category_men?.title || 'Men', href: data.banners.category_men?.linkUrl || '/category/men', imageUrl: data.banners.category_men?.imageUrl || '/images/placeholder.svg' },
            { key: 'kids', title: data.banners.category_kids?.title || 'Kids', href: data.banners.category_kids?.linkUrl || '/category/kids', imageUrl: data.banners.category_kids?.imageUrl || '/images/placeholder.svg' },
          ]);
        }
      })
      .catch(() => {});

    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.categories;
        if (Array.isArray(list) && list.length > 0) {
          setShoeCategories(
            list.map((c: any) => ({
              id: c._id || c.slug || c.key,
              label: c.name || c.title,
              href: `/products?category=${encodeURIComponent(c.name || c.title || c.slug)}`,
              imageUrl: c.image || c.imageUrl || '/products/placeholder.svg',
            }))
          );
        }
      })
      .catch(() => {});

    fetch('/api/products?limit=200')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.products) && data.products.length > 0) {
          setProducts(data.products.map((p: any, idx: number) => mapProductToItem(p, idx)));
        } else {
          setProducts([]);
        }
      })
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [initialData.hasServerData]);

  // Precomputed pool for RecommendationStrip so no second MongoDB hit happens on Homepage mount
  const initialRecommendationPool = useMemo(() => {
    if (!initialData.hasServerData) return undefined;
    return (initialData.products || []).slice(0, 6).map((p: any) => ({
      _id: String(p._id),
      name: String(p.name || ''),
      brand: p.brand,
      price: Number(p.discountPrice || p.price || 0),
      originalPrice: p.price ? Number(p.price) : undefined,
      subCategory: p.subCategory,
      targetAudience: p.targetAudience,
      rating: p.rating,
      colors: p.colors,
      colorVariants: p.colorVariants,
      images: Array.isArray(p.images) ? p.images : [],
      noReturnRefundExchange: Boolean(p.noReturnRefundExchange),
    }));
  }, [initialData.hasServerData, initialData.products]);

  const initialFeaturedProducts = useMemo(() => {
    if (!initialData.hasServerData) return undefined;
    return initialMappedProducts.filter((p) => p.isFeatured).slice(0, 8);
  }, [initialData.hasServerData, initialMappedProducts]);

  const secondaryBannerUrl = optimizeCloudinaryUrl(banners.secondary?.imageUrl || '/images/banner1.webp', 1440);
  const comfortBannerUrl = banners.comfort_sandal?.imageUrl
    ? optimizeCloudinaryUrl(banners.comfort_sandal.imageUrl, 1440)
    : '';
  const promoStripUrl = optimizeCloudinaryUrl(banners.promo_strip?.imageUrl || '/images/placeholder.svg', 1440);
  const dailyBannerUrl = optimizeCloudinaryUrl(banners.daily_collection?.imageUrl || '/images/banner5.webp', 1440);

  return (
    <div className="min-h-screen bg-white text-[#030303] font-sans flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-[1530px] w-full mx-auto px-4 sm:px-8 md:px-20 lg:px-28 pt-0 pb-6 md:pb-10 space-y-6 sm:space-y-10 bg-white">

        {/* A. Top Hero Banner Card — Immediate SSR Slide 0, progressive adjacent slide mounting */}
        <section
          className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[1816/866] -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white"
        >
          {heroSlides.map((slide, idx) => {
            if (!mountedSlides.includes(idx)) return null;
            const isActive = idx === currentHeroSlide;
            const optUrl = optimizeCloudinaryUrl(slide.imageUrl, 1440);
            return (
              <Link
                key={slide.id}
                href={slide.linkUrl}
                tabIndex={isActive ? 0 : -1}
                aria-hidden={!isActive}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
              >
                <Image
                  src={optUrl}
                  alt={slide.title || 'SERCHER Footwear Banner'}
                  fill
                  unoptimized={isDirectCdnUrl(optUrl)}
                  priority={idx === 0}
                  fetchPriority={idx === 0 ? 'high' : 'low'}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  sizes="100vw"
                  className="object-cover object-center group-hover:scale-[1.015] transition-transform duration-700"
                />
              </Link>
            );
          })}
        </section>

        {/* B. 3 Category Cards Section (Hidden as in original layout) */}
        {false && (
          <section className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
            {categoryCards.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className="group flex flex-col rounded-xl sm:rounded-2xl overflow-hidden border border-[#E5E5E5] shadow-2xs hover:shadow-md transition-all bg-[#F3F3F3]"
              >
                <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full bg-[#F3F3F3] overflow-hidden">
                  <Image
                    src={optimizeCloudinaryUrl(card.imageUrl, 600)}
                    alt={`${card.title} Footwear Collection`}
                    fill
                    unoptimized={isDirectCdnUrl(card.imageUrl)}
                    sizes="33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="bg-[#F3F3F3] px-2.5 sm:px-4 md:px-5 py-2 sm:py-3.5 flex items-center justify-between border-t border-[#E5E5E5]">
                  <span className="text-[11px] sm:text-sm md:text-base font-semibold text-[#030303] truncate">
                    {card.title}
                  </span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#030303] group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </div>
              </Link>
            ))}
          </section>
        )}

        {/* C. "Suggested for You" Products Carousel */}
        {(productsLoading || products.length > 0) && (
          <section className="space-y-4 pt-2">
            <div className="relative flex items-center justify-between sm:justify-center">
              <h2 className="font-poppins font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#111111] uppercase text-center sm:px-4">
                Suggested for You
              </h2>
              <div className="flex sm:absolute sm:right-0 items-center gap-2 sm:gap-3">
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-1 font-sansation text-xs sm:text-[13px] font-medium text-[#030303] hover:text-[#F37021] transition-colors"
                >
                  <span className="underline underline-offset-4 decoration-[#E5E5E5] group-hover:decoration-[#F37021]">
                    View All ({products.length})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#F37021] group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous Product"
                    onClick={() => {
                      const maxP = Math.max(0, Math.ceil(products.length / 4) - 1);
                      setCarouselPage((p) => (p > 0 ? p - 1 : maxP));
                    }}
                    className="w-9 h-9 rounded-full border border-[#E5E5E5] flex items-center justify-center text-[#555555] hover:bg-[#F7F7F7] hover:border-[#F37021] hover:text-[#F37021] transition-all cursor-pointer bg-white shadow-2xs active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next Product"
                    onClick={() => {
                      const maxP = Math.max(0, Math.ceil(products.length / 4) - 1);
                      setCarouselPage((p) => (p < maxP ? p + 1 : 0));
                    }}
                    className="w-9 h-9 rounded-full border border-[#E5E5E5] flex items-center justify-center text-[#555555] hover:bg-[#F7F7F7] hover:border-[#F37021] hover:text-[#F37021] transition-all cursor-pointer bg-white shadow-2xs active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {productsLoading
                ? [0, 1, 2, 3].map((i) => <SkeletonProductCard key={i} />)
                : (products.length > 4
                    ? products.slice(carouselPage * 4, carouselPage * 4 + 4)
                    : products
                  ).map((product, idx) => (
                    <AnimatedProductCard
                      key={product.id}
                      product={product}
                      index={idx}
                      isInWishlist={isInWishlist}
                      toggleWishlist={toggleWishlist}
                    />
                  ))}
            </div>

            <div className="flex justify-center pt-1 sm:hidden">
              <Link
                href="/products"
                className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E5E5E5] bg-white text-xs font-semibold text-slate-800 hover:text-[#F37021] hover:border-[#F37021] transition-all shadow-2xs"
              >
                <span>View All {products.length} Products</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#F37021] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>
        )}

        {/* Dynamic Recommendation Strip */}
        <section className="pt-2">
          <RecommendationStrip limit={6} initialProducts={initialRecommendationPool} />
        </section>

        {/* Recently Viewed Products Strip */}
        <RecentlyViewedStrip limit={4} />

        {/* D. Promotional Secondary Banner Section */}
        <section className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[2001/786] -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
          <Link href="/products" className="block w-full h-full cursor-pointer">
            <Image
              src={secondaryBannerUrl}
              alt="SERCHER Luxury Leather Shoes Banner"
              fill
              unoptimized={isDirectCdnUrl(secondaryBannerUrl)}
              loading="lazy"
              sizes="100vw"
              className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
            />
          </Link>
        </section>

        {/* E. Category Section */}
        <section className="space-y-4 pt-2">
          <div className="flex justify-center">
            <h2 className="font-sansation font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#030303] uppercase text-center px-4">
              Category
            </h2>
          </div>

          <div className="relative">
            <button
              type="button"
              aria-label="Previous Category Product"
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-[#030303] text-white items-center justify-center shadow-md hover:bg-[#F37021] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {shoeCategories.slice(0, 4).map((cat) => {
                const catImg = optimizeCloudinaryUrl(cat.imageUrl || '/products/placeholder.svg', 500);
                return (
                  <Link key={cat.id || cat.label} href={cat.href || '/products'} className="group flex flex-col items-center cursor-pointer">
                    <div className="relative w-full aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-[#F3F3F3] border border-[#E5E5E5] shadow-2xs group-hover:shadow-md transition-shadow">
                      <Image
                        src={catImg}
                        alt={cat.label}
                        fill
                        unoptimized={isDirectCdnUrl(catImg)}
                        loading="lazy"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <p className="mt-2 font-sansation font-normal text-[11px] sm:text-[13px] leading-[1.31] tracking-[0.03em] text-[#030303] text-center group-hover:text-[#F37021] transition-colors">
                      {cat.label}
                    </p>
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              aria-label="Next Category Product"
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-[#030303] text-white items-center justify-center shadow-md hover:bg-[#F37021] transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* F. Promotional Banner (Comfort Sandal) */}
        {comfortBannerUrl && (
          <section className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[3076/1208] -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
            <Link href="/products" className="block w-full h-full cursor-pointer">
              <Image
                src={comfortBannerUrl}
                alt="SERCHER Comfort Sandal Banner"
                fill
                unoptimized={isDirectCdnUrl(comfortBannerUrl)}
                loading="lazy"
                sizes="100vw"
                className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
              />
            </Link>
          </section>
        )}

        {/* G. Best Sellers Curated Showcase */}
        <CuratedShowcaseSection
          sectionKey="best_sellers"
          fallbackTitle="Best Sellers"
          fallbackSubtitle="Our most loved and iconic designs"
          initialSection={initialData.hasServerData ? initialData.homeSections?.best_sellers : undefined}
        />

        {/* G2. Duo Product Spotlight */}
        <DuoSpotlightSection
          product1={banners.duo_product_1}
          product2={banners.duo_product_2}
        />

        {/* H. Top Selling Curated Showcase */}
        <CuratedShowcaseSection
          sectionKey="top_selling"
          fallbackTitle="Top Selling"
          fallbackSubtitle="Trending styles chosen by thousands"
          initialSection={initialData.hasServerData ? initialData.homeSections?.top_selling : undefined}
        />

        {/* I. Promotional Banner */}
        <section className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[3200/1034] -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
          <Link href="/products" className="block w-full h-full cursor-pointer">
            <Image
              src={promoStripUrl}
              alt="SERCHER Promotional Banner"
              fill
              unoptimized={isDirectCdnUrl(promoStripUrl)}
              loading="lazy"
              sizes="100vw"
              className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
            />
          </Link>
        </section>

        {/* J. Latest Arrivals Showcase */}
        <CuratedShowcaseSection
          sectionKey="latest_products"
          fallbackTitle="Latest Arrivals"
          fallbackSubtitle="Fresh new season silhouettes"
          initialSection={initialData.hasServerData ? initialData.homeSections?.latest_products : undefined}
        />

        {/* K. Featured Collection Showcase */}
        <CuratedShowcaseSection
          sectionKey="featured_products"
          fallbackTitle="Featured Collection"
          fallbackSubtitle="Handpicked handcrafted perfection"
          initialSection={initialData.hasServerData ? initialData.homeSections?.featured_products : undefined}
        />

        {/* L. Infinite Logo Marquee Strip */}
        <section className="pt-2">
          <div className="w-full overflow-hidden border-y border-[#E5E5E5] py-3 sm:py-5 bg-white -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 px-4 sm:px-8 md:px-20 lg:px-28">
            <div className="flex items-center animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-16 px-8">
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/icons/logo1.webp" alt="Brand Logo 1" fill className="object-contain" sizes="112px" loading="lazy" />
                  </div>
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/sercher-brand-logo.png" alt="Sercher Logo" fill className="object-contain" sizes="112px" loading="lazy" />
                  </div>
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/icons/logo2.webp" alt="Brand Logo 2" fill className="object-contain" sizes="112px" loading="lazy" />
                  </div>
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/icons/logo1.webp" alt="Brand Logo 1" fill className="object-contain" sizes="112px" loading="lazy" />
                  </div>
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/sercher-brand-logo.png" alt="Sercher Logo" fill className="object-contain" sizes="112px" loading="lazy" />
                  </div>
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/icons/logo2.webp" alt="Brand Logo 2" fill className="object-contain" sizes="112px" loading="lazy" />
                  </div>
                  <div className="relative h-8 w-28 flex-shrink-0">
                    <Image src="/icons/logo1.webp" alt="Brand Logo 1" fill className="object-contain" sizes="112px" loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* M. Featured Products (only shown if any product is flagged isFeatured) */}
        <DynamicProductSection
          heading="Featured Products"
          filter="isFeatured"
          limit={8}
          initialProducts={initialFeaturedProducts}
        />

        {/* N. Complete Catalog Grid — Ensures all 27+ active products are visible on the storefront */}
        {products.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="relative flex items-center justify-between sm:justify-center">
              <h2 className="font-poppins font-light text-lg sm:text-[24px] leading-[1.31] tracking-[0.08em] text-[#111111] uppercase text-center sm:px-4">
                All Footwear Collection
              </h2>
              <div className="flex sm:absolute sm:right-0 items-center gap-2">
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-1 font-sansation text-xs sm:text-[13px] font-medium text-[#030303] hover:text-[#F37021] transition-colors"
                >
                  <span className="underline underline-offset-4 decoration-[#E5E5E5] group-hover:decoration-[#F37021]">
                    Filter & Sort ({products.length})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#F37021] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {products.map((product, idx) => (
                <AnimatedProductCard
                  key={`catalog-${product.id}`}
                  product={product}
                  index={idx + 4}
                  isInWishlist={isInWishlist}
                  toggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          </section>
        )}

        {/* O. Promotional Banner (Daily Collection) */}
        <section className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] md:w-[calc(100%+10rem)] lg:w-[calc(100%+14rem)] aspect-[3172/1230] -mx-4 sm:-mx-8 md:-mx-20 lg:-mx-28 overflow-hidden group bg-white">
          <Image
            src={dailyBannerUrl}
            alt="SERCHER Daily Collection Banner"
            fill
            unoptimized={isDirectCdnUrl(dailyBannerUrl)}
            loading="lazy"
            sizes="100vw"
            className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
          />
        </section>

      </main>

      {/* Rich Footer Section */}
      <footer className="w-full bg-white mt-10">

        <div className="w-full bg-[#030303] py-6 sm:py-10 px-3 sm:px-8 md:px-20 lg:px-28">
          <div className="max-w-[1530px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">

            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 flex flex-col justify-between shadow-sm min-h-[125px] sm:min-h-[145px]">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#F3F3F3] border border-[#E5E5E5] flex items-center justify-center text-[#030303] mb-2 sm:mb-3 flex-shrink-0">
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

            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 flex flex-col justify-between shadow-sm min-h-[125px] sm:min-h-[145px]">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#F3F3F3] border border-[#E5E5E5] flex items-center justify-center text-[#030303] mb-2 sm:mb-3 flex-shrink-0">
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

            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 flex flex-col justify-between shadow-sm min-h-[125px] sm:min-h-[145px]">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#F3F3F3] border border-[#E5E5E5] flex items-center justify-center text-[#030303] mb-2 sm:mb-3 flex-shrink-0">
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

            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 flex flex-col justify-between shadow-sm min-h-[125px] sm:min-h-[145px]">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#F3F3F3] border border-[#E5E5E5] flex items-center justify-center text-[#030303] mb-2 sm:mb-3 flex-shrink-0">
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

        <div className="max-w-[1530px] mx-auto px-4 sm:px-8 md:px-20 lg:px-28 pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr] gap-8 sm:gap-10">

            <div className="space-y-4 max-w-sm">
              <div className="relative h-8 w-36">
                <Image
                  src="/sercher-brand-logo.png"
                  alt="SERCHER"
                  fill
                  className="object-contain object-left"
                  sizes="144px"
                />
              </div>
              <p className="font-sansation text-xs leading-relaxed text-slate-600">
                Premium leather footwear crafted with timeless style, exceptional comfort, and attention to every detail. Made for those who appreciate quality that lasts, from everyday essentials to refined classics. Step into quality. Step into Sercher.
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="font-sansation font-bold text-xs uppercase tracking-wider text-[#030303]">
                SHOP
              </h5>
              <ul className="space-y-2.5 font-sansation text-xs text-slate-600">
                <li><Link href="/category/men" className="hover:text-[#F37021] transition-colors">Men Shoes</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-sansation font-bold text-xs uppercase tracking-wider text-[#030303]">
                FOLLOW US
              </h5>
              <div className="flex items-center gap-3">
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

          <div className="border-t border-[#E5E5E5] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-sansation text-xs text-slate-500">
            <p>© {new Date().getFullYear()} SERCHER. All Rights Reserved.</p>

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

