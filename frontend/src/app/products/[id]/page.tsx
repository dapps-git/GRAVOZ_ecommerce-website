'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RecommendationStrip from '@/components/RecommendationStrip';
import { trackEvent } from '@/lib/userBehavior';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useUser } from '@/context/UserContext';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Ruler,
  Plus,
  Minus,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  X,
  Maximize2,
  AlertCircle,
  Heart,
  ZoomIn
} from 'lucide-react';

interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductSizeItem {
  size: string;
  isAvailable: boolean;
  stock?: number;
}

export interface ColorVariant {
  id?: string;
  name: string;
  colorCode?: string;
  imageUrl?: string;
  images?: ProductImage[];
  sizes?: ProductSizeItem[];
  isAvailable?: boolean;
}

interface ProductDetails {
  _id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  targetAudience: string;
  subCategory: string;
  stock: number;
  sizes: string[];
  sizeAvailability?: ProductSizeItem[];
  colors: string[];
  colorVariants?: ColorVariant[];
  images: ProductImage[];
  description: string;
  features?: string;
  material?: string;
  ageRange?: string;
  occasion?: string;
  strapType?: string;
  closureType?: string;
  shoeType?: string;
  manufacturer?: string;
  additionalInfo: Record<string, string>;
  shippingAndReturn: Record<string, string>;
  isBestSeller?: boolean;
  isTopSeller?: boolean;
  isFeatured?: boolean;
  isLatest?: boolean;
  badge?: string;
  status?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    slug?: string;
  };
}

const EMPTY_PRODUCT: ProductDetails = {
  _id: '',
  name: '',
  brand: '',
  price: 0,
  originalPrice: 0,
  rating: 5.0,
  reviewsCount: 0,
  targetAudience: '',
  subCategory: '',
  stock: 0,
  status: 'active',
  sizes: [],
  sizeAvailability: [],
  colors: [],
  colorVariants: [],
  images: [],
  description: '',
  features: '',
  material: '',
  ageRange: '',
  occasion: '',
  strapType: '',
  closureType: '',
  shoeType: '',
  manufacturer: '',
  additionalInfo: {},
  shippingAndReturn: {},
};

