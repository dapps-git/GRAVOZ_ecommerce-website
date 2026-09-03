'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useUser } from '@/context/UserContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { isLoggedIn } = useUser();

  const isHome = pathname === '/';
  const isCategories = pathname.startsWith('/products') || pathname.startsWith('/category');
  const isWishlist = pathname.startsWith('/wishlist');
  const isCart = pathname.startsWith('/cart');
  const isAccount = pathname.startsWith('/profile') || pathname.startsWith('/login') || pathname.startsWith('/account');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#e8e2d8] py-2 px-3 flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.05)] lg:hidden">
      {/* Home */}
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isHome ? 'text-[#89591C] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
      >
        <Home className={`w-4 h-4 ${isHome ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span>Home</span>
      </Link>

      {/* Categories */}
      <Link
        href="/products"
        className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isCategories ? 'text-[#89591C] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
      >
        <LayoutGrid className={`w-4 h-4 ${isCategories ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span>Categories</span>
      </Link>

      {/* Wishlist */}
      <Link
        href="/wishlist"
        className={`relative flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isWishlist ? 'text-[#89591C] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
      >
        <div className="relative">
          <Heart className={`w-4 h-4 ${isWishlist ? 'stroke-[2.5] fill-[#89591C]' : 'stroke-2'}`} />
          {wishlistCount > 0 && (
            <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full bg-[#68421A] text-white text-[8px] font-bold flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
        </div>
        <span>Wishlist</span>
      </Link>

      {/* Cart */}
      <Link
        href="/cart"
        className={`relative flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isCart ? 'text-[#89591C] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
      >
        <div className="relative">
          <ShoppingBag className={`w-4 h-4 ${isCart ? 'stroke-[2.5]' : 'stroke-2'}`} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full bg-[#68421A] text-white text-[8px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <span>Cart</span>
      </Link>

      {/* Account */}
      <Link
        href={isLoggedIn ? '/profile' : '/login'}
        className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isAccount ? 'text-[#89591C] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
      >
        <User className={`w-4 h-4 ${isAccount ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span>Account</span>
      </Link>
    </nav>
  );
}
