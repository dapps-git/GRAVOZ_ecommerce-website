'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import {
  ShoppingBag,
  MapPin,
  CreditCard,
  FileCheck2,
  Check,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Tag,
  Plus,
  Lock,
  ArrowRight,
  ArrowLeft,
  Building2,
  Loader2,
  X,
  Mail,
  Package,
  Truck,
  Gift,
  Calendar,
  Headphones,
  Sparkles,
} from 'lucide-react';

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
  label?: string;
}

type CheckoutStep = 'cart' | 'address' | 'payment' | 'success';
type PaymentMethodType = 'UPI' | 'Card' | 'NetBanking' | 'Wallet' | 'COD';

const DEFAULT_ADDRESS: SavedAddress = {
  id: 'addr_1',
  name: 'Sarah Johnson',
  phone: '+91 98765 43210',
  street: '123, Green Park Street, Anna Nagar',
  city: 'Chennai',
  state: 'Tamil Nadu',
  postalCode: '600040',
  country: 'India',
  isDefault: true,
  label: 'Home',
};

const SECONDARY_ADDRESS: SavedAddress = {
  id: 'addr_2',
  name: 'John Doe',
  phone: '+91 91234 56789',
  street: '456, 5th Cross Street, T. Nagar',
  city: 'Chennai',
  state: 'Tamil Nadu',
  postalCode: '600017',
  country: 'India',
  isDefault: false,
  label: 'Office',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading: userLoading } = useUser();
  const { items, subtotal, clearCart } = useCart();

  // Current Step: 'cart' -> 'address' -> 'payment' -> 'success'
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');

  // Addresses State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([
    DEFAULT_ADDRESS,
    SECONDARY_ADDRESS,
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr_1');

  // Add/Edit Address Modal
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressFormData, setAddressFormData] = useState<Omit<SavedAddress, 'id'>>({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
    label: 'Home',
  });
  const [formError, setFormError] = useState('');

  // Coupon State
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; description: string } | null>({
    code: 'STYLE20',
    discount: 199,
    description: 'Special Launch Discount',
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('UPI');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [orderError, setOrderError] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState<number>(10);

  // Auto-redirect to tracking order page after 10 seconds
  useEffect(() => {
    if (currentStep === 'success' && placedOrder) {
      const targetId = placedOrder._id || placedOrder.orderNumber;
      const timer = setTimeout(() => {
        router.push(`/orders/${targetId}`);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, placedOrder, router]);

  // Protect route
  useEffect(() => {
    if (!userLoading && !isLoggedIn) {
      router.push('/login?redirect=/checkout');
    }
  }, [userLoading, isLoggedIn, router]);

  // Sync user profile to primary address if available
  useEffect(() => {
    if (user?.name) {
      setSavedAddresses((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          name: user.name,
          phone: user.phone || updated[0].phone,
        };
        return updated;
      });
    }
  }, [user]);

  // Celebration audio chime
  function playOrderSuccessSound() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Harmonic warm chime chords (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 1.0);
      });
    } catch {
      // ignore
    }
  }

  // Confetti Popper Canvas Component
  function ConfettiPopper() {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const colors = ['#89591C', '#C19968', '#557244', '#f59e0b', '#3b82f6', '#ec4899', '#eab308'];
      const particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        color: string;
        rotation: number;
        vRot: number;
        opacity: number;
      }> = [];

      for (let i = 0; i < 90; i++) {
        particles.push({
          x: canvas.width * 0.5 + (Math.random() - 0.5) * 260,
          y: canvas.height * 0.35 + (Math.random() - 0.5) * 60,
          vx: (Math.random() - 0.5) * 18,
          vy: -Math.random() * 14 - 4,
          size: Math.random() * 9 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 12,
          opacity: 1,
        });
      }

      let animationFrame: number;
      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;

        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.38; // gravity
          p.vx *= 0.98;
          p.rotation += p.vRot;
          p.opacity -= 0.007;

          if (p.opacity > 0) {
            alive = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
            ctx.restore();
          }
        }

        if (alive) {
          animationFrame = requestAnimationFrame(render);
        }
      };

      render();

      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />
    );
  }

  // Active address object
  const activeAddress =
    savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0] || DEFAULT_ADDRESS;

  // Pricing Calculations
  const calculatedDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const shippingFee = 0; // Free
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const finalTotal = Math.max(0, subtotal - calculatedDiscount + shippingFee);

  // Address Handlers
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      street: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '',
      country: 'India',
      isDefault: savedAddresses.length === 0,
      label: 'Home',
    });
    setFormError('');
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddressFormData({
      name: addr.name,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault || false,
      label: addr.label || 'Home',
    });
    setFormError('');
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, phone, street, city, state, postalCode } = addressFormData;
    if (!name || !phone || !street || !city || !state || !postalCode) {
      setFormError('Please fill out all required fields.');
      return;
    }
    if (!/^\d{6}$/.test(postalCode)) {
      setFormError('Please enter a valid 6-digit PIN Code.');
      return;
    }

    if (editingAddressId) {
      setSavedAddresses((prev) =>
        prev.map((a) =>
          a.id === editingAddressId ? { ...addressFormData, id: editingAddressId } : a
        )
      );
    } else {
      const newId = 'addr_' + Date.now();
      setSavedAddresses((prev) => [...prev, { ...addressFormData, id: newId }]);
      setSelectedAddressId(newId);
    }
    setIsAddressModalOpen(false);
  };

  // Place Order Handler with simulated transition loading
  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setOrderError('');

    // Minimum delay to show the nice "Placing Your Order..." screen
    const [_, result] = await Promise.all([
      new Promise((r) => setTimeout(r, 1400)),
      (async () => {
        try {
          const payload = {
            customerId: (user as any)?._id || '',
            customerEmail: user?.email || 'customer@gravoz.com',
            customerName: activeAddress.name,
            customerPhone: activeAddress.phone,
            shippingAddress: {
              name: activeAddress.name,
              phone: activeAddress.phone,
              street: activeAddress.street,
              city: activeAddress.city,
              state: activeAddress.state,
              postalCode: activeAddress.postalCode,
              country: activeAddress.country,
            },
            items: items.map((itm) => ({
              productId: itm.productId,
              name: itm.title,
              price: itm.price,
              originalPrice: itm.originalPrice,
              quantity: itm.quantity,
              size: itm.size,
              color: itm.color,
              imageUrl: itm.imageUrl,
            })),
            subtotal,
            discountAmount: calculatedDiscount,
            couponCode: appliedCoupon?.code || '',
            shippingFee,
            totalAmount: finalTotal,
            paymentMethod,
          };

          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          return await res.json();
        } catch (err: any) {
          return { error: err.message || 'Network error' };
        }
      })(),
    ]);

    if (result && result.success && result.order) {
      setPlacedOrder(result.order);
      clearCart();
      setIsPlacingOrder(false);
      setCurrentStep('success');
      playOrderSuccessSound();
    } else {
      setIsPlacingOrder(false);
      setOrderError(result?.error || 'Failed to complete order. Please try again.');
    }
  };

  // ── Stepper Component matching exact screenshot design ──
  const renderStepper = () => {
    const steps = [
      { id: 'cart', label: 'Cart', icon: ShoppingBag },
      { id: 'address', label: 'Address', icon: MapPin },
      { id: 'payment', label: 'Payment', icon: CreditCard },
      { id: 'place_order', label: 'Place Order', icon: FileCheck2 },
    ];

    const activeIdx =
      currentStep === 'cart'
        ? 0
        : currentStep === 'address'
        ? 1
        : currentStep === 'payment'
        ? 2
        : 3;

    const getStepState = (stepId: string, index: number) => {
      if (index < activeIdx) return 'completed';
      if (index === activeIdx) return 'active';
      return 'upcoming';
    };

    return (
      <div className="w-full max-w-2xl mx-auto mb-8 sm:mb-10 px-2 font-montserrat">
        <div className="relative flex items-start justify-between">
          {/* Absolute Background Line */}
          <div className="absolute top-4 sm:top-5 left-6 right-6 h-[2px] bg-[#e8e2d8] z-0">
            <div
              className="h-full bg-[#557244] transition-all duration-500"
              style={{
                width: `${(activeIdx / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          {steps.map((step, i) => {
            const state = getStepState(step.id, i);
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center relative z-10 flex-1 max-w-[72px] sm:max-w-[100px] text-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                    state === 'completed'
                      ? 'bg-[#557244] text-white shadow-xs border border-[#557244]'
                      : state === 'active'
                      ? 'bg-[#89591C] text-white shadow-xs ring-3 sm:ring-4 ring-[#89591C]/20 border border-[#89591C]'
                      : 'bg-white border border-[#d8cebe] text-slate-400'
                  }`}
                >
                  {state === 'completed' ? (
                    <Check className="w-4 h-4 text-white stroke-[2.5]" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${state === 'active' ? 'text-white' : 'text-slate-400'}`} />
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 capitalize ${
                    state === 'active'
                      ? 'font-semibold text-[#030303]'
                      : state === 'completed'
                      ? 'font-medium text-[#557244]'
                      : 'font-normal text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Order Summary Sidebar Component ──
  const renderOrderSummary = (ctaButtonText: string, onCtaClick: () => void) => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#e8e2d8] p-5 sm:p-6 shadow-2xs space-y-4 font-sansation">
        <h3 className="text-base font-bold text-[#030303]">Order Summary</h3>

        <div className="space-y-2.5 text-xs text-slate-600 divide-y divide-[#f0ece5] pt-1">
          <div className="flex justify-between py-1">
            <span>Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})</span>
            <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between py-2">
            <span>Shipping</span>
            <span className="font-semibold text-emerald-700">₹0</span>
          </div>

          {calculatedDiscount > 0 && (
            <div className="flex justify-between py-2 text-slate-700">
              <span>Discount</span>
              <span className="font-semibold text-slate-900">- ₹{calculatedDiscount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="flex justify-between pt-3 pb-1 text-base font-bold text-[#030303]">
            <div>
              <span>Total</span>
              <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                (Inclusive of all taxes)
              </span>
            </div>
            <span className="text-lg font-extrabold text-[#030303]">
              ₹{finalTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* You will save banner */}
        {calculatedDiscount > 0 && (
          <div className="bg-[#f0f8ec] border border-[#d2eac3] rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-[#3b6e22]">
            <CheckCircle2 className="w-4 h-4 text-[#4f8a32] flex-shrink-0" />
            <span>You will save ₹{calculatedDiscount.toLocaleString('en-IN')} on this order</span>
          </div>
        )}

        {/* Action CTA Button */}
        <button
          type="button"
          disabled={isPlacingOrder || (currentStep === 'cart' && items.length === 0)}
          onClick={onCtaClick}
          className="w-full h-11 sm:h-12 rounded-xl bg-[#1c1c1c] hover:bg-[#030303] text-white text-xs sm:text-sm font-medium tracking-wider uppercase transition-all shadow-2xs hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 font-montserrat"
        >
          <span>{ctaButtonText}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* SSL Safe & Secure Card */}
      {currentStep === 'payment' && (
        <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-2xl p-4 flex items-start gap-3 text-xs font-sansation">
          <ShieldCheck className="w-5 h-5 text-[#89591C] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-[#030303]">Safe & Secure Payments</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Your transaction is protected with 256-bit SSL encryption.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // ── Bottom 3 Trust Badges (1 Row on Mobile) ──
  const renderBottomTrustBadges = () => (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-3 pt-4 sm:pt-6 font-sansation">
      <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-xl py-2 sm:py-3 px-1.5 sm:px-4 flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-1 sm:gap-2 text-[10px] sm:text-xs font-normal sm:font-medium text-slate-700 shadow-2xs">
        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#89591C] flex-shrink-0" />
        <span className="leading-tight">100% Secure Payments</span>
      </div>
      <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-xl py-2 sm:py-3 px-1.5 sm:px-4 flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-1 sm:gap-2 text-[10px] sm:text-xs font-normal sm:font-medium text-slate-700 shadow-2xs">
        <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#89591C] flex-shrink-0" />
        <span className="leading-tight">Easy 7-Day Returns</span>
      </div>
      <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-xl py-2 sm:py-3 px-1.5 sm:px-4 flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-1 sm:gap-2 text-[10px] sm:text-xs font-normal sm:font-medium text-slate-700 shadow-2xs">
        <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#89591C] flex-shrink-0" />
        <span className="leading-tight">Genuine Products</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#030303] font-sans flex flex-col justify-between selection:bg-[#89591C]/20 selection:text-[#89591C]">
      <Header />

      {/* "PLACING YOUR ORDER..." FULLSCREEN OVERLAY */}
      {isPlacingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm animate-in fade-in duration-200 font-montserrat">
          <div className="max-w-sm w-full text-center px-6 py-10 space-y-6">
            {/* Spinner & Paper Bag Graphic */}
            <div className="relative flex flex-col items-center justify-center">
              {/* Spinning warm circle */}
              <div className="w-12 h-12 rounded-full border-4 border-[#e8e2d8] border-t-[#89591C] animate-spin mb-4" />

              {/* Handcrafted Paper bag image */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 relative flex items-center justify-center">
                <Image
                  src="/images/bag.webp"
                  alt="Placing Order"
                  width={128}
                  height={128}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
            </div>

            <div className="space-y-1.5 font-montserrat">
              <h2 className="text-lg sm:text-xl font-semibold text-[#030303]">Placing Your Order...</h2>
              <p className="text-xs text-slate-500 font-normal">Please wait while we confirm your order.</p>
            </div>

            {/* Warning Pill */}
            <div className="inline-flex items-center gap-1.5 bg-[#faf8f5] border border-[#e8e2d8] px-3.5 py-2 rounded-xl text-[11px] text-slate-600 font-normal shadow-2xs font-montserrat">
              <span className="text-[#89591C]">⏱</span>
              <span>Do not press back or close this page.</span>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STAGE 4: ORDER PLACED SUCCESSFULLY PAGE (Matches Screenshot 3)     */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 'success' && placedOrder ? (
        <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-8 sm:py-12 space-y-10 font-sansation relative">
          <ConfettiPopper />

          {/* Top Hero Banner with Pure White Background & Enlarged Bag Graphic */}
          <div className="relative bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-[#e8e2d8] flex flex-col items-center justify-center text-center overflow-hidden shadow-2xs">
            {/* Bag Image - Large & Crisp on Pure White Background */}
            <div className="w-48 h-48 sm:w-60 sm:h-60 md:w-68 md:h-68 flex items-center justify-center flex-shrink-0 mb-3 animate-in zoom-in-95 duration-500">
              <Image
                src="/images/bag.webp"
                alt="Order Placed Successfully"
                width={272}
                height={272}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            <div className="space-y-2.5 max-w-lg mx-auto font-montserrat">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold text-[#030303] tracking-tight">
                Order Placed Successfully!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                Thank you for shopping with Gravoz. We have received your order and will send you an email confirmation with all the details.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <span className="inline-block bg-[#faf8f5] border border-[#e8e2d8] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 shadow-2xs">
                  Order ID: <span className="text-[#89591C] font-semibold">{placedOrder.orderNumber}</span>
                </span>
                <button
                  type="button"
                  onClick={() => router.push(`/orders/${placedOrder._id || placedOrder.orderNumber}`)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#89591C] hover:bg-[#724816] text-white px-6 py-2 rounded-xl font-medium text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>Track Order</span>
                </button>
              </div>
            </div>
          </div>

          {/* Two-Column Lower Section: Order Summary & Order Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Left: ORDER SUMMARY */}
            <div className="bg-white rounded-2xl border border-[#e8e2d8] p-5 sm:p-6 shadow-2xs space-y-4 font-montserrat">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Order Summary
              </h3>

              <div className="divide-y divide-[#f0ece5]">
                {placedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-[#faf8f5] p-1 border border-[#e8e2d8] overflow-hidden flex-shrink-0">
                        <Image
                          src={item.imageUrl || '/products/placeholder.svg'}
                          alt={item.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs sm:text-sm font-medium text-[#030303] truncate">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-normal">
                          Size: {item.size} • Qty: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs sm:text-sm font-semibold text-[#030303] flex-shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#f0ece5] pt-3 space-y-2 text-xs text-slate-600 font-normal">
                <div className="flex justify-between">
                  <span>Subtotal ({placedOrder.items?.reduce((s: number, i: any) => s + i.quantity, 0)} items)</span>
                  <span className="font-medium text-slate-800">₹{placedOrder.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-emerald-700">₹0</span>
                </div>
                {placedOrder.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="font-medium text-slate-800">- ₹{placedOrder.discountAmount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base font-semibold text-[#030303] pt-2 border-t border-[#f0ece5]">
                  <span>Total <span className="text-[10px] font-normal text-slate-400">(Inclusive of all taxes)</span></span>
                  <span className="text-base sm:text-lg font-bold text-[#89591C]">₹{placedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Right: ORDER DETAILS */}
            <div className="bg-white rounded-2xl border border-[#e8e2d8] p-5 sm:p-6 shadow-2xs space-y-5 text-xs font-montserrat">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Order Details
              </h3>

              <div className="space-y-4 text-slate-600">
                {/* Order Date */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#faf8f5] border border-[#e8e2d8] flex items-center justify-center flex-shrink-0 text-[#89591C]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#030303]">Order Date</h4>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                      {new Date(placedOrder.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(placedOrder.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#faf8f5] border border-[#e8e2d8] flex items-center justify-center flex-shrink-0 text-[#89591C]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#030303]">Delivery Address</h4>
                    <p className="font-medium text-slate-800 mt-0.5">{placedOrder.shippingAddress?.name}</p>
                    <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                      {placedOrder.shippingAddress?.street}, {placedOrder.shippingAddress?.city} - {placedOrder.shippingAddress?.postalCode}
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal">{placedOrder.shippingAddress?.state}, {placedOrder.shippingAddress?.country}</p>
                    <p className="text-[11px] text-slate-800 font-medium mt-0.5">{placedOrder.customerPhone}</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#faf8f5] border border-[#e8e2d8] flex items-center justify-center flex-shrink-0 text-[#89591C]">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#030303]">Payment Method</h4>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                      {placedOrder.paymentMethod} • {placedOrder.paymentStatus === 'paid' ? `Paid ₹${placedOrder.totalAmount?.toLocaleString('en-IN')}` : 'Pay on Delivery'}
                    </p>
                  </div>
                </div>

                {/* Need Help? */}
                <div className="flex items-start gap-3 pt-1 border-t border-[#f0ece5]">
                  <div className="w-8 h-8 rounded-xl bg-[#faf8f5] border border-[#e8e2d8] flex items-center justify-center flex-shrink-0 text-[#89591C]">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#030303]">Need Help?</h4>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                      We&apos;re here for you. Contact our support team anytime.
                    </p>
                    <p className="text-[11px] text-[#89591C] font-medium mt-0.5">
                      gravozcontact@gmail.com | +91 00000 00000
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Link to Track Order */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push(`/orders/${placedOrder._id || placedOrder.orderNumber}`)}
                  className="w-full h-10 sm:h-11 rounded-xl bg-[#89591C] hover:bg-[#724816] text-white text-xs font-medium uppercase tracking-wider shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer font-montserrat"
                >
                  <Truck className="w-4 h-4" />
                  <span>Track Order Timeline</span>
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Dual Promo Banners (Invite & Earn / Shop More Styles) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Promo 1 */}
            <div className="bg-[#fbf7f0] border border-[#e8e2d8] rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#89591C]/15 text-[#89591C] flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#030303] font-montserrat">Invite & Earn</h4>
                  <p className="text-[11px] text-slate-500">Refer your friends and earn exciting rewards.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/profile?tab=rewards')}
                className="px-4 py-2 bg-white hover:bg-[#faf8f5] text-[#89591C] border border-[#e8e2d8] rounded-xl text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer flex-shrink-0 font-montserrat"
              >
                REFER NOW
              </button>
            </div>

            {/* Promo 2 */}
            <div className="bg-[#fbf7f0] border border-[#e8e2d8] rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#89591C]/15 text-[#89591C] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#030303] font-montserrat">Shop More Styles</h4>
                  <p className="text-[11px] text-slate-500">Explore our latest footwear collections.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-[#89591C] hover:bg-[#724816] text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer flex-shrink-0"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          </div>

          {/* 4 Feature Highlights Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-3.5 flex items-center gap-3 text-xs">
              <Tag className="w-5 h-5 text-[#89591C] flex-shrink-0" />
              <div>
                <h5 className="font-bold text-[#030303]">100% Original</h5>
                <p className="text-[10px] text-slate-500">Sourced from trusted makers</p>
              </div>
            </div>
            <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-3.5 flex items-center gap-3 text-xs">
              <RotateCcw className="w-5 h-5 text-[#89591C] flex-shrink-0" />
              <div>
                <h5 className="font-bold text-[#030303]">Easy Returns</h5>
                <p className="text-[10px] text-slate-500">Hassle-free 7-day policy</p>
              </div>
            </div>
            <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-3.5 flex items-center gap-3 text-xs">
              <CreditCard className="w-5 h-5 text-[#89591C] flex-shrink-0" />
              <div>
                <h5 className="font-bold text-[#030303]">Secure Payments</h5>
                <p className="text-[10px] text-slate-500">100% safe & protected</p>
              </div>
            </div>
            <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-3.5 flex items-center gap-3 text-xs">
              <Headphones className="w-5 h-5 text-[#89591C] flex-shrink-0" />
              <div>
                <h5 className="font-bold text-[#030303]">Customer Support</h5>
                <p className="text-[10px] text-slate-500">We are here to help</p>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Regular Checkout Stages (Cart Overview, Address Selection, Payment Options) */
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-5 sm:py-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-medium sm:font-semibold text-[#030303] font-sansation mb-4 sm:mb-6 uppercase tracking-wider">
            Checkout
          </h1>

          {/* Visual Stepper */}
          {renderStepper()}

          {/* STAGE 1: CART OVERVIEW & ACTIVE DELIVERY ADDRESS */}
          {currentStep === 'cart' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                <div className="lg:col-span-7 xl:col-span-8 space-y-5">
                  
                  {/* Delivery Address Card */}
                  <div className="bg-white rounded-2xl border border-[#e8e2d8] p-4 sm:p-6 shadow-2xs font-sansation space-y-3">
                    <div className="flex items-center justify-between border-b border-[#f0ece5] pb-2.5">
                      <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-800">Delivery Address</h3>
                      <button
                        type="button"
                        onClick={() => setCurrentStep('address')}
                        className="text-xs font-semibold text-[#89591C] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <div className="w-8 h-8 rounded-full bg-[#faf4ec] text-[#89591C] border border-[#e8e2d8] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <h4 className="font-bold text-sm text-[#030303]">{activeAddress.name}</h4>
                        <p className="leading-relaxed">{activeAddress.street},</p>
                        <p className="leading-relaxed">
                          {activeAddress.city} - {activeAddress.postalCode}
                        </p>
                        <p className="leading-relaxed">{activeAddress.state}, {activeAddress.country}</p>
                        <p className="font-semibold text-slate-800 pt-0.5">{activeAddress.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items in Cart Card */}
                  <div className="bg-white rounded-2xl border border-[#e8e2d8] p-4 sm:p-6 shadow-2xs font-sansation space-y-3">
                    <div className="flex items-center justify-between border-b border-[#f0ece5] pb-2.5">
                      <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-800">
                        Items in Cart ({totalItemCount})
                      </h3>
                      <Link
                        href="/cart"
                        className="text-xs font-semibold text-[#89591C] hover:underline"
                      >
                        Edit Cart
                      </Link>
                    </div>

                    <div className="divide-y divide-[#f0ece5]">
                      {items.map((item, idx) => (
                        <div key={idx} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#faf8f5] p-1 border border-[#e8e2d8] overflow-hidden flex-shrink-0">
                              <Image
                                src={item.imageUrl || '/products/placeholder.svg'}
                                alt={item.title}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-[#030303] truncate">
                                {item.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Size: {item.size} {item.color ? `• Color: ${item.color}` : ''} • Qty: {item.quantity}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-sm font-bold text-[#030303]">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="lg:col-span-5 xl:col-span-4">
                  {renderOrderSummary('CONTINUE TO ADDRESS', () => setCurrentStep('address'))}
                </div>
              </div>

              {renderBottomTrustBadges()}
            </div>
          )}

          {/* STAGE 2: DELIVERY ADDRESS SELECTION */}
          {currentStep === 'address' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 font-sansation">
              <div>
                <button
                  type="button"
                  onClick={() => setCurrentStep('cart')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#89591C] mb-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-[#030303]">Delivery Address</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose where you want your order to be delivered
                </p>
              </div>

              <div className="space-y-3.5">
                {savedAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;

                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`rounded-2xl p-5 border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#89591C] bg-[#faf6f0] shadow-xs'
                          : 'border-[#e8e2d8] bg-white hover:border-[#cfc3b2]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isSelected
                                ? 'border-[#89591C] bg-[#89591C]'
                                : 'border-[#cfc3b2] bg-white'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>

                          <div className="space-y-1 text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#030303]">{addr.name}</span>
                              {addr.isDefault && (
                                <span className="text-[10px] font-semibold bg-[#ece3d4] text-[#714614] px-2 py-0.5 rounded-md">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="leading-relaxed">{addr.street},</p>
                            <p className="leading-relaxed">
                              {addr.city} - {addr.postalCode}
                            </p>
                            <p className="leading-relaxed">
                              {addr.state}, {addr.country} • <strong className="text-slate-800">{addr.phone}</strong>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditAddress(addr);
                          }}
                          className="text-xs font-bold text-[#89591C] hover:underline flex-shrink-0"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="w-full py-4 rounded-2xl border border-dashed border-[#cfc3b2] bg-[#faf8f5] hover:bg-[#f5ede2] text-xs font-bold text-[#030303] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4 text-[#89591C]" />
                  <span>Add New Address</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep('payment')}
                className="w-full h-12 rounded-xl bg-[#1c1c1c] hover:bg-[#030303] text-white text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>CONTINUE TO PAYMENT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STAGE 3: PAYMENT OPTIONS */}
          {currentStep === 'payment' && (
            <div className="space-y-6 animate-in fade-in duration-300 font-sansation">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                  <div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep('address')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#89591C] mb-2"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Address
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#030303]">Payment Options</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose a safe and convenient payment method
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* UPI */}
                    <div
                      onClick={() => setPaymentMethod('UPI')}
                      className={`rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'UPI'
                          ? 'border-[#89591C] bg-[#faf6f0] shadow-xs'
                          : 'border-[#e8e2d8] bg-white hover:border-[#cfc3b2]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === 'UPI'
                              ? 'border-[#89591C] bg-[#89591C]'
                              : 'border-[#cfc3b2] bg-white'
                          }`}
                        >
                          {paymentMethod === 'UPI' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#030303]">UPI</h4>
                          <p className="text-[11px] text-slate-500">Pay using any UPI app</p>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 bg-white border border-[#e8e2d8] rounded-md font-bold text-xs tracking-wider text-[#2e6b30] italic">
                        UPI ❯
                      </div>
                    </div>

                    {/* Card */}
                    <div
                      onClick={() => setPaymentMethod('Card')}
                      className={`rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'Card'
                          ? 'border-[#89591C] bg-[#faf6f0] shadow-xs'
                          : 'border-[#e8e2d8] bg-white hover:border-[#cfc3b2]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === 'Card'
                              ? 'border-[#89591C] bg-[#89591C]'
                              : 'border-[#cfc3b2] bg-white'
                          }`}
                        >
                          {paymentMethod === 'Card' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#030303]">Credit / Debit Card</h4>
                          <p className="text-[11px] text-slate-500">Visa, Mastercard, Rupay</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-[#1a1f71] text-white font-extrabold text-[10px] rounded italic">VISA</span>
                        <span className="px-2 py-0.5 bg-[#eb001b] text-white font-extrabold text-[10px] rounded">MC</span>
                      </div>
                    </div>

                    {/* Net Banking */}
                    <div
                      onClick={() => setPaymentMethod('NetBanking')}
                      className={`rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'NetBanking'
                          ? 'border-[#89591C] bg-[#faf6f0] shadow-xs'
                          : 'border-[#e8e2d8] bg-white hover:border-[#cfc3b2]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === 'NetBanking'
                              ? 'border-[#89591C] bg-[#89591C]'
                              : 'border-[#cfc3b2] bg-white'
                          }`}
                        >
                          {paymentMethod === 'NetBanking' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#030303]">Net Banking</h4>
                          <p className="text-[11px] text-slate-500">All major banks supported</p>
                        </div>
                      </div>
                      <Building2 className="w-5 h-5 text-slate-400" />
                    </div>

                    {/* Wallets */}
                    <div
                      onClick={() => setPaymentMethod('Wallet')}
                      className={`rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'Wallet'
                          ? 'border-[#89591C] bg-[#faf6f0] shadow-xs'
                          : 'border-[#e8e2d8] bg-white hover:border-[#cfc3b2]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === 'Wallet'
                              ? 'border-[#89591C] bg-[#89591C]'
                              : 'border-[#cfc3b2] bg-white'
                          }`}
                        >
                          {paymentMethod === 'Wallet' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#030303]">Wallets</h4>
                          <p className="text-[11px] text-slate-500">Paytm, PhonePe, Amazon Pay</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#002e6e] tracking-tight">Paytm</span>
                    </div>

                    {/* COD */}
                    <div
                      onClick={() => setPaymentMethod('COD')}
                      className={`rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'COD'
                          ? 'border-[#89591C] bg-[#faf6f0] shadow-xs'
                          : 'border-[#e8e2d8] bg-white hover:border-[#cfc3b2]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === 'COD'
                              ? 'border-[#89591C] bg-[#89591C]'
                              : 'border-[#cfc3b2] bg-white'
                          }`}
                        >
                          {paymentMethod === 'COD' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#030303]">Cash on Delivery</h4>
                          <p className="text-[11px] text-slate-500">Pay when you receive</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-[#e8f5e4] text-[#2e7422] px-2.5 py-1 rounded-md">
                        Available
                      </span>
                    </div>
                  </div>

                  {orderError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                      {orderError}
                    </div>
                  )}

                  <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                    <Lock className="w-4 h-4 text-[#89591C] flex-shrink-0" />
                    <span>Your payment information is safe with us.</span>
                  </div>
                </div>

                <div className="lg:col-span-5 xl:col-span-4">
                  {renderOrderSummary(
                    paymentMethod === 'COD'
                      ? `PLACE ORDER — ₹${finalTotal.toLocaleString('en-IN')}`
                      : `PAY ₹${finalTotal.toLocaleString('en-IN')}`,
                    handlePlaceOrder
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ── ADD / EDIT ADDRESS MODAL ── */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-sansation">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl border border-[#e8e2d8] relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAddressModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-[#030303]">
              {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter the exact shipping address where you wish to receive your items.
            </p>

            <form onSubmit={handleSaveAddress} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={addressFormData.name}
                    onChange={(e) => setAddressFormData({ ...addressFormData, name: e.target.value })}
                    placeholder="Recipient's Name"
                    className="w-full px-3 py-2 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl focus:outline-none focus:border-[#89591C]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={addressFormData.phone}
                    onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                    placeholder="+91 00000 00000"
                    className="w-full px-3 py-2 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl focus:outline-none focus:border-[#89591C]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  value={addressFormData.street}
                  onChange={(e) => setAddressFormData({ ...addressFormData, street: e.target.value })}
                  placeholder="House / Flat No., Building, Street, Area"
                  className="w-full px-3 py-2 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl focus:outline-none focus:border-[#89591C]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">City / Town *</label>
                  <input
                    type="text"
                    value={addressFormData.city}
                    onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl focus:outline-none focus:border-[#89591C]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={addressFormData.state}
                    onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-3 py-2 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl focus:outline-none focus:border-[#89591C]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    value={addressFormData.postalCode}
                    maxLength={6}
                    onChange={(e) =>
                      setAddressFormData({
                        ...addressFormData,
                        postalCode: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="6-Digit PIN Code"
                    className="w-full px-3 py-2 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl focus:outline-none focus:border-[#89591C]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={addressFormData.country}
                    onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl focus:outline-none focus:border-[#89591C]"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-xs text-rose-600 font-semibold">{formError}</p>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#89591C] hover:bg-[#724816] shadow-sm"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
