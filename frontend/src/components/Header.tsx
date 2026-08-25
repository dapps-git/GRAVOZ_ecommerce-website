'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Phone, 
  ChevronDown, 
  UserCheck, 
  LogIn, 
  Search, 
  Menu, 
  X, 
  ChevronRight,
  Package,
  Sparkles,
  Store
} from 'lucide-react';

export default function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="w-full bg-white font-sans text-[#030303] border-b border-[#e8e2d8] sticky top-0 z-40">
      {/* 1. Top Announcement Bar (#89591C Brown Background) */}
      <div className="bg-[#89591C] text-white text-[10px] sm:text-[11px] font-medium py-1.5 px-4 overflow-hidden tracking-[0.04em] uppercase">
        {/* Mobile View Announcement: Single clean line */}
        <div className="md:hidden flex items-center justify-center text-center truncate">
          <span className="truncate">🚚 FREE DELIVERY ON ORDERS ABOVE ₹1299 • SALE IS LIVE</span>
        </div>

        {/* Desktop View Announcement */}
        <div className="hidden md:flex items-center justify-around whitespace-nowrap gap-8">
          <div className="flex items-center gap-2">
            <span>FREE DELIVERY FOR ORDERS ABOVE ₹1299 🚚</span>
          </div>
          <div className="flex items-center gap-2">
            <span>% WELCOME SALE IS LIVE NOW 🎉</span>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <span>PREMIUM HANDCRAFTED FOOTWEAR ✨</span>
          </div>
        </div>
      </div>

      {/* 2. Utility Contact Bar (Desktop Only - Hidden on Mobile to eliminate clutter) */}
      <div className="hidden md:block bg-[#faf8f5] border-b border-[#e8e2d8] px-4 md:px-8 py-1.5 text-[11px] text-[#030303] font-normal tracking-[0.03em]">
        <div className="max-w-[1530px] w-full mx-auto flex items-center justify-between gap-4">
          {/* Left Items: Language, Email, Phone */}
          <div className="flex items-center gap-3.5 text-[#030303]">
            <div className="flex items-center gap-1 cursor-pointer hover:text-[#89591C] transition-colors">
              <span>English</span>
              <ChevronDown className="w-3 h-3 text-[#555]" />
            </div>

            <span className="text-[#d8cebe]">|</span>

            <a
              href="mailto:gravozcontact@gmail.com"
              className="flex items-center gap-1.5 hover:text-[#89591C] transition-colors"
            >
              <div className="w-3.5 h-3.5 relative flex-shrink-0">
                <Image
                  src="/icons/email.webp"
                  alt="Email"
                  width={14}
                  height={14}
                  className="object-contain"
                />
              </div>
              <span>gravozcontact@gmail.com</span>
            </a>

            <span className="text-[#d8cebe]">|</span>

            <a
              href="tel:+910000000000"
              className="flex items-center gap-1.5 hover:text-[#89591C] transition-colors"
            >
              <Phone className="w-3 h-3 text-[#89591C]" />
              <span>+91 00000 000000</span>
            </a>
          </div>

          {/* Right Items: Be a Seller, Register, Login */}
          <div className="flex items-center gap-3.5 uppercase font-medium tracking-[0.03em] text-[#030303]">
            <Link href="/admin/login" className="flex items-center gap-1 hover:text-[#89591C] transition-colors">
              <Store className="w-3 h-3 text-[#89591C]" />
              <span>BE A SELLER</span>
            </Link>

            <span className="text-[#d8cebe]">|</span>

            <Link href="/register" className="flex items-center gap-1 hover:text-[#89591C] transition-colors">
              <UserCheck className="w-3 h-3 text-[#89591C]" />
              <span>REGISTER</span>
            </Link>

            <span className="text-[#d8cebe]">|</span>

            <Link href="/login" className="flex items-center gap-1 hover:text-[#89591C] transition-colors">
              <LogIn className="w-3 h-3 text-[#89591C]" />
              <span>LOGIN</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Main Brand Navbar (Clean Mobile & Desktop Bar) */}
      <div className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-white border-b border-[#e8e2d8]">
        <div className="max-w-[1530px] w-full mx-auto flex items-center justify-between gap-4">
          
          {/* Mobile Left: Hamburger Menu Button & Brand Logo */}
          <div className="flex items-center gap-3">
            {/* Hamburger Button (Mobile only) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
              className="md:hidden p-1.5 -ml-1.5 text-[#030303] hover:text-[#89591C] transition-colors rounded-md focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* GRAVOZ Text Logo */}
            <Link
              href="/"
              className="text-[20px] sm:text-[24px] md:text-[26px] font-normal leading-none tracking-[0.04em] text-[#030303] uppercase hover:text-[#89591C] transition-colors select-none"
              style={{ fontFamily: 'var(--font-playfair), Playfair Display, Georgia, serif' }}
            >
              GRAVOZ
            </Link>
          </div>

          {/* Action Icons (Search, Wishlist, Cart, Profile) */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search Catalog"
              className="p-1 text-[#030303] hover:text-[#89591C] transition-colors"
            >
              <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>

            {/* Wishlist Icon */}
            <Link 
              href="/wishlist" 
              className="relative p-1 text-[#030303] hover:text-[#89591C] transition-colors"
              aria-label="Wishlist"
            >
              <Image
                src="/icons/wishlist.webp"
                alt="Wishlist"
                width={20}
                height={20}
                className="w-4 h-4 sm:w-[18px] sm:h-[18px] object-contain"
              />
            </Link>

            {/* Cart Icon */}
            <Link 
              href="/cart" 
              className="relative p-1 text-[#030303] hover:text-[#89591C] transition-colors"
              aria-label="Shopping Cart"
            >
              <Image
                src="/icons/cart.webp"
                alt="Cart"
                width={20}
                height={20}
                className="w-4 h-4 sm:w-[18px] sm:h-[18px] object-contain"
              />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#89591C] text-white text-[8px] sm:text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </Link>

            {/* Profile Icon */}
            <Link 
              href="/account" 
              className="relative p-1 text-[#030303] hover:text-[#89591C] transition-colors"
              aria-label="User Account"
            >
              <Image
                src="/icons/profile.webp"
                alt="Profile"
                width={20}
                height={20}
                className="w-4 h-4 sm:w-[18px] sm:h-[18px] object-contain"
              />
            </Link>
          </div>
        </div>

        {/* Expandable Search Input (Toggleable on Mobile & Desktop) */}
        {searchOpen && (
          <div className="pt-3 pb-1 border-t border-[#f0eae1] mt-2 animate-fadeIn">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
                }
              }}
              className="max-w-[1530px] mx-auto flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search footwear for Men, Women & Kids..."
                  className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-[#faf8f5] border border-[#e8e2d8] rounded-full focus:outline-none focus:border-[#89591C] text-[#030303]"
                  autoFocus
                />
                <Search className="w-4 h-4 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-2 text-xs text-[#666] hover:text-[#030303] font-medium"
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 4. Desktop Category Links Navbar (Desktop Only) */}
      <div className="hidden md:block px-6 md:px-8 py-2.5 bg-white">
        <div className="max-w-[1530px] w-full mx-auto flex items-center justify-between gap-6">
          <nav className="flex items-center gap-6 lg:gap-8">
            <Link
              href="/products"
              className="text-[12px] lg:text-[13px] font-medium tracking-[0.04em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
            >
              DISCOVER PRODUCT
            </Link>
            <Link
              href="/category/men"
              className="text-[12px] lg:text-[13px] font-medium tracking-[0.04em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
            >
              MEN
            </Link>
            <Link
              href="/category/women"
              className="text-[12px] lg:text-[13px] font-medium tracking-[0.04em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
            >
              WOMEN
            </Link>
            <Link
              href="/category/kids"
              className="text-[12px] lg:text-[13px] font-semibold tracking-[0.04em] uppercase text-[#89591C] transition-colors whitespace-nowrap"
            >
              KIDS
            </Link>
            <Link
              href="/brands"
              className="text-[12px] lg:text-[13px] font-medium tracking-[0.04em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
            >
              BRANDS
            </Link>
            <Link
              href="/products?filter=color"
              className="text-[12px] lg:text-[13px] font-medium tracking-[0.04em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
            >
              COLOR
            </Link>
          </nav>

          <Link
            href="/track-order"
            className="flex items-center gap-1.5 text-[12px] lg:text-[13px] font-medium tracking-[0.04em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
          >
            <Package className="w-3.5 h-3.5 text-[#89591C]" />
            <span>TRACK ORDER</span>
          </Link>
        </div>
      </div>

      {/* 5. Mobile Slide-Over Drawer Navigation (When hamburger menu is opened) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 max-w-[300px] w-[85%] bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e2d8] bg-[#faf8f5]">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="text-[20px] font-normal leading-none tracking-[0.03em] text-[#030303] uppercase"
                  style={{ fontFamily: 'var(--font-playfair), Playfair Display, Georgia, serif' }}
                >
                  GRAVOZ
                </Link>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  aria-label="Close Navigation Menu"
                  className="p-1.5 text-[#555] hover:text-[#030303] rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Categories */}
              <div className="py-2 px-3">
                <p className="px-3 py-2 text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                  Collections
                </p>
                <nav className="flex flex-col space-y-0.5">
                  <Link
                    href="/products"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-medium text-[#030303] hover:bg-[#faf8f5] hover:text-[#89591C] rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#89591C]" />
                      <span>DISCOVER ALL</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#aaa]" />
                  </Link>

                  <Link
                    href="/category/men"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-medium text-[#030303] hover:bg-[#faf8f5] hover:text-[#89591C] rounded-lg transition-colors"
                  >
                    <span>MEN FOOTWEAR</span>
                    <ChevronRight className="w-4 h-4 text-[#aaa]" />
                  </Link>

                  <Link
                    href="/category/women"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-medium text-[#030303] hover:bg-[#faf8f5] hover:text-[#89591C] rounded-lg transition-colors"
                  >
                    <span>WOMEN FOOTWEAR</span>
                    <ChevronRight className="w-4 h-4 text-[#aaa]" />
                  </Link>

                  <Link
                    href="/category/kids"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-[#89591C] bg-[#faf8f5] rounded-lg transition-colors"
                  >
                    <span>KIDS & BABY SHOES</span>
                    <ChevronRight className="w-4 h-4 text-[#89591C]" />
                  </Link>

                  <Link
                    href="/brands"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-medium text-[#030303] hover:bg-[#faf8f5] hover:text-[#89591C] rounded-lg transition-colors"
                  >
                    <span>BRANDS</span>
                    <ChevronRight className="w-4 h-4 text-[#aaa]" />
                  </Link>

                  <Link
                    href="/products?filter=color"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-medium text-[#030303] hover:bg-[#faf8f5] hover:text-[#89591C] rounded-lg transition-colors"
                  >
                    <span>SHOP BY COLOR</span>
                    <ChevronRight className="w-4 h-4 text-[#aaa]" />
                  </Link>

                  <Link
                    href="/track-order"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-medium text-[#030303] hover:bg-[#faf8f5] hover:text-[#89591C] rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-[#89591C]" />
                      <span>TRACK YOUR ORDER</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#aaa]" />
                  </Link>
                </nav>
              </div>
            </div>

            {/* Drawer Bottom Actions: Auth & Contact */}
            <div className="p-4 border-t border-[#e8e2d8] bg-[#faf8f5] space-y-3">
              {/* Login / Register Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-semibold text-white bg-[#030303] rounded-md hover:bg-[#89591C] transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>LOGIN</span>
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-semibold text-[#030303] bg-white border border-[#e8e2d8] rounded-md hover:border-[#89591C] transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#89591C]" />
                  <span>REGISTER</span>
                </Link>
              </div>

              {/* Seller Link */}
              <Link
                href="/admin/login"
                onClick={closeMobileMenu}
                className="flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-[#89591C] bg-white border border-[#e8e2d8] rounded-md hover:bg-[#89591C] hover:text-white transition-all text-center"
              >
                <Store className="w-3.5 h-3.5" />
                <span>BECOME A SELLER</span>
              </Link>

              {/* Contact Info */}
              <div className="pt-2 text-[10px] text-[#666] space-y-1.5 border-t border-[#e8e2d8]/60">
                <a
                  href="mailto:gravozcontact@gmail.com"
                  className="flex items-center gap-2 hover:text-[#89591C] transition-colors"
                >
                  <Image
                    src="/icons/email.webp"
                    alt="Email"
                    width={12}
                    height={12}
                    className="object-contain"
                  />
                  <span>gravozcontact@gmail.com</span>
                </a>
                <a
                  href="tel:+910000000000"
                  className="flex items-center gap-2 hover:text-[#89591C] transition-colors"
                >
                  <Phone className="w-3 h-3 text-[#89591C]" />
                  <span>+91 00000 000000</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
