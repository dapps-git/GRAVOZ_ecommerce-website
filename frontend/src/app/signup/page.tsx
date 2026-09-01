'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { registerAccount } from '@/lib/auth-client';
import { useUser } from '@/context/UserContext';
import { playSuccessSound } from '@/lib/sounds';
import GoogleSignInButton from '@/components/GoogleSignInButton';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const { updateUser } = useUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    router.prefetch(redirectPath);
  }, [router, redirectPath]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim() || !email.trim() || !password || !confirmPassword) { setErrorMessage('Please fill in all required fields.'); return; }
    if (password !== confirmPassword) { setErrorMessage('Passwords do not match.'); return; }
    if (password.length < 6) { setErrorMessage('Password must be at least 6 characters.'); return; }
    setIsSubmitting(true);
    try {
      const res = await registerAccount({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      if (res.success && res.user) {
        updateUser({ name: res.user.name, email: res.user.email, phone: res.user.phone || '', avatarUrl: res.user.avatarUrl || null });
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
    updateUser({ name: user.name, email: user.email, phone: user.phone || '', avatarUrl: user.avatarUrl || null });
    router.push(redirectPath);
  };

  // Lock body scroll — prevents white edges from browser scroll bounce
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

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">

      {/* Background — fixed so no scroll or white edges appear on any side */}
      <div className="fixed inset-0 z-0">
        <Image src="/images/auth.webp" alt="GRAVOZ Background" fill priority sizes="100vw" className="object-cover object-center select-none pointer-events-none" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px] mx-4 flex flex-col gap-4">

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-1.5">
          <Link href="/">
            <div className="relative h-9 w-44">
              <Image src="/gravoz-logo.png" alt="GRAVOZ" fill priority className="object-contain" sizes="176px" />
            </div>
          </Link>
          <p className="text-[9px] font-bold tracking-[0.25em] text-[#7a3e0b] uppercase font-sansation">
            PREMIUM HANDCRAFTED FOOTWEAR
          </p>
          <div className="flex items-center gap-2.5">
            <span className="w-12 h-px bg-[#7a3e0b]/40" />
            <div className="w-3 h-3 rotate-45 border border-[#7a3e0b]/60 flex items-center justify-center">
              <div className="w-1 h-1 bg-[#7a3e0b]" />
            </div>
            <span className="w-12 h-px bg-[#7a3e0b]/40" />
          </div>
        </div>

        {/* Form Card — zero border radius, clean flat card */}
        <div className="bg-white/92 backdrop-blur-sm shadow-2xl border border-white/60 px-8 py-6 flex flex-col gap-3.5">

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-xl font-semibold text-[#7a3e0b] tracking-tight font-sansation">Create Account</h1>
            <p className="text-[11px] text-slate-500 mt-0.5 font-sansation">Sign up to get started</p>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 px-3 py-2 text-rose-700 text-[11px] font-sansation">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="flex flex-col gap-2.5 font-sansation">

            {/* Name */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] font-semibold text-slate-700">Name</label>
              <div className="flex items-center gap-2.5 border border-[#ddd6cc] bg-[#faf9f7] px-3 py-2.5 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all">
                <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className="flex-1 text-xs bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400 font-sansation" required />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] font-semibold text-slate-700">Email *</label>
              <div className="flex items-center gap-2.5 border border-[#ddd6cc] bg-[#faf9f7] px-3 py-2.5 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="flex-1 text-xs bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400 font-sansation" required />
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] font-semibold text-slate-700">Mobile Number (Optional)</label>
              <div className="flex items-center gap-2.5 border border-[#ddd6cc] bg-[#faf9f7] px-3 py-2.5 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all">
                <span className="text-xs text-slate-400 font-semibold">+91</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" className="flex-1 text-xs bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400 font-sansation" />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] font-semibold text-slate-700">Password</label>
              <div className="relative flex items-center gap-2.5 border border-[#ddd6cc] bg-[#faf9f7] px-3 py-2.5 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all">
                <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="flex-1 text-xs bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400 font-sansation pr-5" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] font-semibold text-slate-700">Confirm Password</label>
              <div className="relative flex items-center gap-2.5 border border-[#ddd6cc] bg-[#faf9f7] px-3 py-2.5 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all">
                <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" className="flex-1 text-xs bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400 font-sansation pr-5" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-1 bg-[#7a3e0b] hover:bg-[#633209] disabled:opacity-60 text-white text-[11px] font-bold tracking-[0.18em] uppercase transition-colors cursor-pointer font-sansation"
            >
              {isSubmitting ? 'CREATING ACCOUNT...' : 'SIGN UP'}
            </button>
          </form>

          {/* OR */}
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-[#e0d9d0]" />
            <span className="text-[10px] font-semibold text-slate-400 font-sansation tracking-wider">OR</span>
            <span className="flex-1 h-px bg-[#e0d9d0]" />
          </div>

          {/* Google Sign In */}
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={(err) => setErrorMessage(err)}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            text="Continue with Google"
          />

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-600 font-sansation">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#7a3e0b] hover:underline">Login</Link>
          </p>

        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#030303] text-white px-4 py-2.5 shadow-xl flex items-center gap-2.5 border border-white/10 animate-in slide-in-from-bottom-4 duration-300 font-sansation">
          <div className="w-4 h-4 bg-[#7a3e0b] flex items-center justify-center flex-shrink-0">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-[11px]">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#89591C] border-t-transparent rounded-full animate-spin" /></div>}>
      <SignupContent />
    </Suspense>
  );
}
