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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Keep latest callbacks in refs so the Google button always calls fresh values
  // without needing to re-initialize on every render (fixes stale closure / silent failures)
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const setIsSubmittingRef = useRef(setIsSubmitting);
  const referralCodeRef = useRef(referralCode);

  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { setIsSubmittingRef.current = setIsSubmitting; }, [setIsSubmitting]);
  useEffect(() => { referralCodeRef.current = referralCode; }, [referralCode]);

  // Stable credential handler — reads from refs so it is never stale
  const handlerRef = useRef(async (response: any) => {
    if (setIsSubmittingRef.current) setIsSubmittingRef.current(true);
    try {
      if (!response?.credential) throw new Error('No Google credential returned');

      const res = await loginWithGoogle({
        credential: response.credential,
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
  });

  // Initialize Google Identity Services — runs once
  useEffect(() => {
    if (typeof window === 'undefined' || !clientId) return;

    const renderGoogleBtn = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handlerRef.current,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: containerRef.current.offsetWidth || 280,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
        setIsGsiLoaded(true);
      } catch (err: any) {
        console.warn('Google GSI init notice:', err);
      }
    };

    // If already loaded, render immediately
    if (window.google?.accounts?.id) {
      renderGoogleBtn();
      return;
    }

    // If script tag already exists, poll for readiness instead of adding duplicate
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const poll = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(poll);
          renderGoogleBtn();
        }
      }, 100);
      return () => clearInterval(poll);
    }

    // Fresh script load
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => renderGoogleBtn();
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [clientId]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Official Google Button Container — directly interactive on mobile & desktop */}
      <div
        ref={containerRef}
        className={`w-full flex justify-center min-h-[42px] ${isGsiLoaded ? 'block' : 'hidden'}`}
      />

      {/* Fallback skeleton while Google script loads */}
      {!isGsiLoaded && (
        <button
          type="button"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-[#ddd6cc] bg-white text-slate-700 text-[11.5px] font-medium transition-colors font-sansation disabled:opacity-60"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          {isSubmitting ? 'Connecting...' : text}
        </button>
      )}
    </div>
  );
}
