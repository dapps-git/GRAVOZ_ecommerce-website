'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, KeyRound, ArrowLeft, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { forgotPassword, resetPassword } from '@/lib/auth-client';
import { playSuccessSound } from '@/lib/sounds';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1: 'email' (request OTP), Step 2: 'otp_reset' (enter OTP & new password)
  const [step, setStep] = useState<'email' | 'otp_reset'>('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Resend OTP countdown
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Lock body scroll
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res: any = await forgotPassword(email.trim());
      if (res.success) {
        setSuccessMessage(res.message || 'OTP sent to your email!');
        if (res.devOtp) setDevOtp(res.devOtp);
        setStep('otp_reset');
        setCountdown(60); // 60s cooldown for resend
      } else {
        setErrorMessage(res.error || 'Failed to send OTP. Please try again.');
      }
    } catch {
      setErrorMessage('Network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res: any = await forgotPassword(email.trim());
      if (res.success) {
        setSuccessMessage('A fresh OTP has been sent to your email.');
        if (res.devOtp) setDevOtp(res.devOtp);
        setCountdown(60);
      } else {
        setErrorMessage(res.error || 'Failed to resend OTP.');
      }
    } catch {
      setErrorMessage('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      if (res.success) {
        playSuccessSound();
        setSuccessMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Failed to reset password. Please check your OTP.');
      }
    } catch {
      setErrorMessage('Network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden font-sansation">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/auth.webp"
          alt="GRAVOZ Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] mx-4 flex flex-col gap-4">
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
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-md shadow-2xl border border-white/60 px-8 py-7 flex flex-col gap-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#7a3e0b]">
              {step === 'email' ? 'Forgot Password?' : 'Enter OTP & New Password'}
            </h1>
            <p className="text-[11px] text-slate-500 mt-1">
              {step === 'email'
                ? "Enter your registered email to receive a 6-digit OTP"
                : `We sent a 6-digit OTP code to ${email}`}
            </p>
          </div>

          {/* Dev OTP helper banner */}
          {devOtp && (
            <div className="bg-amber-50 border border-amber-300 p-2.5 rounded text-[11px] text-amber-900 font-semibold text-center">
              🔑 Dev OTP: <span className="font-mono text-sm tracking-widest text-amber-950 font-bold">{devOtp}</span>
            </div>
          )}

          {/* Success / Error alerts */}
          {errorMessage && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 px-3 py-2 text-rose-700 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-800 text-[11px]">
              <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Your Email Address</label>
                <div className="flex items-center gap-2.5 border border-[#ddd6cc] bg-[#faf9f7] px-3 py-2.5 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="flex-1 text-xs bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#7a3e0b] hover:bg-[#633209] disabled:opacity-60 text-white text-[11px] font-bold tracking-[0.18em] uppercase transition-colors cursor-pointer"
              >
                {isSubmitting ? 'SENDING OTP...' : 'SEND OTP CODE'}
              </button>

              <div className="text-center pt-1">
                <Link href="/login" className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#7a3e0b]">
                  <ArrowLeft className="w-3 h-3" /> Back to Login
                </Link>
              </div>
            </form>
          ) : (
            /* STEP 2: Enter OTP & New Password */
            <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
              {/* 6-Digit OTP */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700">6-Digit OTP Code</label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || isSubmitting}
                    className="text-[10.5px] font-semibold text-[#7a3e0b] hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
                <div className="flex items-center gap-2.5 border border-[#ddd6cc] bg-[#faf9f7] px-3 py-2.5 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 text-sm tracking-widest font-mono font-bold bg-transparent focus:outline-none text-[#030303] placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-xs"
                    required
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">New Password</label>
                <div className="relative flex items-center gap-2.5 border border-[#ddd6cc] bg-[#faf9f7] px-3 py-2.5 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all">
                  <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="flex-1 text-xs bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400 pr-6"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Confirm New Password</label>
                <div className="flex items-center gap-2.5 border border-[#ddd6cc] bg-[#faf9f7] px-3 py-2.5 focus-within:border-[#7a3e0b] focus-within:ring-1 focus-within:ring-[#7a3e0b]/20 transition-all">
                  <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="flex-1 text-xs bg-transparent focus:outline-none text-[#030303] placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 mt-1 bg-[#7a3e0b] hover:bg-[#633209] disabled:opacity-60 text-white text-[11px] font-bold tracking-[0.18em] uppercase transition-colors cursor-pointer"
              >
                {isSubmitting ? 'UPDATING PASSWORD...' : 'RESET PASSWORD'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
