'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { trackEvent } from '@/lib/userBehavior';
import { playAddToCartSound, playRemoveSound } from '@/lib/sounds';

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  size: string;
  quantity: number;
  imageUrl: string;
  color?: string;
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  isLoading: boolean;
  addToCart: (item: CartItem) => Promise<void>;
  updateQuantity: (productId: string, size: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string, size: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'gravoz_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from LocalStorage + fetch from backend API
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    // Background sync with API
    fetch('/api/cart')
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

  const saveLocal = (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
    } catch {
      // ignore
    }
  };

  const addToCart = async (newItem: CartItem) => {
    // 1. Play Add to Cart chime
    playAddToCartSound();

    // 2. Optimistic Local Update
    const current = [...items];
    const idx = current.findIndex(
      (i) => i.productId === newItem.productId && i.size === newItem.size
    );

    if (idx > -1) {
      current[idx].quantity += newItem.quantity || 1;
    } else {
      current.push(newItem);
    }
    saveLocal(current);

    // 3. Track event for recommendation engine
    trackEvent({
      type: 'cart',
      productId: newItem.productId,
      productName: newItem.title,
      colors: newItem.color ? [newItem.color] : [],
      price: newItem.price,
    });

    // 4. Sync to API in background
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: newItem }),
      });
    } catch {
      // local copy persisted
    }
  };

  const updateQuantity = async (productId: string, size: string, quantity: number) => {
    let current = [...items];
    if (quantity <= 0) {
      playRemoveSound();
      current = current.filter((i) => !(i.productId === productId && i.size === size));
    } else {
      const idx = current.findIndex((i) => i.productId === productId && i.size === size);
      if (idx > -1) {
        current[idx].quantity = quantity;
      }
    }
    saveLocal(current);

    try {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, size, quantity }),
      });
    } catch {
      // local copy persisted
    }
  };

  const removeFromCart = async (productId: string, size: string) => {
    playRemoveSound();
    const filtered = items.filter((i) => !(i.productId === productId && i.size === size));
    saveLocal(filtered);

    try {
      await fetch(
        `/api/cart?productId=${encodeURIComponent(productId)}&size=${encodeURIComponent(size)}`,
        { method: 'DELETE' }
      );
    } catch {
      // local copy persisted
    }
  };

  const clearCart = async () => {
    saveLocal([]);
    try {
      await fetch('/api/cart?clearAll=true', { method: 'DELETE' });
    } catch {
      // local copy persisted
    }
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        subtotal,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
