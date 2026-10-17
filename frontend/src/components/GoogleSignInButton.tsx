'use client';

import React, { useEffect, useRef, useState } from 'react';
import { loginWithGoogle, AuthUser } from '@/lib/auth-client';
import { playSuccessSound } from '@/lib/sounds';

interface Props {
  onSuccess: (user: AuthUser) => void;
  onError: (error: string) => void;
  isSubmitting?: boolean;
  setIsSubmitting?: (val: boolean) => void;
  text?: string;
  referralCode?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting,
  text = 'Continue with Google',
  referralCode,
}: Props) {
  const [isReady, setIsReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Stable callback refs
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const setIsSubmittingRef = useRef(setIsSubmitting);
  const referralCodeRef = useRef(referralCode);

  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { setIsSubmittingRef.current = setIsSubmitting; }, [setIsSubmitting]);
  useEffect(() => { referralCodeRef.current = referralCode; }, [referralCode]);

  // Handle Token response (Desktop OAuth2 popup)
  const handleTokenResponse = async (tokenRes: any) => {
    if (tokenRes.error) {
      if (tokenRes.error !== 'popup_closed_by_user') {
        onErrorRef.current(tokenRes.error_description || tokenRes.error);
      }
      if (setIsSubmittingRef.current) setIsSubmittingRef.current(false);
      return;
    }

    if (!tokenRes?.access_token) {
      if (setIsSubmittingRef.current) setIsSubmittingRef.current(false);
      return;
    }

    if (setIsSubmittingRef.current) setIsSubmittingRef.current(true);
    try {
      const res = await loginWithGoogle({
        accessToken: tokenRes.access_token,
        referralCode: referralCodeRef.current,
      });

      if (res.success && res.user) {
        playSuccessSound();
        onSuccessRef.current(res.user);
      } else {
        onErrorRef.current(res.error || 'Google sign-in failed');
      }
    } catch (err: any) {
      onErrorRef.current(err.message || 'Google authentication error');
    } finally {
      if (setIsSubmittingRef.current) setIsSubmittingRef.current(false);
    }
  };

  // Preload Google script into head ONCE on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google?.accounts) {
      setIsReady(true);
      return;
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => setIsReady(true));
      if (window.google?.accounts) setIsReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsReady(true);
    document.head.appendChild(script);
  }, []);

  // Synchronous Click Handler — directly in user touch gesture (NO async await delays before trigger)
  const handleGoogleClick = () => {
    if (!clientId) {
      onErrorRef.current('Google Sign-in is not configured. Please use email and password.');
      return;
    }

    // Detect mobile browser or in-app webviews (WhatsApp, Safari iOS, Android Chrome)
    const isMobile =
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);

    if (isMobile) {
      // On mobile / in-app browsers, popups open blank or switch tabs.
      // Use direct same-tab OAuth redirect for 100% reliable flow without blank screens.
      const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || '');
      const redirectUri = `${origin}/login`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=${encodeURIComponent('openid email profile')}&prompt=select_account`;

      window.location.assign(authUrl);
      return;
    }

    // On Desktop: use Google OAuth2 Token Client popup (SYNCHRONOUS call)
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: handleTokenResponse,
        });
        client.requestAccessToken();
        return;
      } catch (err: any) {
        console.warn('OAuth2 client notice:', err);
      }
    }

    // Desktop fallback: same-tab redirect
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || '');
    const redirectUri = `${origin}/login`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${encodeURIComponent('openid email profile')}&prompt=select_account`;

    window.location.assign(authUrl);
  };

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={isSubmitting}
      className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-[#ddd6cc] bg-white hover:bg-[#faf9f7] text-slate-700 text-[11.5px] font-medium transition-colors cursor-pointer font-sansation disabled:opacity-60 rounded-md"
    >
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      {isSubmitting ? 'Connecting...' : text}
    </button>
  );
}
