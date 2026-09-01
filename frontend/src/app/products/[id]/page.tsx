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
  additionalInfo: Record<string, string>;
  shippingAndReturn: Record<string, string>;
  isBestSeller?: boolean;
  isTopSeller?: boolean;
  isFeatured?: boolean;
  isLatest?: boolean;
  badge?: string;
}

const DEFAULT_PRODUCT: ProductDetails = {
  _id: 'p1',
  name: "Men's Casual Comfort Sandals – Tan",
  brand: 'Gravoz',
  price: 1399,
  originalPrice: 1429,
  rating: 5.0,
  reviewsCount: 94,
  targetAudience: 'Men',
  subCategory: 'Casual Sandals',
  stock: 45,
  sizes: ['5', '4', '6', '7', '9', '10'],
  sizeAvailability: [
    { size: '5', isAvailable: true, stock: 12 },
    { size: '4', isAvailable: true, stock: 8 },
    { size: '6', isAvailable: true, stock: 15 },
    { size: '7', isAvailable: true, stock: 8 },
    { size: '9', isAvailable: true, stock: 6 },
    { size: '10', isAvailable: true, stock: 5 },
  ],
  colors: ['Tan', 'Brown', 'Black'],
  colorVariants: [
    { name: 'Tan', colorCode: '#c28b57', imageUrl: '/products/product2.webp', isAvailable: true },
    { name: 'Brown', colorCode: '#4a2c11', imageUrl: '/products/product3.webp', isAvailable: true },
    { name: 'Black', colorCode: '#1a1a1a', imageUrl: '/products/product1.webp', isAvailable: true },
    { name: 'Olive', colorCode: '#556b2f', imageUrl: '/products/product4.webp', isAvailable: true },
  ],
  images: [
    { url: '/products/product2.webp', alt: "Men's Casual Comfort Sandals – Tan Front View" },
    { url: '/products/product3.webp', alt: "Men's Casual Comfort Sandals – Angle View" },
    { url: '/products/product1.webp', alt: "Men's Casual Comfort Sandals – Side Profile" },
    { url: '/products/product4.webp', alt: "Men's Casual Comfort Sandals – Top Footbed" },
    { url: '/products/p1.webp', alt: "Men's Casual Comfort Sandals – Lifestyle Look" },
  ],
  description: `Experience unparalleled everyday luxury with the GRAVOZ Men's Casual Comfort Sandals in classic Tan. Handcrafted from premium-grade artisan leather with precision stitching, these sandals feature an anatomically molded ergonomic footbed designed to provide maximum shock absorption, arch support, and breathability all day long.`,
  additionalInfo: {
    'Material': '100% Genuine Artisan Finished Leather',
    'Sole Material': 'Ultra-Grip Anti-Skid Thermoplastic Rubber (TPR)',
    'Closure': 'Adjustable Ergonomic Hook & Loop Strap',
    'Insole': 'Cushioned Orthopedic Memory Foam Footbed',
    'Country of Origin': 'India (Handcrafted)',
    'Care Instructions': 'Wipe clean with a soft dry cloth. Use neutral leather conditioner periodically.',
  },
  shippingAndReturn: {
    'Free Delivery': 'Complimentary standard express shipping across India on all prepaid & COD orders.',
    'Estimated Delivery': '2 to 4 business days to metro cities; 4 to 6 days to rest of India.',
    'Easy Returns & Exchanges': '7-day hassle-free return and exchange policy with doorstep pickup.',
    'Warranty': '6-month comprehensive manufacturing warranty covering stitching & sole adhesion.',
  },
};

