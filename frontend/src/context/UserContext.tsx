'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, logoutAccount } from '@/lib/auth-client';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string | null;
  rewardPoints?: number;
  referralCode?: string;
  tier?: string;
}

interface UserContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  updateUser: (data: Partial<UserProfile> | null) => void;
  updateAvatar: (avatarUrl: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const LOCAL_STORAGE_KEY = 'gravoz_user_profile';

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const res = await getCurrentUser();
      if (res.authenticated && res.user) {
        const profile: UserProfile = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone || '',
          address: res.user.address || '',
          avatarUrl: res.user.avatarUrl || null,
          rewardPoints: res.user.rewardPoints,
          referralCode: res.user.referralCode,
          tier: res.user.tier,
        };
        setUser(profile);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
        } catch {}
        return true;
      } else {
        // Fallback check localStorage
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.email) {
              setUser(parsed);
              return true;
            }
          } catch {}
        }
        setUser(null);
        return false;
      }
    } catch {
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const updateUser = (data: Partial<UserProfile> | null) => {
    if (data === null) {
      setUser(null);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch {}
      return;
    }
    setUser((prev) => {
      const updated = prev ? { ...prev, ...data } : (data as UserProfile);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const updateAvatar = (avatarUrl: string) => {
    updateUser({ avatarUrl });
  };

  const logout = async () => {
    try {
      await logoutAccount();
    } catch {}
    setUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}
  };

  const isLoggedIn = !!user && !!user.email;

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        updateUser,
        updateAvatar,
        logout,
        checkAuth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
