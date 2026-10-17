'use client';

import { useState, useEffect } from 'react';
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

// Handcrafted Oxford Leather Shoe Icon
function OxfordShoeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path
        d="M2.5 16.5h18c.8 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.5-1-1.6-1.2-3.4-2.1-5.4-2.6-2-.5-3.8-1.5-5.2-3l-1.4-1.4c-.6-.6-1.5-1-2.4-1H5c-1.1 0-2 .9-2 2v5.5c0 1.1.9 2 2 2z"
        fill="currentColor"
        fillOpacity="0.25"
      />
      <path d="M2 17h19.5" />
      <path d="M3 17v2c0 .3.2.5.5.5h3.5c.3 0 .5-.2.5-.5V17" fill="currentColor" />
      <path d="M7.5 10.5l2.5 1.5" />
      <path d="M6.5 12.5l2.5 1.5" />
    </svg>
  );
}

// Handcrafted Loafer Shoe Icon
function LoaferShoeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path
        d="M3 13.5c-.6.6-1 1.4-1 2.3 0 1.2.9 2.2 2.1 2.2h15.4c1.4 0 2.5-1.1 2.5-2.5 0-.6-.2-1.1-.6-1.6-1.8-2.2-4.5-3.6-7.4-3.9l-2-.2c-1.5-.1-2.9-.8-3.9-1.9L6.5 6.8c-.4-.5-1-.8-1.7-.8H3.5C2.7 6 2 6.7 2 7.5v6"
        fill="currentColor"
        fillOpacity="0.25"
      />
      <path d="M2 17.5h19.5" />
      <path d="M2.5 17.5v2c0 .3.2.5.5.5h3.5c.3 0 .5-.2.5-.5V17.5" fill="currentColor" />
      <path d="M9 11v3.5" />
      <path d="M12 11.5v3.5" />
    </svg>
  );
}

const ANNOUNCEMENT_TRAIN_ITEMS = [
  { text: '100% FREE SHIPPING ALL OVER INDIA', type: 'oxford', logo: { name: 'Ellora', src: '/icons/logo1.webp' } },
  { text: 'WELCOME SALE IS LIVE NOW • EXTRA ₹100 OFF', type: 'loafer', logo: { name: 'Gravoz', src: '/icons/logo.webp' } },
  { text: 'PREMIUM HANDCRAFTED LEATHER FOOTWEAR', type: 'oxford', logo: { name: 'Jackrob', src: '/icons/logo2.webp' } },
  { text: '6-MONTH HASSLE-FREE WARRANTY INCLUDED', type: 'loafer', logo: { name: 'Ellora', src: '/icons/logo1.webp' } },
  { text: 'CASH ON DELIVERY & EASY DOORSTEP RETURNS', type: 'oxford', logo: { name: 'Gravoz', src: '/icons/logo.webp' } },
  { text: 'STEP INTO LUXURY • STEP INTO GRAVOZ', type: 'loafer', logo: { name: 'Jackrob', src: '/icons/logo2.webp' } },
];

