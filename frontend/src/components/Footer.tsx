'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, ShieldCheck, Leaf, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-white mt-12 sm:mt-16">

      {/* 1. Black Feature Highlights Strip with 4 White Cards */}
      <div className="w-full bg-[#030303] py-6 sm:py-8 md:py-10 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">

          {/* Feature 1: Delivery & Shipping */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs min-h-[120px] sm:min-h-[135px]">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f4f2ee] border border-[#e8e2d8] flex items-center justify-center text-[#030303] mb-2 flex-shrink-0">
              <Truck className="w-3.5 h-3.5 text-slate-800" />
            </div>
            <div>
              <h4 className="font-sansation font-bold text-xs sm:text-[13px] text-[#030303] leading-snug">
                Delivery & Shipping
              </h4>
              <p className="font-sansation text-[10px] sm:text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Your shoes will be dispatched within 1-2 business days
              </p>
            </div>
          </div>

          {/* Feature 2: Warranty Included */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs min-h-[120px] sm:min-h-[135px]">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f4f2ee] border border-[#e8e2d8] flex items-center justify-center text-[#030303] mb-2 flex-shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-800" />
            </div>
            <div>
              <h4 className="font-sansation font-bold text-xs sm:text-[13px] text-[#030303] leading-snug">
                Warranty Included
              </h4>
              <p className="font-sansation text-[10px] sm:text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Every pair comes with a hassle free 6 month warranty
              </p>
            </div>
          </div>

          {/* Feature 3: Eco-Friendly Fabric */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs min-h-[120px] sm:min-h-[135px]">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f4f2ee] border border-[#e8e2d8] flex items-center justify-center text-[#030303] mb-2 flex-shrink-0">
              <Leaf className="w-3.5 h-3.5 text-slate-800" />
            </div>
            <div>
              <h4 className="font-sansation font-bold text-xs sm:text-[13px] text-[#030303] leading-snug">
                Eco-Friendly Fabric
              </h4>
              <p className="font-sansation text-[10px] sm:text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Crafted with sustainability shoes feature echo-friendly fabric
              </p>
            </div>
          </div>

          {/* Feature 4: Sustainable Materials */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs min-h-[120px] sm:min-h-[135px]">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f4f2ee] border border-[#e8e2d8] flex items-center justify-center text-[#030303] mb-2 flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-slate-800" />
            </div>
            <div>
              <h4 className="font-sansation font-bold text-xs sm:text-[13px] text-[#030303] leading-snug">
                Sustainable Materials
              </h4>
              <p className="font-sansation text-[10px] sm:text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Where premium comfort meets conscious materials.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Main Footer Links & Branding */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-16 lg:px-24 pt-10 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.2fr_1fr] gap-8 sm:gap-10">

          {/* Brand column */}
          <div className="space-y-3.5 max-w-sm">
            <div className="relative h-7 w-32">
              <Image
                src="/gravoz-logo.png"
                alt="GRAVOZ Official Logo"
                fill
                className="object-contain object-left"
                sizes="128px"
              />
            </div>
            <p className="font-sansation text-[11px] sm:text-xs leading-relaxed text-slate-600">
              Premium leather footwear crafted with timeless style, exceptional comfort, and attention to every detail. Made for those who appreciate quality that lasts, from everyday essentials to refined classics. Step into quality. Step into Gravoz.
            </p>
          </div>

          {/* SHOP Column */}
          <div className="space-y-2.5">
            <h5 className="font-sansation font-bold text-xs uppercase tracking-wider text-[#030303]">
              SHOP
            </h5>
            <ul className="space-y-2 font-sansation text-xs text-slate-600">
              <li><Link href="/category/men" className="hover:text-[#89591C] transition-colors">Men Shoes</Link></li>
              <li><Link href="/category/women" className="hover:text-[#89591C] transition-colors">Women Shoes</Link></li>
              <li><Link href="/category/unisex" className="hover:text-[#89591C] transition-colors">Unisex</Link></li>
            </ul>
          </div>

          {/* POLICIES Column */}
          <div className="space-y-2.5">
            <h5 className="font-sansation font-bold text-xs uppercase tracking-wider text-[#030303]">
              POLICIES
            </h5>
            <ul className="space-y-2 font-sansation text-xs text-slate-600">
              <li><Link href="/terms" className="hover:text-[#89591C] transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-[#89591C] transition-colors">Privacy policy</Link></li>
              <li><Link href="/refund" className="hover:text-[#89591C] transition-colors">Return & Refund</Link></li>
              <li><Link href="/shipping" className="hover:text-[#89591C] transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/faq" className="hover:text-[#89591C] transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* FOLLOW US Column */}
          <div className="space-y-2.5">
            <h5 className="font-sansation font-bold text-xs uppercase tracking-wider text-[#030303]">
              FOLLOW US
            </h5>
            <div className="flex items-center gap-2.5">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-7 h-7 rounded-lg bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* WhatsApp */}
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Copyright & Payment Badges */}
        <div className="mt-8 pt-6 border-t border-[#f0ece5] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-sansation">
          <p>© 2026 Gravoz. All Rights Reserved.</p>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">PayPal</span>
            <span className="font-semibold text-blue-700">AMEX</span>
            <span className="font-semibold text-sky-600">VISA</span>
            <span className="font-semibold text-amber-600">Mastercard</span>
            <span className="font-semibold text-orange-600">Discover</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
