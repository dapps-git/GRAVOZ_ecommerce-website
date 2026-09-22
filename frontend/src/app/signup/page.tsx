'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, Check, AlertCircle, Gift, Loader2 } from 'lucide-react';
import { registerAccount } from '@/lib/auth-client';
import { useUser } from '@/context/UserContext';
import { playSuccessSound } from '@/lib/sounds';
import GoogleSignInButton from '@/components/GoogleSignInButton';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const queryRef = searchParams.get('ref') || searchParams.get('referral') || '';
  const { updateUser } = useUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(queryRef.toUpperCase());
  const [showReferralInput, setShowReferralInput] = useState(Boolean(queryRef));
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralMessage, setReferralMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Validate referral code helper
  const validateCode = async (codeToTest: string) => {
    const code = codeToTest.trim().toUpperCase();
    if (!code) {
      setReferralValid(null);
      setReferralMessage(null);
      return;
    }
    setReferralLoading(true);
    try {
      const res = await fetch('/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setReferralValid(true);
        setReferralMessage(data.message || '15% discount applied for your first order!');
      } else {
        setReferralValid(false);
        setReferralMessage(data.error || 'Invalid referral code');
      }
    } catch {
      setReferralValid(null);
      setReferralMessage(null);
    } finally {
      setReferralLoading(false);
    }
  };

  // Auto-validate if pre-filled from URL
  useEffect(() => {
    if (queryRef) {
      setReferralCode(queryRef.toUpperCase());
      setShowReferralInput(true);
      validateCode(queryRef);
    }
  }, [queryRef]);

  const handleReferralChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setReferralCode(clean);
    if (clean.length >= 3) {
      validateCode(clean);
    } else {
      setReferralValid(null);
      setReferralMessage(null);
    }
  };

  useEffect(() => {
    router.prefetch(redirectPath);
  }, [router, redirectPath]);

  // Lock scroll strictly to keep in single mobile view without scrolling
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await registerAccount({
        name: name.trim(),
        email: email.trim(),
        password,
        referralCode: referralCode.trim() || undefined,
      });
      if (res.success && res.user) {
        updateUser({
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone || '',
          avatarUrl: res.user.avatarUrl || null,
          referralCode: res.user.referralCode,
          referralDiscountBalance: res.user.referralDiscountBalance || 0,
          hasUsedReferralDiscount: res.user.hasUsedReferralDiscount || false,
          referredBy: res.user.referredBy || '',
          referralCodeUsed: res.user.referralCodeUsed || '',
        });
        playSuccessSound();
        router.push(redirectPath);
      } else {
        setErrorMessage(res.error || 'Failed to create account. Please try again.');
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = (user: any) => {
    updateUser({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || null,
      referralCode: user.referralCode,
      referralDiscountBalance: user.referralDiscountBalance || 0,
      hasUsedReferralDiscount: user.hasUsedReferralDiscount || false,
      referredBy: user.referredBy || '',
      referralCodeUsed: user.referralCodeUsed || '',
    });
    router.push(redirectPath);
  };

  return (
    <div className="h-[100dvh] max-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden bg-[#120e0a]">

      {/* Background — fixed cover */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/auth.webp"
          alt="GRAVOZ Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/45" />
      </div>

      {/* Center Container — fits 100% on one screen */}
      <div className="relative z-10 w-full max-w-[390px] flex flex-col items-center gap-2 sm:gap-3 my-auto">

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-1 text-center flex-shrink-0">
          <Link href="/" className="hover:opacity-95 transition-opacity">
            <div className="relative h-7 sm:h-8 w-36 sm:w-40">
              <Image src="/gravoz-logo.png" alt="GRAVOZ" fill priority className="object-contain drop-shadow-md" sizes="160px" />
            </div>
          </Link>
          <p className="text-[8.5px] sm:text-[9px] font-bold tracking-[0.25em] text-[#7a3e0b] uppercase font-sansation">
            PREMIUM HANDCRAFTED FOOTWEAR
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-8 sm:w-10 h-px bg-[#7a3e0b]/40" />
            <div className="w-2 h-2 rotate-45 border border-[#7a3e0b]/60 flex items-center justify-center">
              <div className="w-0.5 h-0.5 bg-[#7a3e0b]" />
            </div>
            <span className="w-8 sm:w-10 h-px bg-[#7a3e0b]/40" />
          </div>
        </div>

        {/* Form Card — Sharp flat edges, reduced box padding */}
        <div className="w-full bg-white/94 backdrop-blur-md shadow-2xl border border-white/70 px-4 py-3.5 sm:px-6 sm:py-5 flex flex-col gap-2.5 rounded-none flex-shrink-0">

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-base sm:text-lg font-semibold text-[#7a3e0b] tracking-tight font-sansation">
              Create Account
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 font-sansation">
              Sign up to get started
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1.5 text-rose-700 text-[10.5px] font-sansation rounded-none">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="flex flex-col gap-2 font-sansation">

            {/* Row 1: Full Name */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Name *</label>
              <div className="flex items-center gap-2 border border-[#ddd6cc] bg-[#faf9f7] px-2.5 py-1.5 sm:py-2 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all rounded-none">
                <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="flex-1 text-[11px] sm:text-xs bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400 font-sansation"
                  required
                />
              </div>
            </div>

            {/* Row 2: Email */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Email *</label>
              <div className="flex items-center gap-2 border border-[#ddd6cc] bg-[#faf9f7] px-2.5 py-1.5 sm:py-2 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all rounded-none">
                <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 text-[11px] sm:text-xs bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400 font-sansation"
                  required
                />
              </div>
            </div>

            {/* Row 3: Password & Confirm Password (Side by side on 2 columns for zero scrolling) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Password *</label>
                <div className="relative flex items-center gap-1.5 border border-[#ddd6cc] bg-[#faf9f7] px-2 py-1.5 sm:py-2 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all rounded-none">
                  <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="flex-1 text-[11px] sm:text-xs bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400 font-sansation pr-4 min-w-0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Confirm *</label>
                <div className="relative flex items-center gap-1.5 border border-[#ddd6cc] bg-[#faf9f7] px-2 py-1.5 sm:py-2 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all rounded-none">
                  <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm"
                    className="flex-1 text-[11px] sm:text-xs bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400 font-sansation pr-4 min-w-0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-1.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 4: Referral Code (Compact & collapsible for zero vertical clutter) */}
            <div className="pt-0.5">
              {!showReferralInput && !referralCode ? (
                <button
                  type="button"
                  onClick={() => setShowReferralInput(true)}
                  className="text-[10px] sm:text-[11px] font-medium text-[#7a3e0b] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Gift className="w-3 h-3" />
                  <span>Have a referral code? (Get 15% OFF)</span>
                </button>
              ) : (
                <div className="flex flex-col gap-0.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-slate-700">Referral Code</label>
                    {referralValid === true ? (
                      <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                        15% OFF APPLIED
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowReferralInput(false);
                          setReferralCode('');
                          setReferralValid(null);
                          setReferralMessage(null);
                        }}
                        className="text-[9.5px] text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Hide
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center gap-2 border border-[#ddd6cc] bg-[#faf9f7] px-2.5 py-1.5 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all rounded-none">
                    <Gift className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => handleReferralChange(e.target.value)}
                      placeholder="e.g. AIFA100"
                      className="flex-1 text-[11px] sm:text-xs uppercase tracking-wider bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400 font-sansation font-bold"
                    />
                    {referralLoading && <Loader2 className="w-3 h-3 text-slate-400 animate-spin flex-shrink-0" />}
                    {!referralLoading && referralValid === true && (
                      <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    )}
                    {!referralLoading && referralValid === false && (
                      <AlertCircle className="w-3 h-3 text-rose-500 flex-shrink-0" />
                    )}
                  </div>
                  {referralMessage && (
                    <p className={`text-[9.5px] font-medium ${referralValid ? 'text-emerald-700' : 'text-rose-500'}`}>
                      {referralMessage}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button — Sharp flat, compact py */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 sm:py-2.5 mt-1 bg-[#7a3e0b] hover:bg-[#633209] disabled:opacity-60 text-white text-[10.5px] sm:text-[11px] font-bold tracking-[0.18em] uppercase transition-colors cursor-pointer font-sansation flex items-center justify-center gap-1.5 rounded-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>CREATING ACCOUNT...</span>
                </>
              ) : (
                'SIGN UP'
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center gap-2.5 my-0.5">
            <span className="flex-1 h-px bg-[#e0d9d0]" />
            <span className="text-[9px] font-semibold text-slate-400 font-sansation tracking-wider">OR</span>
            <span className="flex-1 h-px bg-[#e0d9d0]" />
          </div>

          {/* Google Sign In */}
          <div className="[&_button]:rounded-none [&_button]:py-2 [&_button]:text-[11px]">
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={(err) => setErrorMessage(err)}
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              text="Continue with Google"
              referralCode={referralCode.trim() || undefined}
            />
          </div>

          {/* Footer Login Link */}
          <p className="text-center text-[10.5px] sm:text-[11px] text-slate-600 font-sansation pt-0.5">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#7a3e0b] hover:underline ml-0.5">
              Login
            </Link>
          </p>

        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 sm:top-auto sm:bottom-4 sm:right-4 sm:left-auto sm:translate-x-0 z-[9999] bg-[#030303] text-white px-3.5 py-2 shadow-2xl flex items-center gap-2 border border-white/10 animate-in slide-in-from-top-4 sm:slide-in-from-bottom-3 duration-300 font-sansation rounded-none text-[10.5px] max-w-[90vw] sm:max-w-md">
          <div className="w-3.5 h-3.5 bg-[#7a3e0b] flex items-center justify-center flex-shrink-0">
            <Check className="w-2 h-2 text-white" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#89591C] border-t-transparent animate-spin" /></div>}>
      <SignupContent />
    </Suspense>
  );
}