export default function ProductInnerPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn } = useUser();
  const productId = (params?.id as string) || 'p1';

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<ProductDetails>(EMPTY_PRODUCT);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('9');
  const [selectedColor, setSelectedColor] = useState<string>('Tan');
  const [activeHeroImage, setActiveHeroImage] = useState<string | null>(null);
  const [activeColorVariantImages, setActiveColorVariantImages] = useState<ProductImage[] | null>(null);
  const [activeColorVariantSizes, setActiveColorVariantSizes] = useState<ProductSizeItem[] | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    description: true,
    additionalInfo: false,
    shippingAndReturn: false,
  });
  const [activeTab, setActiveTab] = useState<'description' | 'features' | 'details' | 'reviews' | 'qa' | 'shipping'>('description');
  const [isSizeChartOpen, setIsSizeChartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number>(5.0);

  // Zoom feature states
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [zoomPosition, setZoomPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const mainImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${encodeURIComponent(productId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.product) {
          setProduct(data.product);

          // Find first available size
          if (Array.isArray(data.product.sizeAvailability) && data.product.sizeAvailability.length > 0) {
            const firstAvail = data.product.sizeAvailability.find((s: ProductSizeItem) => s.isAvailable);
            setSelectedSize(firstAvail ? firstAvail.size : data.product.sizeAvailability[0].size);
          } else if (data.product.sizes?.length > 0) {
            setSelectedSize(data.product.sizes[0]);
          }

          // Initialize selected color and its images/sizes
          if (Array.isArray(data.product.colorVariants) && data.product.colorVariants.length > 0) {
            const firstVariant = data.product.colorVariants[0];
            setSelectedColor(firstVariant.name);
            if (Array.isArray(firstVariant.images) && firstVariant.images.length > 0) {
              setActiveColorVariantImages(firstVariant.images);
              setSelectedImageIndex(0);
            } else if (firstVariant.imageUrl) {
              setActiveHeroImage(firstVariant.imageUrl);
            }
            if (Array.isArray(firstVariant.sizes) && firstVariant.sizes.length > 0) {
              setActiveColorVariantSizes(firstVariant.sizes);
              const firstAvailSz = firstVariant.sizes.find((s: ProductSizeItem) => s.isAvailable) || firstVariant.sizes[0];
              if (firstAvailSz) setSelectedSize(firstAvailSz.size);
            }
          } else if (data.product.colors?.length > 0) {
            setSelectedColor(data.product.colors[0]);
          }

          // ── Track product view for personalized recommendations ──
          trackEvent({
            type: 'view',
            productId: data.product._id,
            productName: data.product.name,
            colors: data.product.colors || [],
            subCategory: data.product.subCategory || '',
            targetAudience: data.product.targetAudience || '',
            price: data.product.price,
          });

          // ── Save to Recently Viewed in localStorage ──
          try {
            const existing = JSON.parse(localStorage.getItem('gravoz_recently_viewed') || '[]');
            const filtered = existing.filter((item: any) => item._id !== data.product._id);
            const updated = [
              {
                _id: data.product._id,
                name: data.product.name,
                price: data.product.price,
                originalPrice: data.product.originalPrice,
                rating: data.product.rating || 5.0,
                imageUrl: data.product.images?.[0]?.url || '/products/placeholder.svg',
                badge: data.product.badge || (data.product.isBestSeller ? 'Best Seller' : data.product.isTopSeller ? 'Top Seller' : data.product.isLatest ? 'New' : ''),
                viewedAt: Date.now(),
              },
              ...filtered,
            ].slice(0, 12);
            localStorage.setItem('gravoz_recently_viewed', JSON.stringify(updated));
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load product details:', err);
      })
      .finally(() => setLoading(false));

    // Fetch Reviews
    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
          if (data.avgRating) setAvgRating(data.avgRating);
        }
      })
      .catch(() => {});
  }, [productId]);

  // ── Dynamically update page title & meta description for SEO ──
  useEffect(() => {
    if (product?.name) {
      const pageTitle = product.seo?.metaTitle || `${product.name} | GRAVOZ Handcrafted Footwear`;
      document.title = pageTitle;
      
      const metaDescription = product.seo?.metaDescription || product.description || `Buy ${product.name} on GRAVOZ. Handcrafted comfort footwear with fast dispatch and easy returns.`;
      let metaDescEl = document.querySelector('meta[name="description"]');
      if (!metaDescEl) {
        metaDescEl = document.createElement('meta');
        metaDescEl.setAttribute('name', 'description');
        document.head.appendChild(metaDescEl);
      }
      metaDescEl.setAttribute('content', metaDescription);

      if (product.seo?.keywords?.length) {
        let metaKeywordsEl = document.querySelector('meta[name="keywords"]');
        if (!metaKeywordsEl) {
          metaKeywordsEl = document.createElement('meta');
          metaKeywordsEl.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeywordsEl);
        }
        metaKeywordsEl.setAttribute('content', product.seo.keywords.join(', '));
      }
    }
  }, [product]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current) return;
    const { left, top, width, height } = mainImageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPosition({ x, y });
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleShare = (platform: 'facebook' | 'whatsapp' | 'instagram' | 'copy') => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const text = `Check out ${product.name} on GRAVOZ: ${url}`;

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'instagram') {
      navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard! Share on Instagram.');
    } else {
      navigator.clipboard.writeText(url);
      showToast('Product link copied to clipboard!');
    }
  };

  // All images for gallery — switches to active color variant's images if available
  const displayImages = activeColorVariantImages && activeColorVariantImages.length > 0
    ? activeColorVariantImages
    : product.images && product.images.length > 0 
    ? product.images 
    : [{ url: '/products/placeholder.svg', alt: product.name || 'Product image' }];

  const activeImage = displayImages[selectedImageIndex] || displayImages[0];
  const heroPhotoUrl = activeHeroImage || activeImage?.url || '/products/placeholder.svg';

  // Color variants list
  const activeColorVariants: ColorVariant[] = 
    Array.isArray(product.colorVariants) && product.colorVariants.length > 0
      ? product.colorVariants
      : Array.isArray(product.colors) && product.colors.length > 0
      ? product.colors.map((c) => ({
          name: c,
          colorCode: 
            c.toLowerCase() === 'black' ? '#1a1a1a' :
            c.toLowerCase() === 'brown' ? '#4a2c11' :
            c.toLowerCase() === 'tan' ? '#c28b57' :
            c.toLowerCase() === 'olive' ? '#556b2f' :
            c.toLowerCase() === 'pink' ? '#f4a6b8' :
            c.toLowerCase() === 'white' ? '#f8f8f8' :
            c.toLowerCase() === 'navy' ? '#1a2a40' :
            c.toLowerCase() === 'red' ? '#dc2626' : '#4a2c11',
          imageUrl: '',
          images: [],
          isAvailable: true,
        }))
      : [];

  const handleColorSelect = (variant: ColorVariant) => {
    setSelectedColor(variant.name);

    // 1. Photos for this color
    if (Array.isArray(variant.images) && variant.images.length > 0) {
      setActiveColorVariantImages(variant.images);
      setSelectedImageIndex(0);
      setActiveHeroImage(null);
    } else if (variant.imageUrl) {
      setActiveColorVariantImages(null);
      const foundIndex = displayImages.findIndex((img) => img.url === variant.imageUrl);
      if (foundIndex >= 0) {
        setSelectedImageIndex(foundIndex);
        setActiveHeroImage(null);
      } else {
        setActiveHeroImage(variant.imageUrl);
        setSelectedImageIndex(0);
      }
    } else {
      setActiveColorVariantImages(null);
      setActiveHeroImage(null);
      setSelectedImageIndex(0);
    }

    // 2. Sizes & availability for this color
    if (Array.isArray(variant.sizes) && variant.sizes.length > 0) {
      setActiveColorVariantSizes(variant.sizes);
      const matching = variant.sizes.find((s) => s.size === selectedSize && s.isAvailable);
      if (!matching) {
        const firstAvail = variant.sizes.find((s) => s.isAvailable) || variant.sizes[0];
        if (firstAvail) setSelectedSize(firstAvail.size);
      }
    } else {
      setActiveColorVariantSizes(null);
    }

    showToast(`Color: ${variant.name}`);
  };

  // Normalized size availability array (color-specific if available, else product-level)
  const isProductInStock =
    (product.stock !== undefined ? product.stock > 0 : true) &&
    product.status !== 'inactive' &&
    product.status !== 'draft';

  const currentSizeList: ProductSizeItem[] = 
    activeColorVariantSizes && activeColorVariantSizes.length > 0
      ? activeColorVariantSizes
      : Array.isArray(product.sizeAvailability) && product.sizeAvailability.length > 0
      ? product.sizeAvailability
      : (product.sizes || []).map((s) => ({ size: s, isAvailable: isProductInStock }));

  const currentSelectedSizeObj = currentSizeList.find((s) => s.size === selectedSize);
  const isCurrentSizeAvailable = isProductInStock && (currentSelectedSizeObj ? currentSelectedSizeObj.isAvailable : true);


  return (
    <div className="min-h-screen bg-white text-[#030303] font-sans flex flex-col justify-between selection:bg-[#89591C]/20 selection:text-[#89591C]">
      {/* 1. Global Navigation Header */}
      <Header />

      {/* Loading Skeleton */}
      {loading ? (
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-6 space-y-8 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            <div className="lg:col-span-6 space-y-3">
              <div className="w-full aspect-square rounded-2xl bg-slate-100" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-16 h-16 rounded-xl bg-slate-100" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-6 space-y-4">
              <div className="h-8 bg-slate-100 rounded w-3/4" />
              <div className="h-6 bg-slate-100 rounded w-1/4" />
              <div className="h-24 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        </main>
      ) : !product._id ? (
        /* Product Not Found */
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Product Not Found</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The product you are looking for may have been removed, renamed, or is currently unpublished.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#030303] text-white text-xs font-semibold hover:bg-[#89591C] transition-colors"
          >
            Browse All Products
          </Link>
        </main>
      ) : (
        /* 2. Main Product Container (Tight, compact, fits in one screen) */
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-3 sm:py-6 space-y-8">

          {/* ── Breadcrumb Navigation (Clean Single-Line Mobile View) ── */}
          <nav className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#667085] font-poppins mb-1.5 overflow-x-auto scrollbar-none whitespace-nowrap py-1">
            <Link href="/" className="hover:text-[#171717] transition-colors whitespace-nowrap">Home</Link>
            <span className="text-[#98A2B3]">&gt;</span>
            <Link href={`/products?category=${encodeURIComponent(product.targetAudience || 'Men')}`} className="hover:text-[#171717] transition-colors whitespace-nowrap">
              {product.targetAudience || 'Men'}
            </Link>
            <span className="text-[#98A2B3]">&gt;</span>
            <Link href={`/products?subCategory=${encodeURIComponent(product.subCategory || 'Casual Shoes')}`} className="hover:text-[#171717] transition-colors whitespace-nowrap">
              {product.subCategory || 'Casual Shoes'}
            </Link>
            <span className="text-[#98A2B3]">&gt;</span>
            <span className="text-[#8B4A12] font-semibold truncate max-w-[160px] sm:max-w-xs whitespace-nowrap">{product.name}</span>
          </nav>

          {/* ── Product Split Layout (Desktop 2-Col | Mobile Stacked) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* LEFT SECTION: Main Image (Compact) + Aligned Thumbnails Below     */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-6 flex flex-col gap-3">
              
              {/* 1. Main Product Image Box with Interactive Zoom Lens & Overlays */}
              <div
                ref={mainImageRef}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
                onClick={() => setIsLightboxOpen(true)}
                className="relative w-full aspect-square max-h-[420px] sm:max-h-[450px] rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] shadow-2xs cursor-crosshair group select-none flex items-center justify-center"
              >
                {/* Product Badge: BEST SELLER */}
                {(product.badge || product.isBestSeller || product.isTopSeller || product.isLatest || true) && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 rounded-none text-[9px] font-bold uppercase tracking-wider bg-[#89591C] text-white shadow-xs">
                      {product.badge || (product.isBestSeller ? 'BEST SELLER' : product.isTopSeller ? 'TOP SELLER' : product.isLatest ? 'NEW' : 'BEST SELLER')}
                    </span>
                  </div>
                )}

                {/* Heart Wishlist Button at Top-Right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist({
                      productId: product._id,
                      title: product.name,
                      price: product.price,
                      imageUrl: displayImages[0]?.url || '/products/placeholder.svg',
                    });
                    showToast(isInWishlist(product._id) ? 'Removed from Wishlist' : 'Added to Wishlist!');
                  }}
                  title="Save to Wishlist"
                  className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xs transition-all cursor-pointer ${
                    isInWishlist(product._id) ? 'text-rose-500' : 'text-slate-700 hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist(product._id) ? 'fill-rose-500' : ''}`} />
                </button>

                {/* Previous Image Arrow */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
                    setActiveHeroImage(null);
                  }}
                  title="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-slate-800 flex items-center justify-center shadow-sm transition-all z-10 cursor-pointer opacity-90 hover:opacity-100 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Next Image Arrow */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
                    setActiveHeroImage(null);
                  }}
                  title="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-slate-800 flex items-center justify-center shadow-sm transition-all z-10 cursor-pointer opacity-90 hover:opacity-100 active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Main Product Image with Smooth Cursor Tracking Zoom */}
                <Image
                  src={heroPhotoUrl}
                  alt={activeImage?.alt || product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center transition-transform duration-100 ease-out pointer-events-none"
                  style={
                    isZooming
                      ? {
                          transform: 'scale(1.85)',
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        }
                      : {
                          transform: 'scale(1)',
                          transformOrigin: 'center center',
                        }
                  }
                />

                {/* Zoom Prompt Button at Bottom-Right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-xs text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-white transition-all cursor-pointer z-10"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
                  <span>Zoom</span>
                </button>
              </div>

              {/* 2. Compact Thumbnail Selector with Left & Right Arrow Controls */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
                    setActiveHeroImage(null);
                  }}
                  className="w-7 h-7 rounded-full border border-[#e8e2d8] hover:bg-[#faf4ec] text-slate-600 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                  title="Previous thumbnail"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none flex-1">
                  {displayImages.map((img, idx) => {
                    const isCurrent = (activeHeroImage === null && selectedImageIndex === idx) || activeHeroImage === img.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedImageIndex(idx);
                          setActiveHeroImage(null);
                        }}
                        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#f4f2ee] transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-2 border-[#89591C] ring-2 ring-[#89591C]/20 scale-105 shadow-xs'
                            : 'border border-[#e8e2d8] opacity-75 hover:opacity-100 hover:border-slate-400'
                        }`}
                      >
                        <Image
                          src={img.url}
                          alt={img.alt || `Photo ${idx + 1}`}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedImageIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
                    setActiveHeroImage(null);
                  }}
                  className="w-7 h-7 rounded-full border border-[#e8e2d8] hover:bg-[#faf4ec] text-slate-600 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                  title="Next thumbnail"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>


            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* RIGHT SECTION: Info, Pricing, Sizes, Options, Actions & Buy       */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-6 flex flex-col gap-4 font-poppins">

              {/* Product Title + Star Rating (H4 Medium 20px / 28px) */}
              <div className="space-y-1">
                <h1 className="text-[20px] sm:text-[22px] font-medium text-[#111111] tracking-[0.02em] uppercase leading-[28px]">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-[#8A5B2A] fill-[#8A5B2A]" strokeWidth={1.5} />
                    ))}
                  </div>
                  <span className="text-[13px] text-[#555555] font-normal">
                    4.6 ({product.reviewsCount || 128} reviews)
                  </span>
                </div>
              </div>

              {/* Price Line (Price 28–32px SemiBold 600) */}
              <div className="flex items-center justify-between border-b border-[#E5E1DC] pb-3">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[28px] sm:text-[32px] font-semibold text-[#111111] leading-[36px]">
                    ₹{product.price}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-[16px] text-[#888888] line-through">
                      ₹{product.originalPrice}
                    </span>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-[12px] font-medium text-[#22C55E] bg-[#E8F8EE] px-2 py-0.5 rounded">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  )}
                </div>

                {/* Wishlist Pill */}
                <button
                  type="button"
                  onClick={() => {
                    toggleWishlist({
                      productId: product._id,
                      title: product.name,
                      price: product.price,
                      imageUrl: displayImages[0]?.url || '/products/placeholder.svg',
                    });
                    showToast(isInWishlist(product._id) ? 'Removed from Wishlist' : 'Added to Wishlist!');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all cursor-pointer ${
                    isInWishlist(product._id)
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-white border-[#E5E1DC] text-[#555555] hover:border-[#8A5B2A] hover:text-[#8A5B2A]'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isInWishlist(product._id) ? 'fill-rose-500 text-rose-500' : ''}`} strokeWidth={1.5} />
                  <span>{isInWishlist(product._id) ? 'Saved' : 'Wishlist'}</span>
                </button>
              </div>

              {/* Subtitle / Leather tag */}
              <div className="text-[14px] text-[#555555]">
                <span>{product.material || 'Genuine Full Grain Leather'}</span>
              </div>

              {/* Select a size section + Size Chart Link */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[14px] font-medium text-[#111111] block">
                    Select a size :
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSizeChartOpen(true)}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-[#8A5B2A] hover:underline cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5 text-[#8A5B2A]" strokeWidth={1.5} /> Size Chart
                  </button>
                </div>

                {/* Size Buttons Row (Style Guide rounded-md border) */}
                <div className="flex flex-wrap items-center gap-2">
                  {currentSizeList.map((item) => {
                    const isSelected = selectedSize === item.size;
                    const isAvailable = item.isAvailable;

                    if (!isAvailable) {
                      return (
                        <button
                          key={item.size}
                          type="button"
                          disabled={true}
                          onClick={() => showToast(`Size ${item.size} is currently out of stock.`)}
                          title={`Size ${item.size} is Out of Stock`}
                          className="relative w-10 h-10 rounded-md border border-slate-200 bg-[#FAF7F3] text-slate-300 flex items-center justify-center text-[13px] font-normal cursor-not-allowed select-none line-through opacity-60"
                        >
                          {item.size}
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="w-full h-px bg-slate-300 rotate-45 transform" />
                          </span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={item.size}
                        type="button"
                        onClick={() => setSelectedSize(item.size)}
                        className={`w-10 h-10 rounded-md border flex items-center justify-center text-[14px] transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#111111] bg-white text-[#111111] font-semibold ring-1 ring-[#111111] shadow-2xs'
                            : 'border-[#E5E1DC] bg-white text-[#111111] font-normal hover:border-[#111111]'
                        }`}
                      >
                        {item.size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Low Stock / Out of Stock Availability Indicator */}
              {(!isProductInStock || (product.stock !== undefined && product.stock <= 0)) ? (
                <div className="inline-flex items-center gap-2 text-[12px] font-semibold rounded-lg px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Out of Stock</span>
                </div>
              ) : product.stock !== undefined && product.stock > 0 && product.stock <= 5 ? (
                <div className={`inline-flex items-center gap-2 text-[12px] font-semibold rounded-lg px-3.5 py-2 shadow-2xs ${
                  product.stock <= 3
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-amber-50 border border-amber-200 text-amber-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${
                    product.stock <= 3 ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <span>
                    {product.stock === 1 && 'Hurry! 1 left in stock!'}
                    {product.stock === 2 && 'Hurry! 2 left in stock!'}
                    {product.stock === 3 && 'Hurry! 3 left in stock!'}
                    {product.stock === 4 && 'Only 4 available'}
                    {product.stock === 5 && 'Only 5 available'}
                  </span>
                </div>
              ) : null}

              {/* Options : Color Swatches Row */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <label className="text-[14px] font-medium text-[#111111]">
                    Options :
                  </label>
                  <span className="text-[14px] font-medium text-[#8A5B2A]">{selectedColor}</span>
                  <span className="text-[12px] text-[#888888]">({activeColorVariants.length} Colors)</span>
                </div>
                <div className="flex items-center gap-3">
                  {activeColorVariants.map((variant) => {
                    const isSelected = selectedColor.toLowerCase() === variant.name.toLowerCase();
                    return (
                      <button
                        key={variant.name}
                        type="button"
                        onClick={() => handleColorSelect(variant)}
                        title={`Color: ${variant.name}`}
                        className={`relative w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'ring-2 ring-[#111111] ring-offset-2 scale-110 shadow-xs'
                            : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                      >
                        <span
                          className="w-full h-full rounded-full border border-black/15 shadow-inner"
                          style={{ backgroundColor: variant.colorCode || '#1a1a1a' }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons Row: Quantity Pill + ADD TO CART (Primary) + BUY NOW (Outline) */}
              <div className="space-y-3 pt-2 font-poppins">
                
                {/* Quantity Selector Pill: < 1 > */}
                <div className={`flex items-center justify-between w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#E8E1D9] text-[#171717] ${
                  !isCurrentSizeAvailable ? 'opacity-60 pointer-events-none' : ''
                }`}>
                  <button
                    type="button"
                    disabled={!isCurrentSizeAvailable}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="text-[#667085] hover:text-[#171717] font-bold text-base px-2 py-1 cursor-pointer transition-colors"
                  >
                    &lt;
                  </button>
                  <span className="text-[15px] font-semibold select-none">{isCurrentSizeAvailable ? quantity : 0}</span>
                  <button
                    type="button"
                    disabled={!isCurrentSizeAvailable}
                    onClick={() => setQuantity((q) => Math.min(product.stock || 10, q + 1))}
                    aria-label="Increase quantity"
                    className="text-[#667085] hover:text-[#171717] font-bold text-base px-2 py-1 cursor-pointer transition-colors"
                  >
                    &gt;
                  </button>
                </div>

                {/* ADD TO CART Button (Primary Button: #8B4A12) */}
                <button
                  type="button"
                  disabled={!isCurrentSizeAvailable}
                  onClick={async () => {
                    if (!isCurrentSizeAvailable) {
                      showToast(
                        !isProductInStock
                          ? 'This product is currently out of stock.'
                          : 'Please choose an available size.'
                      );
                      return;
                    }
                    await addToCart({
                      productId: product._id,
                      title: product.name,
                      price: product.price,
                      originalPrice: product.originalPrice,
                      size: selectedSize,
                      quantity: quantity,
                      imageUrl: heroPhotoUrl,
                      color: selectedColor,
                    });
                    showToast(`Added ${quantity} × ${product.name} (${selectedColor} / Size ${selectedSize}) to Bag!`);
                  }}
                  className={`w-full h-[46px] sm:h-[48px] px-6 rounded-[10px] text-white text-[13px] sm:text-[14px] font-semibold uppercase tracking-wider shadow-xs transition-all flex items-center justify-center cursor-pointer ${
                    isCurrentSizeAvailable
                      ? 'bg-[#8B4A12] hover:bg-[#6F390C]'
                      : 'bg-[#E8E1D9] text-[#98A2B3] cursor-not-allowed'
                  }`}
                >
                  {!isProductInStock || (product.stock !== undefined && product.stock <= 0)
                    ? 'OUT OF STOCK'
                    : isCurrentSizeAvailable
                    ? 'ADD TO CART'
                    : 'SIZE OUT OF STOCK'}
                </button>

                {/* BUY NOW Button (Outline Button: border #8B4A12 text #8B4A12) */}
                <button
                  type="button"
                  disabled={!isCurrentSizeAvailable}
                  onClick={async () => {
                    if (!isCurrentSizeAvailable) {
                      showToast(
                        !isProductInStock
                          ? 'This product is currently out of stock.'
                          : 'Please choose an available size.'
                      );
                      return;
                    }
                    await addToCart({
                      productId: product._id,
                      title: product.name,
                      price: product.price,
                      originalPrice: product.originalPrice,
                      size: selectedSize,
                      quantity: quantity,
                      imageUrl: displayImages[0]?.url || '/products/placeholder.svg',
                      color: selectedColor || product.colors?.[0] || 'Tan',
                    });

                    if (!isLoggedIn) {
                      showToast('Please sign in to complete your purchase.');
                      setTimeout(() => {
                        router.push('/login?redirect=/cart');
                      }, 700);
                      return;
                    }

                    showToast(`Proceeding to checkout for ${product.name} (Size: ${selectedSize})...`);
                    router.push('/checkout');
                  }}
                  className={`w-full h-[46px] sm:h-[48px] px-6 rounded-[10px] text-[13px] sm:text-[14px] font-semibold uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer border ${
                    isCurrentSizeAvailable
                      ? 'border-[#8B4A12] text-[#8B4A12] bg-white hover:bg-[#FCF8F3]'
                      : 'border-[#E8E1D9] text-[#98A2B3] bg-[#FCFAF7] cursor-not-allowed'
                  }`}
                >
                  {!isProductInStock || (product.stock !== undefined && product.stock <= 0)
                    ? 'OUT OF STOCK'
                    : 'BUY NOW'}
                </button>
              </div>

              {/* Share Row */}
              <div className="flex items-center gap-2.5 pt-1">
                <span className="text-[13px] font-medium text-[#555555]">Share:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleShare('facebook')}
                    aria-label="Share on Facebook"
                    className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                  >
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare('instagram')}
                    aria-label="Share on Instagram"
                    className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                  >
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare('whatsapp')}
                    aria-label="Share on WhatsApp"
                    className="w-6 h-6 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                  >
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* HORIZONTAL PRODUCT TABS (Matches Brand Style Guide v1.0)        */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <section className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E5E1DC] shadow-2xs">
            {/* Tabs Header Bar */}
            <div className="border-b border-[#E5E1DC] flex items-center gap-6 sm:gap-8 overflow-x-auto scrollbar-none text-[14px]">
              <button
                type="button"
                onClick={() => setActiveTab('description')}
                className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'description'
                    ? 'border-[#8A5B2A] text-[#8A5B2A] font-medium'
                    : 'border-transparent text-[#555555] font-normal hover:text-[#111111]'
                }`}
              >
                Description
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('features')}
                className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'features'
                    ? 'border-[#8A5B2A] text-[#8A5B2A] font-medium'
                    : 'border-transparent text-[#555555] font-normal hover:text-[#111111]'
                }`}
              >
                Features
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'details'
                    ? 'border-[#8A5B2A] text-[#8A5B2A] font-medium'
                    : 'border-transparent text-[#555555] font-normal hover:text-[#111111]'
                }`}
              >
                Product Details
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'border-[#8A5B2A] text-[#8A5B2A] font-medium'
                    : 'border-transparent text-[#555555] font-normal hover:text-[#111111]'
                }`}
              >
                Reviews ({reviews.length || 128})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('qa')}
                className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'qa'
                    ? 'border-[#8A5B2A] text-[#8A5B2A] font-medium'
                    : 'border-transparent text-[#555555] font-normal hover:text-[#111111]'
                }`}
              >
                Q&amp;A (58)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('shipping')}
                className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'shipping'
                    ? 'border-[#8A5B2A] text-[#8A5B2A] font-medium'
                    : 'border-transparent text-[#555555] font-normal hover:text-[#111111]'
                }`}
              >
                Shipping &amp; Returns
              </button>
            </div>

            {/* Tab Contents */}
            <div className="pt-6 font-poppins text-[14px] leading-[24px] text-[#555555]">
              {/* 1. Description Tab */}
              {activeTab === 'description' && (
                <div className="space-y-4 max-w-4xl">
                  <p className="text-[#555555] leading-[24px]">
                    {product.description ||
                      'Crafted from premium full grain leather, this casual shoe is designed for everyday comfort and timeless style. The soft interior and durable sole provide all-day support, making it perfect for both casual outings and smart casual occasions.'}
                  </p>
                  <ul className="space-y-2 text-[#555555]">
                    {(product.features && product.features.trim()
                      ? product.features.split('\n').filter(Boolean)
                      : [
                          'Premium Full Grain Leather Upper',
                          'Soft & Breathable Inner Lining',
                          'Durable & Non-Slip PU Sole',
                          'Comfortable Cushion Insole',
                          'Lightweight & Flexible Design',
                        ]
                    ).map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8A5B2A] flex-shrink-0" />
                        <span>{item.replace(/^[•\-*]\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 2. Features Tab */}
              {activeTab === 'features' && (
                <div className="space-y-4 max-w-4xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-[#FAF7F3] border border-[#E5E1DC]">
                      <h4 className="font-medium text-[14px] text-[#111111] uppercase tracking-wider mb-1">Premium Leather</h4>
                      <p className="text-[13px] text-[#555555]">Selected authentic leather with smooth finish and high durability.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAF7F3] border border-[#E5E1DC]">
                      <h4 className="font-medium text-[14px] text-[#111111] uppercase tracking-wider mb-1">Orthopedic Insole</h4>
                      <p className="text-[13px] text-[#555555]">Memory foam cushioning engineered for pressure relief and heel stability.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAF7F3] border border-[#E5E1DC]">
                      <h4 className="font-medium text-[14px] text-[#111111] uppercase tracking-wider mb-1">Anti-Skid Sole</h4>
                      <p className="text-[13px] text-[#555555]">Flexible slip-resistant outsole providing superior grip on all surfaces.</p>
                    </div>
                  </div>
                  {product.features && (
                    <ul className="space-y-2 text-[#555555] pt-2">
                      {product.features.split('\n').filter(Boolean).map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8A5B2A] flex-shrink-0" />
                          <span>{feat.replace(/^[•\-*]\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* 3. Product Details Tab (Specifications Table) */}
              {activeTab === 'details' && (
                <div className="max-w-3xl">
                  <div className="bg-[#FAF7F3] border border-[#E5E1DC] rounded-xl overflow-hidden divide-y divide-[#E5E1DC]">
                    {[
                      { label: 'Material', value: product.material || 'Genuine Artisan Leather' },
                      { label: 'Occasion', value: product.occasion || 'Casual & Daily Wear' },
                      { label: 'Closure Type', value: product.closureType || 'Slip-On' },
                      { label: 'Strap Type', value: product.strapType || 'No Strap' },
                      { label: 'Shoe Type', value: product.shoeType || product.subCategory || 'Casual Shoes' },
                      { label: 'Target Gender', value: product.targetAudience || 'Men' },
                      { label: 'Age Range', value: product.ageRange || 'Adults' },
                      { label: 'Manufacturer', value: product.manufacturer || 'GRAVOZ Artisans Pvt. Ltd.' },
                      { label: 'Country of Origin', value: 'India (Handcrafted)' },
                      { label: 'Care Instructions', value: 'Wipe clean with a soft dry cloth.' },
                    ].map((row) => (
                      <div key={row.label} className="grid grid-cols-3 px-4 py-3">
                        <span className="text-[14px] text-[#555555] font-normal">{row.label}</span>
                        <span className="col-span-2 text-[14px] text-[#111111] font-medium">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-[#8A5B2A] fill-[#8A5B2A]" strokeWidth={1.5} />
                      ))}
                    </div>
                    <span className="font-medium text-[#111111] text-[16px]">{avgRating} out of 5</span>
                    <span className="text-[13px] text-[#888888]">({reviews.length || 128} verified customer ratings)</span>
                  </div>
                  {/* Reviews cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(reviews.length > 0 ? reviews : [
                      { customerName: 'Hashim', comment: 'The quality is exceptional, and the shoes feel incredibly comfortable from the first wear. The craftsmanship and finish are truly impressive.', rating: 5 },
                      { customerName: 'Lakshmi', comment: 'Gravoz has the perfect balance of premium style and comfort. The leather feels luxurious, and the fit is excellent.', rating: 5 },
                    ]).map((r: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-white border border-[#E5E1DC] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[14px] text-[#111111]">{r.customerName}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 text-[#8A5B2A] fill-[#8A5B2A]" strokeWidth={1.5} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[13px] text-[#555555] italic">“{r.comment}”</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Q&A Tab */}
              {activeTab === 'qa' && (
                <div className="space-y-3.5 max-w-4xl">
                  {[
                    { q: 'Is this shoe made of 100% genuine leather?', a: 'Yes, crafted from premium authentic full-grain leather that molds comfortably to your feet over time.' },
                    { q: 'What is the return policy if the size does not fit?', a: 'We offer a 7-day hassle-free doorstep replacement or refund policy. Free pickup from your address.' },
                    { q: 'Are these shoes suitable for everyday walking?', a: 'Absolutely. Engineered with an orthopedic dual-density footbed and flexible anti-skid TPR sole for all-day comfort.' },
                    { q: 'How should I clean and maintain the leather?', a: 'Simply wipe down with a soft, clean dry or slightly damp cloth. Use neutral leather cream periodically.' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#FAF7F3] border border-[#E5E1DC] space-y-1">
                      <h4 className="font-medium text-[14px] text-[#111111] flex items-center gap-1.5">
                        <span className="text-[#8A5B2A] font-semibold">Q:</span> {item.q}
                      </h4>
                      <p className="text-[13px] text-[#555555] pl-4">
                        <span className="font-medium text-[#22C55E]">A:</span> {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 6. Shipping & Returns Tab */}
              {activeTab === 'shipping' && (
                <div className="space-y-3 max-w-4xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-[#FAF7F3] border border-[#E5E1DC] space-y-1">
                      <div className="flex items-center gap-2 text-[#111111] font-medium text-[14px]">
                        <Truck className="w-4 h-4 text-[#8A5B2A]" strokeWidth={1.5} />
                        <span>Complimentary Express Shipping</span>
                      </div>
                      <p className="text-[13px] text-[#555555]">Free delivery across all pin codes in India. Metro cities delivered within 2-4 business days.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAF7F3] border border-[#E5E1DC] space-y-1">
                      <div className="flex items-center gap-2 text-[#111111] font-medium text-[14px]">
                        <RotateCcw className="w-4 h-4 text-[#8A5B2A]" strokeWidth={1.5} />
                        <span>7-Day Hassle-Free Returns</span>
                      </div>
                      <p className="text-[13px] text-[#555555]">Doorstep pickup and instant exchange if size or fit is not ideal.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAF7F3] border border-[#E5E1DC] space-y-1">
                      <div className="flex items-center gap-2 text-[#111111] font-medium text-[14px]">
                        <ShieldCheck className="w-4 h-4 text-[#8A5B2A]" strokeWidth={1.5} />
                        <span>6-Month Manufacturing Warranty</span>
                      </div>
                      <p className="text-[13px] text-[#555555]">Covers sole adhesion, stitching, and artisan leather construction.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAF7F3] border border-[#E5E1DC] space-y-1">
                      <div className="flex items-center gap-2 text-[#111111] font-medium text-[14px]">
                        <Check className="w-4 h-4 text-[#8A5B2A]" strokeWidth={1.5} />
                        <span>COD &amp; Secure Prepaid</span>
                      </div>
                      <p className="text-[13px] text-[#555555]">Pay securely via UPI, Cards, Net Banking, or Cash on Delivery.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>




        {/* ── Personalized Recommendation Strip ── */}
        <div className="pt-6 sm:pt-8 border-t border-[#f0ece5]">
          <RecommendationStrip
            excludeIds={[productId]}
            limit={6}
          />
        </div>




        {/* ── Customer Reviews & Testimonials ── */}
        <section className="space-y-6 pt-4 pb-2">
          {/* Header Title & Subtitle */}
          <div className="text-center space-y-1">
            <h2 className="font-sansation font-bold text-2xl sm:text-3xl text-[#030303] tracking-tight">
              Customer Reviews & Feedback
            </h2>
            <p className="font-sansation font-normal text-xs sm:text-sm text-slate-600 tracking-[0.1em]">
              {reviews.length > 0 ? `${reviews.length} Verified Reviews (${avgRating} / 5.0)` : 'Verified Customer Testimonials'}
            </p>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto">
              {reviews.map((rev) => (
                <div key={rev._id} className="bg-white border border-[#e8e2d8] rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#89591C] text-white font-bold text-xs flex items-center justify-center shadow-2xs flex-shrink-0">
                        {rev.customerName ? rev.customerName.substring(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="font-sansation font-bold text-sm text-[#030303]">
                          {rev.customerName}
                        </h4>
                        <span className="font-sansation text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Purchase
                        </span>
                      </div>
                    </div>
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? 'text-[#C19968] fill-[#C19968]'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="font-sansation text-xs sm:text-[13px] leading-relaxed text-slate-700">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  )}

                  {/* Review Photos / Videos */}
                  {((rev.images && rev.images.length > 0) || (rev.videos && rev.videos.length > 0)) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {rev.images?.map((imgUrl: string, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveHeroImage(imgUrl);
                            setIsLightboxOpen(true);
                          }}
                          className="w-14 h-14 rounded-xl border border-[#e8e2d8] overflow-hidden bg-[#faf8f5] cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <Image src={imgUrl} alt="Review attachment" width={56} height={56} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {rev.videos?.map((vidUrl: string, idx: number) => (
                        <div key={idx} className="w-14 h-14 rounded-xl border border-[#e8e2d8] overflow-hidden bg-black flex items-center justify-center">
                          <video src={vidUrl} className="w-full h-full object-cover" controls />
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 font-sansation block pt-1">
                    Reviewed on {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Fallback Curated Testimonials */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto">
              {/* Card 1 — Hashim */}
              <div className="bg-white border border-[#e8e2d8] rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-red-500 p-0.5 flex-shrink-0 flex items-center justify-center shadow-xs">
                      <div className="w-full h-full rounded-full bg-[#fceddc] flex items-center justify-center text-base">
                        🧑‍💼
                      </div>
                    </div>
                    <div>
                      <h4 className="font-sansation font-bold text-sm text-[#030303]">
                        Hashim
                      </h4>
                      <span className="font-sansation text-[11px] text-slate-400 block font-normal">
                        Verified User
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
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
              <div className="bg-white border border-[#e8e2d8] rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-amber-300 to-yellow-500 p-0.5 flex-shrink-0 flex items-center justify-center shadow-xs">
                      <div className="w-full h-full rounded-full bg-[#fef7ee] flex items-center justify-center text-base">
                        👩‍💼
                      </div>
                    </div>
                    <div>
                      <h4 className="font-sansation font-bold text-sm text-[#030303]">
                        lakshmi
                      </h4>
                      <span className="font-sansation text-[11px] text-slate-400 block font-normal">
                        Verified User
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
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
          )}

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-5 h-1.5 rounded-full bg-slate-600"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          </div>
        </section>

      </main>
      )}

      {/* 3. Rich Premium Footer Section */}
      <Footer />

      {/* ── SIZE CHART MODAL ── */}
      {isSizeChartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl border border-[#e8e2d8] relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsSizeChartOpen(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Ruler className="w-4 h-4 text-[#89591C]" />
              <h3 className="text-base sm:text-lg font-bold text-[#030303]">GRAVOZ Footwear Size Guide</h3>
            </div>

            <p className="mt-1.5 text-xs text-slate-500 font-sansation">
              Measure your foot from heel to longest toe in centimeters to find your ideal fit.
            </p>

            <div className="mt-3.5 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#faf8f5] text-slate-700 border-b border-[#e8e2d8]">
                    <th className="py-2 px-2.5 font-semibold">UK / India</th>
                    <th className="py-2 px-2.5 font-semibold">EU Size</th>
                    <th className="py-2 px-2.5 font-semibold">US Men</th>
                    <th className="py-2 px-2.5 font-semibold">Length (CM)</th>
                    <th className="py-2 px-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sansation">
                  {[
                    { uk: '4', eu: '37', us: '5.0', cm: '23.5 cm' },
                    { uk: '5', eu: '38', us: '6.0', cm: '24.2 cm' },
                    { uk: '6', eu: '39-40', us: '7.0', cm: '25.0 cm' },
                    { uk: '7', eu: '41', us: '8.0', cm: '25.8 cm' },
                    { uk: '8', eu: '42', us: '9.0', cm: '26.6 cm' },
                    { uk: '9', eu: '43', us: '10.0', cm: '27.4 cm' },
                    { uk: '10', eu: '44', us: '11.0', cm: '28.2 cm' },
                  ].map((row) => {
                    const matchItem = currentSizeList.find((s) => s.size === row.uk);
                    const isAvail = matchItem ? matchItem.isAvailable : true;
                    return (
                      <tr
                        key={row.uk}
                        className={selectedSize === row.uk ? 'bg-[#89591C]/10 font-bold text-[#89591C]' : 'hover:bg-slate-50'}
                      >
                        <td className="py-1.5 px-2.5">{row.uk}</td>
                        <td className="py-1.5 px-2.5">{row.eu}</td>
                        <td className="py-1.5 px-2.5">{row.us}</td>
                        <td className="py-1.5 px-2.5">{row.cm}</td>
                        <td className="py-1.5 px-2.5">
                          {isAvail ? (
                            <span className="text-emerald-700 text-[11px] font-semibold">Available</span>
                          ) : (
                            <span className="text-rose-500 text-[11px] font-medium line-through">Out of stock</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSizeChartOpen(false)}
                className="px-4 py-1.5 rounded-full bg-[#030303] text-white text-xs font-semibold hover:bg-[#89591C] transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN LIGHTBOX ── */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close fullscreen view"
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/20 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all cursor-pointer z-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] w-full h-[70vh] rounded-2xl overflow-hidden shadow-2xl"
          >
            <Image
              src={activeImage?.url || '/products/placeholder.svg'}
              alt={activeImage?.alt || product.name}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#030303] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 border border-white/20 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-5 h-5 rounded-full bg-[#89591C] flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
