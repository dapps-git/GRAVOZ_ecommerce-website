'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, ChevronDown, UserCheck, LogIn, Search } from 'lucide-react';

export default function Header() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <header className="w-full bg-white font-sans text-[#030303] border-b border-[#e8e2d8]">
      {/* 1. Top Announcement Bar (#89591C Brown Background) */}
      <div className="bg-[#89591C] text-white text-[10px] font-normal py-1 px-4 overflow-hidden tracking-[0.03em] uppercase">
        <div className="flex items-center justify-around whitespace-nowrap gap-8 animate-marquee sm:animate-none">
          <div className="flex items-center gap-2">
            <span>FREE DELIVERY FOR ORDERS ABOVE 1299 🚚</span>
          </div>
          <div className="flex items-center gap-2">
            <span>% WELCOME SALE IS LIVE NOW 🎉</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span>FREE DELIVERY FOR ORDERS ABOVE 1299 🚚</span>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <span>% WELCOME SALE IS LIVE NOW 🎉</span>
          </div>
        </div>
      </div>

      {/* 2. Utility Contact Bar (Email, Phone, Seller, Register, Login - Wide Container) */}
      <div className="bg-white border-b border-[#e8e2d8] px-4 md:px-6 py-1 text-[10px] text-[#030303] font-normal tracking-[0.03em]">
        <div className="max-w-[1530px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Left Items: Language, Email, Phone */}
          <div className="flex items-center gap-3 text-[#030303]">
            <div className="flex items-center gap-0.5 cursor-pointer hover:text-[#89591C] transition-colors">
              <span>English</span>
              <ChevronDown className="w-2.5 h-2.5 text-[#030303]" />
            </div>

            <span className="text-[#e8e2d8]">|</span>

            <a
              href="mailto:gravozcontact@gmail.com"
              className="flex items-center gap-1 hover:text-[#89591C] transition-colors"
            >
              <div className="w-3 h-3 relative flex-shrink-0">
                <Image
                  src="/icons/email.webp"
                  alt="Email"
                  width={12}
                  height={12}
                  className="object-contain"
                />
              </div>
              <span>gravozcontact@gmail.com</span>
            </a>

            <span className="text-[#e8e2d8]">|</span>

            <a
              href="tel:+910000000000"
              className="flex items-center gap-1 hover:text-[#89591C] transition-colors"
            >
              <Phone className="w-2.5 h-2.5 text-[#89591C]" />
              <span>+91 00000 000000</span>
            </a>
          </div>

          {/* Right Items: Be a Seller, Register, Login */}
          <div className="flex items-center gap-3 uppercase font-medium tracking-[0.03em] text-[#030303]">
            <Link href="/admin/login" className="hover:text-[#89591C] transition-colors">
              BE A SELLER
            </Link>

            <span className="text-[#e8e2d8]">|</span>

            <Link href="/register" className="flex items-center gap-1 hover:text-[#89591C] transition-colors">
              <UserCheck className="w-2.5 h-2.5 text-[#89591C]" />
              <span>REGISTER</span>
            </Link>

            <span className="text-[#e8e2d8]">|</span>

            <Link href="/login" className="flex items-center gap-1 hover:text-[#89591C] transition-colors">
              <LogIn className="w-2.5 h-2.5 text-[#89591C]" />
              <span>LOGIN</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Main Brand Text Logo (Wide Container) */}
      <div className="px-4 md:px-6 py-1.5 border-b border-[#e8e2d8]">
        <div className="max-w-[1530px] w-full mx-auto flex items-center justify-between gap-4">
          {/* GRAVOZ Text Logo */}
          <Link
            href="/"
            className="text-[20px] sm:text-[24px] font-normal leading-[1.0] tracking-[0.02em] text-[#030303] uppercase hover:text-[#89591C] transition-colors select-none"
            style={{ fontFamily: 'var(--font-playfair), Playfair Display, Georgia, serif' }}
          >
            GRAVOZ
          </Link>

          {/* Action Icons (Wishlist, Cart, Profile from /icons folder) */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              type="button"
              aria-label="Search Catalog"
              className="p-1 text-[#030303] hover:text-[#89591C] transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Wishlist Icon */}
            <Link href="/wishlist" className="relative p-1 text-[#030303] hover:text-[#89591C] transition-colors">
              <Image
                src="/icons/wishlist.webp"
                alt="Wishlist"
                width={18}
                height={18}
                className="w-4 h-4 object-contain"
              />
            </Link>

            {/* Cart Icon */}
            <Link href="/cart" className="relative p-1 text-[#030303] hover:text-[#89591C] transition-colors">
              <Image
                src="/icons/cart.webp"
                alt="Cart"
                width={18}
                height={18}
                className="w-4 h-4 object-contain"
              />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#89591C] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </Link>

            {/* Profile Icon */}
            <Link href="/account" className="relative p-1 text-[#030303] hover:text-[#89591C] transition-colors">
              <Image
                src="/icons/profile.webp"
                alt="Profile"
                width={18}
                height={18}
                className="w-4 h-4 object-contain"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Category Links Navbar (Wide Container) */}
      <div className="px-4 md:px-6 py-2 bg-white">
        <div className="max-w-[1530px] w-full mx-auto flex items-center justify-between gap-6 overflow-x-auto">
          <nav className="flex items-center gap-5 md:gap-7">
            <Link
              href="/products"
              className="text-xs md:text-[13px] font-normal tracking-[0.03em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
            >
              DISCOVER PRODUCT
            </Link>
            <Link
              href="/category/men"
              className="text-xs md:text-[13px] font-normal tracking-[0.03em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
            >
              MEN
            </Link>
            <Link
              href="/category/women"
              className="text-xs md:text-[13px] font-normal tracking-[0.03em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
            >
              WOMEN
            </Link>
            <Link
              href="/category/kids"
              className="text-xs md:text-[13px] font-normal tracking-[0.03em] uppercase text-[#89591C] font-semibold transition-colors whitespace-nowrap"
            >
              KIDS
            </Link>
            <Link
              href="/brands"
              className="text-xs md:text-[13px] font-normal tracking-[0.03em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
            >
              BRANDS
            </Link>
            <Link
              href="/products?filter=color"
              className="text-xs md:text-[13px] font-normal tracking-[0.03em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
            >
              COLOR
            </Link>
          </nav>

          <Link
            href="/track-order"
            className="text-xs md:text-[13px] font-normal tracking-[0.03em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap flex-shrink-0"
          >
            TRACK ORDER
          </Link>
        </div>
      </div>
    </header>
  );
}