const RELATED_PRODUCTS = [
  { id: 'p1', title: "Men's Casual Comfort Sandals – Black", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product1.webp' },
  { id: 'p2', title: "Men's Casual Comfort Sandals – Tan", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product2.webp' },
  { id: 'p3', title: "Men's Casual Comfort Sandals – Brown", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product3.webp' },
  { id: 'p4', title: "Men's Casual Comfort Sandals – Olive", price: 1399, originalPrice: 1429, rating: 5.0, imageUrl: '/products/product4.webp' },
];

export default function ProductInnerPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn } = useUser();
  const productId = (params?.id as string) || 'p1';

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<ProductDetails>(DEFAULT_PRODUCT);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('9');
  const [selectedColor, setSelectedColor] = useState<string>('Tan');
  const [activeHeroImage, setActiveHeroImage] = useState<string | null>(null);
  const [activeColorVariantImages, setActiveColorVariantImages] = useState<ProductImage[] | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    description: true,
    additionalInfo: false,
    shippingAndReturn: false,
  });
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

          // Initialize selected color and its images
          if (Array.isArray(data.product.colorVariants) && data.product.colorVariants.length > 0) {
            const firstVariant = data.product.colorVariants[0];
            setSelectedColor(firstVariant.name);
            if (Array.isArray(firstVariant.images) && firstVariant.images.length > 0) {
              setActiveColorVariantImages(firstVariant.images);
              setSelectedImageIndex(0);
            } else if (firstVariant.imageUrl) {
              setActiveHeroImage(firstVariant.imageUrl);
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
                imageUrl: data.product.images?.[0]?.url || '/products/product1.webp',
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

  // Up to 6 images for gallery — switches to active color variant's images if available
  const displayImages = activeColorVariantImages && activeColorVariantImages.length > 0
    ? activeColorVariantImages
    : product.images && product.images.length > 0 
    ? product.images.slice(0, 6) 
    : [
        { url: '/products/product2.webp', alt: 'Main view' },
        { url: '/products/product3.webp', alt: 'Angle view' },
        { url: '/products/product1.webp', alt: 'Side view' },
        { url: '/products/product4.webp', alt: 'Top view' },
      ];

  const activeImage = displayImages[selectedImageIndex] || displayImages[0];
  const heroPhotoUrl = activeHeroImage || activeImage?.url || '/products/product2.webp';

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
      : [
          { name: 'Tan', colorCode: '#c28b57', imageUrl: '/products/product2.webp', isAvailable: true },
          { name: 'Brown', colorCode: '#4a2c11', imageUrl: '/products/product3.webp', isAvailable: true },
          { name: 'Black', colorCode: '#1a1a1a', imageUrl: '/products/product1.webp', isAvailable: true },
        ];

  const handleColorSelect = (variant: ColorVariant) => {
    setSelectedColor(variant.name);

    // If color variant has a full gallery of 1 to 5 images:
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
    showToast(`Color selected: ${variant.name}`);
  };

  // Normalized size availability array
  const currentSizeList: ProductSizeItem[] = 
    Array.isArray(product.sizeAvailability) && product.sizeAvailability.length > 0
      ? product.sizeAvailability
      : product.sizes.map((s) => ({ size: s, isAvailable: true }));

  const currentSelectedSizeObj = currentSizeList.find((s) => s.size === selectedSize);
  const isCurrentSizeAvailable = currentSelectedSizeObj ? currentSelectedSizeObj.isAvailable : true;

  return (
    <div className="min-h-screen bg-white text-[#030303] font-sans flex flex-col justify-between selection:bg-[#89591C]/20 selection:text-[#89591C]">
      {/* 1. Global Navigation Header */}
      <Header />

      {/* 2. Main Product Container (Tight, compact, fits in one screen) */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-3 sm:py-6 space-y-8">

        {/* ── Product Split Layout (Desktop 2-Col | Mobile Stacked) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* LEFT SECTION: Main Image (Compact) + Aligned Thumbnails Below     */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            
            {/* 1. Main Product Image Box with Interactive Zoom Lens */}
            <div
              ref={mainImageRef}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setIsLightboxOpen(true)}
              className="relative w-full aspect-square max-h-[420px] sm:max-h-[450px] rounded-2xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] shadow-2xs cursor-crosshair group select-none flex items-center justify-center"
            >
              {/* Product Badge */}
              {(product.badge || product.isBestSeller || product.isTopSeller || product.isLatest) && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#89591C] text-white shadow-xs">
                    {product.badge || (product.isBestSeller ? 'Best Seller' : product.isTopSeller ? 'Top Seller' : 'New')}
                  </span>
                </div>
              )}

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

              {/* Zoom Prompt Pill */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Hover to Zoom</span>
              </div>
            </div>

            {/* 2. Compact Thumbnail Selector */}
            <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none">
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
          </div>


          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* RIGHT SECTION: Info, Sizes, Options, Actions & Accordions       */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 flex flex-col gap-4 font-sansation">

            {/* Product Title + Star Rating */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-[#030303] tracking-tight font-sansation">
                {product.name}
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-[#C19968] fill-[#C19968]" />
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  ({product.reviewsCount} verified reviews)
                </span>
              </div>
            </div>

            {/* Price Line + Wishlist Button */}
            <div className="flex items-center justify-between border-b border-[#e8e2d8] pb-3">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-bold text-[#030303]">
                  ₹{product.price}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm sm:text-base text-slate-400 line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
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
                    imageUrl: displayImages[0]?.url || '/products/product1.webp',
                  });
                  showToast(isInWishlist(product._id) ? 'Removed from Wishlist' : 'Added to Wishlist!');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  isInWishlist(product._id)
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-[#e8e2d8] text-slate-700 hover:border-slate-400'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isInWishlist(product._id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{isInWishlist(product._id) ? 'Saved' : 'Wishlist'}</span>
              </button>
            </div>

            {/* Select a size section + Size Chart Link */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-medium text-slate-800 block">
                  Select a size :
                </label>
                <button
                  type="button"
                  onClick={() => setIsSizeChartOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#89591C] hover:underline cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" /> Size Chart
                </button>
              </div>

              {/* Size Buttons Row: 5, 4, 6, 7, 9, 10 */}
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
                        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-none border border-slate-200 bg-[#faf8f5] text-slate-300 flex items-center justify-center text-xs sm:text-sm font-normal cursor-not-allowed select-none line-through opacity-60 group"
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
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-none border flex items-center justify-center text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#030303] bg-white text-[#030303] shadow-xs ring-1 ring-[#030303]'
                          : 'border-slate-300 bg-white text-slate-800 hover:border-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Low Stock Availability Indicator */}
            {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
              <div className={`flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 ${
                product.stock <= 2
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0 ${
                  product.stock <= 2 ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
                {product.stock === 1 && 'Only 1 available — order now!'}
                {product.stock === 2 && 'Only 2 available — selling fast!'}
                {product.stock === 3 && 'Only 3 left in stock'}
                {product.stock === 4 && 'Only 4 left in stock'}
                {product.stock === 5 && 'Only 5 left in stock'}
              </div>
            )}

            {/* Options : Color Swatches Row (Matching User Request) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-800">
                  Options :
                </label>
                <span className="text-xs font-bold text-[#89591C]">{selectedColor}</span>
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
                          ? 'ring-2 ring-[#030303] ring-offset-2 scale-110 shadow-xs'
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

            {/* Row: Quantity Selector Pill + Add to Cart Pill Button */}
            <div className="flex items-center gap-2.5 pt-1">
              
              {/* Quantity Selector Pill: < 1 > */}
              <div className="flex items-center justify-between w-24 sm:w-28 h-10 px-2.5 rounded-full bg-[#f4f2ee] border border-[#e8e2d8] text-slate-800">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="text-slate-600 hover:text-black font-semibold text-xs px-1 cursor-pointer transition-colors"
                >
                  &lt;
                </button>
                <span className="text-xs sm:text-sm font-semibold select-none">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="text-slate-600 hover:text-black font-semibold text-xs px-1 cursor-pointer transition-colors"
                >
                  &gt;
                </button>
              </div>

              {/* Add to Cart Pill Button */}
              <button
                type="button"
                disabled={!isCurrentSizeAvailable}
                onClick={async () => {
                  if (!isCurrentSizeAvailable) {
                    showToast(`Please choose an available size.`);
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
                className={`flex-1 h-10 px-5 rounded-full text-white text-xs sm:text-sm font-semibold tracking-wide shadow-xs transition-all flex items-center justify-center ${
                  isCurrentSizeAvailable
                    ? 'bg-[#030303] hover:bg-[#89591C] cursor-pointer hover:shadow-sm'
                    : 'bg-slate-400 cursor-not-allowed opacity-70'
                }`}
              >
                {isCurrentSizeAvailable ? 'Add to cart' : 'Size Out of Stock'}
              </button>
            </div>

            {/* Buy Now Full Width Pill Button */}
            <div>
              <button
                type="button"
                disabled={!isCurrentSizeAvailable}
                onClick={async () => {
                  if (!isCurrentSizeAvailable) {
                    showToast(`Please choose an available size.`);
                    return;
                  }
                  await addToCart({
                    productId: product._id,
                    title: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    size: selectedSize,
                    quantity: quantity,
                    imageUrl: displayImages[0]?.url || '/products/product1.webp',
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
                  router.push('/cart');
                }}
                className={`w-full h-10 sm:h-10.5 rounded-full text-white text-xs sm:text-sm font-semibold tracking-wide shadow-xs transition-all flex items-center justify-center ${
                  isCurrentSizeAvailable
                    ? 'bg-[#030303] hover:bg-[#89591C] cursor-pointer hover:shadow-sm'
                    : 'bg-slate-400 cursor-not-allowed opacity-70'
                }`}
              >
                {isCurrentSizeAvailable ? 'Buy Now' : 'Select Available Size'}
              </button>
            </div>

            {/* Share Row: Share: [Facebook] [Instagram] [WhatsApp] */}
            <div className="flex items-center gap-2.5 pt-1">
              <span className="text-xs sm:text-sm font-medium text-slate-800">Share:</span>
              <div className="flex items-center gap-1.5">
                {/* Facebook */}
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

                {/* Instagram */}
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

                {/* WhatsApp */}
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

            {/* ── Accordion Sections: Description, Additional Info, Shipping ── */}
            <div className="divide-y divide-[#f0ece5] border-t border-b border-[#f0ece5] pt-0.5">
              
              {/* 1. Description Accordion */}
              <div className="py-2.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('description')}
                  className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-[#030303] hover:text-[#89591C] transition-colors cursor-pointer"
                >
                  <span>Description</span>
                  {openAccordions.description ? (
                    <Minus className="w-3.5 h-3.5 text-slate-700" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-700" />
                  )}
                </button>
                {openAccordions.description && (
                  <div className="mt-2 text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sansation space-y-1.5">
                    <p>{product.description}</p>
                    <ul className="list-disc list-inside space-y-0.5 pt-0.5 text-slate-700">
                      <li>Anatomical dual-density footbed for pressure relief</li>
                      <li>Water-resistant premium full-grain leather upper</li>
                      <li>Ultra-lightweight anti-skid TPR outsole</li>
                      <li>Handcrafted with reinforced luxury cross-stitching</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 2. Additional Information Accordion */}
              <div className="py-2.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('additionalInfo')}
                  className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-[#030303] hover:text-[#89591C] transition-colors cursor-pointer"
                >
                  <span>Additional Information</span>
                  {openAccordions.additionalInfo ? (
                    <Minus className="w-3.5 h-3.5 text-slate-700" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-700" />
                  )}
                </button>
                {openAccordions.additionalInfo && (
                  <div className="mt-2 text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sansation">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#faf8f5] p-3 rounded-xl border border-[#e8e2d8]">
                      {Object.entries(product.additionalInfo || {}).map(([label, val]) => (
                        <div key={label} className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</span>
                          <span className="text-xs text-[#030303] font-medium">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Shipping and Return Accordion */}
              <div className="py-2.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('shippingAndReturn')}
                  className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-[#030303] hover:text-[#89591C] transition-colors cursor-pointer"
                >
                  <span>Shipping and return</span>
                  {openAccordions.shippingAndReturn ? (
                    <Minus className="w-3.5 h-3.5 text-slate-700" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-700" />
                  )}
                </button>
                {openAccordions.shippingAndReturn && (
                  <div className="mt-2 text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sansation space-y-2">
                    {Object.entries(product.shippingAndReturn || {}).map(([title, detail]) => (
                      <div key={title} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#89591C] flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#030303] font-semibold">{title}: </strong>
                          <span>{detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>


        {/* ── Personalized Recommendation Strip ── */}
        <div className="pt-6 sm:pt-8 border-t border-[#f0ece5]">
          <RecommendationStrip
            excludeIds={[productId]}
            limit={6}
          />
        </div>

        {/* ── Special Offer Available Banner (banner4.webp) ── */}
        <section className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] md:w-[calc(100%+5rem)] lg:w-[calc(100%+6rem)] aspect-[3172/1230] -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-12 overflow-hidden group bg-white rounded-none">
          <Image
            src="/images/banner4.webp"
            alt="GRAVOZ Special Offer Available - Use Coupon Code STYLE20"
            fill
            sizes="100vw"
            className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
          />
        </section>

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
              src={activeImage?.url || '/products/product2.webp'}
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
