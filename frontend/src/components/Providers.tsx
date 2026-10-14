'use client';

import React, { ReactNode } from 'react';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { UserProvider } from '@/context/UserContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </CartProvider>
    </UserProvider>
  );
}