export default function Header() {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isLoggedIn, logout } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="w-full bg-white font-sans text-[#030303] border-b border-[#e8e2d8] sticky top-0 z-40">
      {/* 1. Top Announcement Bar (#89591C Brown Background with White Font & White Logos) — Train Animation */}
      <div className="bg-[#89591C] text-white text-[11px] sm:text-[12px] font-medium py-2.5 sm:py-3 overflow-hidden tracking-[0.05em] uppercase border-b border-black/10 select-none shadow-2xs">
        <div className="animate-train items-center whitespace-nowrap">
          {[...ANNOUNCEMENT_TRAIN_ITEMS, ...ANNOUNCEMENT_TRAIN_ITEMS].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 sm:gap-4 px-6 shrink-0 group transition-opacity"
            >
              <div className="text-white/95 group-hover:scale-110 transition-transform flex-shrink-0 drop-shadow-xs">
                {item.type === 'oxford' ? (
                  <OxfordShoeIcon className="w-4 h-4" />
                ) : (
                  <LoaferShoeIcon className="w-4 h-4" />
                )}
              </div>
              <span className="tracking-wider text-white font-medium">{item.text}</span>
              
              <span className="text-white/45 text-[9px] px-1 select-none">◆</span>

              {/* Brand Logo in small size passing through in pure white */}
              <div className="relative h-4 sm:h-5 w-14 sm:w-16 flex items-center justify-center shrink-0">
                <Image
                  src={item.logo.src}
                  alt={item.logo.name}
                  fill
                  className="object-contain brightness-0 invert opacity-95 group-hover:opacity-100 transition-opacity"
                  sizes="64px"
                />
              </div>

              <span className="text-white/45 text-[9px] px-1 select-none">◆</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Utility Contact Bar (Desktop Only - Hidden on Mobile to eliminate clutter) */}
      <div className="hidden md:block bg-[#faf8f5] border-b border-[#e8e2d8] px-4 md:px-8 py-1.5 text-[11px] text-[#030303] font-normal tracking-[0.03em]">
        <div className="max-w-[1530px] w-full mx-auto flex items-center justify-between gap-4">
          {/* Left Items: Email, Phone */}
          <div className="flex items-center gap-3.5 text-[#030303]">
            <a
              href="mailto:gravozshoes@gmail.com"
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
              <span>gravozshoes@gmail.com</span>
            </a>

            <span className="text-[#d8cebe]">|</span>

            <a
              href="tel:+919645319418"
              className="flex items-center gap-1.5 hover:text-[#89591C] transition-colors"
            >
              <Phone className="w-3 h-3 text-[#89591C]" />
              <span>+91 9645319418</span>
            </a>
          </div>

          {/* Right Items: Register, Login / Profile */}
          <div className="flex items-center gap-3.5 uppercase font-medium tracking-[0.03em] text-[#030303]">
            {isLoggedIn && user ? (
              <>
                <Link href="/profile" className="flex items-center gap-1 hover:text-[#89591C] transition-colors font-bold text-[#89591C]">
                  <UserCheck className="w-3 h-3 text-[#89591C]" />
                  <span>HI, {(user?.name || 'USER').split(' ')[0].toUpperCase()}</span>
                </Link>
                <span className="text-[#d8cebe]">|</span>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    await logout();
                  }}
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
              {mounted && wishlistCount > 0 && (
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
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#89591C] text-white text-[8px] sm:text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile Icon / Avatar */}
            <Link 
              href={isLoggedIn ? "/profile" : "/login"} 
              className="relative flex items-center justify-center p-1 text-[#030303] hover:text-[#89591C] transition-colors"
              aria-label="User Account"
              title={isLoggedIn && user?.name ? `Profile (${user.name})` : 'Log In'}
            >
              {isLoggedIn ? (
                user?.avatarUrl ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-[#89591C]/50 shadow-2xs bg-[#faf8f5]">
                    {/* Use standard img with onError fallback for base64 / blob / external URLs */}
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User Avatar'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const parent = (e.currentTarget as HTMLElement).parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-[#89591C]">${(user?.name || 'U').charAt(0).toUpperCase()}</span>`;
                        }
                      }}
                    />
                  </div>
                ) : user?.name ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#89591C] text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center shadow-2xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <Image
                    src="/icons/profile.webp"
                    alt="Profile"
                    width={20}
                    height={20}
                    className="w-4 h-4 sm:w-[18px] sm:h-[18px] object-contain"
                  />
                )
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
                      onClick={async (e) => {
                        e.preventDefault();
                        closeMobileMenu();
                        await logout();
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
                  href="mailto:gravozshoes@gmail.com"
                  className="flex items-center gap-2 hover:text-[#89591C] transition-colors"
                >
                  <Image
                    src="/icons/email.webp"
                    alt="Email"
                    width={12}
                    height={12}
                    className="object-contain"
                  />
                  <span>gravozshoes@gmail.com</span>
                </a>
                <a
                  href="tel:+919645319418"
                  className="flex items-center gap-2 hover:text-[#89591C] transition-colors"
                >
                  <Phone className="w-3 h-3 text-[#89591C]" />
                  <span>+91 9645319418</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
