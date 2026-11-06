'use client';

import React, { ReactNode, Suspense } from 'react';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { UserProvider } from '@/context/UserContext';
import AffiliateTracker from '@/components/AffiliateTracker';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <CartProvider>
        <WishlistProvider>
          <Suspense fallback={null}>
            <AffiliateTracker />
          </Suspense>
          {children}
        </WishlistProvider>
      </CartProvider>
    </UserProvider>
  );
}
