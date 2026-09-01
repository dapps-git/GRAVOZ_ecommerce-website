'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { trackEvent } from '@/lib/userBehavior';
import { playWishlistSound, playRemoveSound } from '@/lib/sounds';

export interface WishlistItem {
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  size?: string;
  color?: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  wishlistCount: number;
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'gravoz_wishlist';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from LocalStorage + sync with API
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    fetch('/api/wishlist')
      .then((res) => res.json())
      .then((data) => {
        if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.items));
        }
      })
      .catch(() => {
        // use local
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const saveLocal = (newItems: WishlistItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
    } catch {
      // ignore
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some((i) => i.productId === productId);
  };

  const toggleWishlist = async (item: WishlistItem) => {
    const exists = items.some((i) => i.productId === item.productId);
    let updated: WishlistItem[];

    if (exists) {
      playRemoveSound();
      updated = items.filter((i) => i.productId !== item.productId);
    } else {
      playWishlistSound();
      updated = [item, ...items];
      // Track wishlist event
      trackEvent({
        type: 'wishlist',
        productId: item.productId,
        productName: item.title,
        colors: item.color ? [item.color] : [],
        price: item.price,
      });
    }

    saveLocal(updated);

    try {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item }),
      });
    } catch {
      // local copy persisted
    }
  };

  const removeFromWishlist = async (productId: string) => {
    playRemoveSound();
    const filtered = items.filter((i) => i.productId !== productId);
    saveLocal(filtered);

    try {
      await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });
    } catch {
      // local copy persisted
    }
  };

  const clearWishlist = async () => {
    saveLocal([]);
    try {
      await fetch('/api/wishlist?clearAll=true', { method: 'DELETE' });
    } catch {
      // local copy persisted
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistCount: items.length,
        isLoading,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
