'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Phone, 
  ChevronDown, 
  UserCheck, 
  LogIn, 
  Menu, 
  X, 
  ChevronRight,
  Package,
  Sparkles
} from 'lucide-react';
import SearchBar from './SearchBar';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useUser } from '@/context/UserContext';

export default function Header() {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isLoggedIn, logout } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          {/* Right Items: Register, Login / Profile */}
          <div className="flex items-center gap-3.5 uppercase font-medium tracking-[0.03em] text-[#030303]">
            {isLoggedIn && user ? (
              <>
                <Link href="/profile" className="flex items-center gap-1 hover:text-[#89591C] transition-colors font-bold text-[#89591C]">
                  <UserCheck className="w-3 h-3 text-[#89591C]" />
                  <span>HI, {user.name.split(' ')[0].toUpperCase()}</span>
                </Link>
                <span className="text-[#d8cebe]">|</span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="hover:text-rose-600 transition-colors text-[11px] font-semibold cursor-pointer uppercase"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <>
                <Link href="/signup" className="flex items-center gap-1 hover:text-[#89591C] transition-colors">
                  <UserCheck className="w-3 h-3 text-[#89591C]" />
                  <span>REGISTER</span>
                </Link>

                <span className="text-[#d8cebe]">|</span>

                <Link href="/login" className="flex items-center gap-1 hover:text-[#89591C] transition-colors">
                  <LogIn className="w-3 h-3 text-[#89591C]" />
                  <span>LOGIN</span>
                </Link>
              </>
            )}
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
            {/* Live Search Bar Component */}
            <SearchBar />

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
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#89591C] text-white text-[8px] sm:text-[9px] font-bold rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200">
                  {wishlistCount}
                </span>
              )}
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

            {/* Profile Icon / Avatar */}
            <Link 
              href={isLoggedIn ? "/profile" : "/login"} 
              className="relative flex items-center justify-center p-1 text-[#030303] hover:text-[#89591C] transition-colors"
              aria-label="User Account"
              title={isLoggedIn && user?.name ? `Profile (${user.name})` : 'Log In'}
            >
              {isLoggedIn && user?.avatarUrl ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-[#89591C]/50 shadow-2xs">
                  <Image
                    src={user.avatarUrl}
                    alt={user.name || 'User Avatar'}
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <Image
                  src="/icons/profile.webp"
                  alt="Profile"
                  width={20}
                  height={20}
                  className="w-4 h-4 sm:w-[18px] sm:h-[18px] object-contain"
                />
              )}
            </Link>
          </div>
        </div>
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
              href="/products?audience=Men"
              className="text-[12px] lg:text-[13px] font-medium tracking-[0.04em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
            >
              MEN
            </Link>
            <Link
              href="/products?audience=Women"
              className="text-[12px] lg:text-[13px] font-medium tracking-[0.04em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
            >
              WOMEN
            </Link>
            <Link
              href="/products?audience=Kids"
              className="text-[12px] lg:text-[13px] font-medium tracking-[0.04em] uppercase text-[#030303] hover:text-[#89591C] transition-colors whitespace-nowrap"
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
                    href="/products?audience=Men"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-medium text-[#030303] hover:bg-[#faf8f5] hover:text-[#89591C] rounded-lg transition-colors"
                  >
                    <span>MEN FOOTWEAR</span>
                    <ChevronRight className="w-4 h-4 text-[#aaa]" />
                  </Link>

                  <Link
                    href="/products?audience=Women"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-medium text-[#030303] hover:bg-[#faf8f5] hover:text-[#89591C] rounded-lg transition-colors"
                  >
                    <span>WOMEN FOOTWEAR</span>
                    <ChevronRight className="w-4 h-4 text-[#aaa]" />
                  </Link>

                  <Link
                    href="/products?audience=Kids"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-medium text-[#030303] hover:bg-[#faf8f5] hover:text-[#89591C] rounded-lg transition-colors"
                  >
                    <span>KIDS & BABY SHOES</span>
                    <ChevronRight className="w-4 h-4 text-[#aaa]" />
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
                {isLoggedIn && user ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-semibold text-white bg-[#89591C] rounded-md hover:bg-[#724a17] transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>MY PROFILE</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        closeMobileMenu();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-md hover:bg-rose-100 transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>LOGOUT</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-semibold text-white bg-[#030303] rounded-md hover:bg-[#89591C] transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>LOGIN</span>
                    </Link>
                    <Link
                      href="/signup"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-semibold text-[#030303] bg-white border border-[#e8e2d8] rounded-md hover:border-[#89591C] transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#89591C]" />
                      <span>SIGN UP</span>
                    </Link>
                  </>
                )}
              </div>

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
