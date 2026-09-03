'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Check } from 'lucide-react';

export interface DuoProductData {
  slot: string;
  name?: string;
  title: string;
  price: number;
  originalPrice?: number;
  productId?: string;
  linkUrl: string;
  imageUrl: string;
  thumbnailUrl: string;
  lifestyleUrl: string;
  description?: string;
  sizes?: string[];
  colors?: any[];
  isActive?: boolean;
}

interface Props {
  product1?: DuoProductData | null;
  product2?: DuoProductData | null;
}

export default function DuoSpotlightSection({ product1, product2 }: Props) {
  const { addToCart } = useCart();
  const [addingSlot, setAddingSlot] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const hasP1 = product1 && (product1.imageUrl || product1.lifestyleUrl);
  const hasP2 = product2 && (product2.imageUrl || product2.lifestyleUrl);

  if (!hasP1 && !hasP2) return null;

  const handleAddToCart = (product: DuoProductData, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingSlot(product.slot);

    addToCart({
      productId: product.productId || product.slot,
      title: product.title || 'Gravoz Footwear',
      price: product.price || 1399,
      originalPrice: product.originalPrice ?? undefined,
      imageUrl: product.imageUrl || product.lifestyleUrl || '/products/placeholder.svg',
      size: (product.sizes && product.sizes[0]) || '9',
      quantity: 1,
    });

    setToastMsg(`"${product.title || 'Product'}" added to cart!`);
    setTimeout(() => {
      setAddingSlot(null);
      setToastMsg(null);
    }, 2500);
  };

  const renderProductSpotlight = (product: DuoProductData, defaultTitle: string) => {
    const mainImg = product.imageUrl || '/products/placeholder.svg';
    const thumbImg = product.thumbnailUrl || product.imageUrl || '/products/placeholder.svg';
    const lifeImg = product.lifestyleUrl || product.imageUrl || '/products/placeholder.svg';
    const href =
      product.linkUrl && product.linkUrl !== '/products'
        ? product.linkUrl
        : `/products/${product.slot}`;
    const isAdding = addingSlot === product.slot;

    return (
      <div className="flex flex-col flex-1 gap-3">
        {/* ── 2 tall portrait cards ── */}
        <Link href={href} className="group grid grid-cols-2 gap-2.5 sm:gap-3 cursor-pointer">

          {/* Card 1 — Main photo + floating inset thumb */}
          <div className="relative aspect-[2/3] rounded-[20px] sm:rounded-[24px] overflow-hidden bg-[#f0ede8] border border-[#e8e2d8] shadow-sm group-hover:shadow-md transition-all duration-300">
            <Image
              src={mainImg}
              alt={`${product.title || defaultTitle} – main`}
              fill
              sizes="(max-width: 768px) 45vw, 22vw"
              className="object-cover object-center group-hover:scale-[1.04] transition-transform duration-700"
            />
            {/* Inset thumbnail badge – bottom-left */}
            {product.thumbnailUrl && (
              <div className="absolute bottom-2.5 left-2.5 w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[12px] bg-white border-2 border-white shadow-lg overflow-hidden z-20">
                <div className="relative w-full h-full rounded-[10px] overflow-hidden">
                  <Image
                    src={thumbImg}
                    alt="angle view"
                    fill
                    sizes="60px"
                    className="object-cover object-center"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 2 — Tall lifestyle photo */}
          <div className="relative aspect-[2/3] rounded-[20px] sm:rounded-[24px] overflow-hidden bg-[#f0ede8] border border-[#e8e2d8] shadow-sm group-hover:shadow-md transition-all duration-300">
            <Image
              src={lifeImg}
              alt={`${product.title || defaultTitle} – lifestyle`}
              fill
              sizes="(max-width: 768px) 45vw, 22vw"
              className="object-cover object-center group-hover:scale-[1.04] transition-transform duration-700"
            />
          </div>
        </Link>

        {/* ── Product info ── */}
        <div className="space-y-1.5">
          <Link href={href} className="group block">
            <p className="text-[12px] sm:text-[13px] font-normal text-[#1a1a1a] leading-snug truncate group-hover:text-[#89591C] transition-colors">
              {product.title || defaultTitle}
            </p>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-[12px] sm:text-[13px] font-bold text-[#89591C]">
                ₹{product.price || 1399}
              </span>
              {product.originalPrice && product.originalPrice > (product.price || 0) && (
                <span className="text-[11px] text-slate-400 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
          </Link>

          {/* ── Add to Cart button — matches screenshot: full-width black, cart icon, rounded pill ── */}
          <button
            type="button"
            onClick={(e) => handleAddToCart(product, e)}
            disabled={isAdding}
            className={`
              w-full py-2.5 sm:py-[11px] px-4 rounded-[10px]
              flex items-center justify-center gap-2
              text-[12px] sm:text-[13px] font-semibold
              transition-all duration-200 cursor-pointer
              ${isAdding
                ? 'bg-[#89591C] text-white'
                : 'bg-[#111111] hover:bg-[#89591C] text-white active:scale-[0.99]'}
            `}
          >
            {isAdding ? (
              <>
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="w-full font-sansation">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 border border-white/10 animate-in slide-in-from-bottom-4 duration-200">
          <Check className="w-3.5 h-3.5 text-[#89591C] flex-shrink-0" />
          {toastMsg}
        </div>
      )}

      {/* 2-column grid: left = product1 (2 cards), right = product2 (2 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
        {product1 && renderProductSpotlight(product1, "Men's Casual Comfort Sandals")}
        {product2 && renderProductSpotlight(product2, "Women's Casual Comfort Sandals")}
      </div>
    </section>
  );
}
