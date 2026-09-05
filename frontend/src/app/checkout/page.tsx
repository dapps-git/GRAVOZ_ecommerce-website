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

import {
  loadSavedAddresses,
  saveSavedAddresses,
  formatAddressToString,
  parseAddressFromString,
  SavedAddress,
} from '@/lib/addresses';

type CheckoutStep = 'cart' | 'address' | 'payment' | 'success';
type PaymentMethodType = 'UPI' | 'Card' | 'NetBanking' | 'Wallet' | 'COD';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading: userLoading, updateUser } = useUser();
  const { items, subtotal, clearCart } = useCart();

  // Current Step: 'cart' -> 'address' -> 'payment' -> 'success'
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');

  // Addresses State (loaded dynamically from real profile/storage)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

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

  // Load real saved addresses when component mounts or user updates
  useEffect(() => {
    const loaded = loadSavedAddresses(user);
    if (loaded.length > 0) {
      setSavedAddresses(loaded);
      const defaultOne = loaded.find((a) => a.isDefault) || loaded[0];
      setSelectedAddressId((prev) => (prev && loaded.some((a) => a.id === prev) ? prev : defaultOne.id));
    }
  }, [user]);

  // Coupon State
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; description: string } | null>(null);

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

  // Stock State
  const [productStockMap, setProductStockMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (items.length === 0) return;
    fetch('/api/products?limit=100')
      .then((r) => r.json())
      .then((data) => {
        if (data?.products && Array.isArray(data.products)) {
          const map: Record<string, number> = {};
          data.products.forEach((p: any) => {
            map[p._id] = p.stock !== undefined ? p.stock : 10;
            if (p.slug) map[p.slug] = p.stock !== undefined ? p.stock : 10;
          });
          setProductStockMap(map);
        }
      })
      .catch(() => {});
  }, [items]);

  const isItemOutOfStock = (item: any) => {
    const stock = productStockMap[item.productId];
    if (stock !== undefined) {
      return stock <= 0;
    }
    return item.stock !== undefined ? item.stock <= 0 : false;
  };

  const hasOutOfStockItems = items.some((item) => isItemOutOfStock(item));

  // Protect route
  useEffect(() => {
    if (!userLoading && !isLoggedIn) {
      router.push('/login?redirect=/checkout');
    }
  }, [userLoading, isLoggedIn, router]);

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
  const activeAddress: SavedAddress =
    savedAddresses.find((a) => a.id === selectedAddressId) ||
    savedAddresses[0] || {
      id: 'addr_temp',
      name: user?.name || '',
      phone: user?.phone || '',
      street: user?.address || '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '',
      country: 'India',
      isDefault: true,
      label: 'Home',
    };

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

    let updated: SavedAddress[];
    let targetId = editingAddressId;

    if (editingAddressId) {
      updated = savedAddresses.map((a) =>
        a.id === editingAddressId ? { ...addressFormData, id: editingAddressId } : a
      );
    } else {
      const newId = 'addr_' + Date.now();
      targetId = newId;
      const isFirst = savedAddresses.length === 0;
      const newAddr: SavedAddress = {
        ...addressFormData,
        id: newId,
        isDefault: isFirst || addressFormData.isDefault,
      };
      updated = isFirst ? [newAddr] : [...savedAddresses, newAddr];
      setSelectedAddressId(newId);
    }

    setSavedAddresses(updated);
    saveSavedAddresses(updated);

    // Bidirectional sync to profile
    const activeOne = updated.find((a) => a.id === (targetId || selectedAddressId)) || updated[0];
    if (activeOne) {
      updateUser({
        name: activeOne.name,
        phone: activeOne.phone,
        address: formatAddressToString(activeOne),
      });
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
          const cleanPin =
            (activeAddress.postalCode && activeAddress.postalCode.trim()) ||
            (activeAddress.street && (activeAddress.street.match(/\b\d{6}\b/) || [])[0]) ||
            '600040';

          const payload = {
            customerId: (user as any)?._id || '',
            customerEmail: user?.email || 'customer@gravoz.com',
            customerName: activeAddress.name || user?.name || 'Customer',
            customerPhone: activeAddress.phone || user?.phone || '',
            shippingAddress: {
              name: activeAddress.name || user?.name || 'Customer',
              phone: activeAddress.phone || user?.phone || '',
              street: activeAddress.street || user?.address || 'Street Address',
              city: activeAddress.city || 'Chennai',
              state: activeAddress.state || 'Tamil Nadu',
              postalCode: cleanPin,
              country: activeAddress.country || 'India',
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

  // ── Stepper Component matching exact UI Style Guide design ──
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
      <div className="w-full max-w-xl mx-auto mb-6 sm:mb-8 px-2 font-poppins">
        <div className="relative flex items-center justify-between">
          {/* Background Connecting Line */}
          <div className="absolute top-4 sm:top-4.5 left-8 right-8 h-[2px] bg-[#E8E1D9] z-0">
            <div
              className="h-full bg-[#4F7D45] transition-all duration-500"
              style={{
                width: `${(activeIdx / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          {steps.map((step, i) => {
            const state = getStepState(step.id, i);
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center relative z-10 flex-1 text-center">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                    state === 'completed'
                      ? 'bg-[#4F7D45] text-white shadow-xs'
                      : state === 'active'
                      ? 'bg-[#8B4A12] text-white shadow-xs'
                      : 'bg-white border border-[#D8D0C7] text-[#98A2B3]'
                  }`}
                >
                  {state === 'completed' ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2.5]" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${state === 'active' ? 'text-white' : 'text-[#98A2B3]'}`} />
                  )}
                </div>
                <span
                  className={`text-[9px] sm:text-[10px] mt-1.5 ${
                    state === 'completed'
                      ? 'text-[#4F7D45] font-medium'
                      : state === 'active'
                      ? 'text-[#8B4A12] font-semibold'
                      : 'text-[#98A2B3] font-normal'
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
    <div className="space-y-4 font-poppins">
      <div className="bg-white rounded-[14px] border border-[#E8E1D9] p-4 sm:p-5 shadow-gravoz space-y-4">
        <h3 className="text-[15px] sm:text-[17px] font-semibold text-[#171717]">ORDER SUMMARY</h3>

        <div className="space-y-2.5 text-[11px] divide-y divide-[#F0ECE5] pt-1">
          <div className="flex justify-between py-1 text-[#667085]">
            <span>Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})</span>
            <span className="font-semibold text-[#171717]">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between py-2 text-[#667085]">
            <span>Shipping</span>
            <span className="font-semibold text-[#16A34A]">FREE</span>
          </div>

          {calculatedDiscount > 0 && (
            <div className="flex justify-between py-2 text-[#16A34A]">
              <span>Discount</span>
              <span className="font-semibold">- ₹{calculatedDiscount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="flex justify-between pt-3 pb-1 text-[15px] sm:text-[17px] font-bold text-[#171717]">
            <div>
              <span>Total Amount</span>
              <span className="block text-[10px] text-[#667085] font-normal mt-0.5">
                (Inclusive of all taxes)
              </span>
            </div>
            <span className="text-[17px] sm:text-[19px] font-bold text-[#8B4A12]">
              ₹{finalTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* You will save banner */}
        {calculatedDiscount > 0 && (
          <div className="bg-[#F0F8EC] border border-[#D2EAC3] rounded-[10px] p-2.5 flex items-center gap-2 text-[11px] font-semibold text-[#16A34A]">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
            <span>You will save ₹{calculatedDiscount.toLocaleString('en-IN')} on this order</span>
          </div>
        )}

        {/* Action CTA Button */}
        {hasOutOfStockItems ? (
          <div className="space-y-1.5">
            <button
              type="button"
              disabled
              className="w-full h-[42px] sm:h-[46px] rounded-[10px] bg-[#ede8e1] text-[#888888] text-xs sm:text-[13px] font-semibold tracking-wider uppercase flex items-center justify-center gap-2 cursor-not-allowed border border-[#d8d2c8] font-poppins"
            >
              <span>Out of Stock</span>
            </button>
            <p className="text-[10px] text-rose-600 font-semibold text-center leading-tight">
              Remove out-of-stock items from your cart to proceed.
            </p>
          </div>
        ) : (
          <button
            type="button"
            disabled={isPlacingOrder || (currentStep === 'cart' && items.length === 0)}
            onClick={onCtaClick}
            className="w-full h-[42px] sm:h-[46px] rounded-[10px] bg-[#8B4A12] hover:bg-[#6F390C] text-white text-xs sm:text-[13px] font-semibold tracking-wider uppercase transition-all shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 font-poppins"
          >
            <span>{ctaButtonText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* SSL Safe & Secure Card */}
      {currentStep === 'payment' && (
        <div className="bg-[#FAF8F5] border border-[#E8E1D9] rounded-[14px] p-3.5 flex items-start gap-2.5 text-xs font-poppins shadow-gravoz">
          <ShieldCheck className="w-4 h-4 text-[#8B4A12] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-[12px] text-[#171717]">Safe & Secure Payments</h4>
            <p className="text-[10px] text-[#667085] mt-0.5 leading-relaxed">
              Your transaction is protected with 256-bit SSL encryption.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // ── Bottom 3 Trust Badges (Matching Screenshot) ──
  const renderBottomTrustBadges = () => (
    <div className="bg-[#FAF8F5] rounded-[14px] border border-[#E8E1D9] p-3.5 sm:p-4 grid grid-cols-3 gap-2 text-left shadow-gravoz mt-6 font-poppins">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2.5 text-center sm:text-left">
        <div className="w-8 h-8 rounded-full bg-white border border-[#E8E1D9] flex items-center justify-center text-[#8B4A12] shadow-xs flex-shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-[10px] sm:text-xs font-semibold text-[#171717]">Secure Payments</h4>
          <p className="text-[9px] sm:text-[10px] text-[#667085]">100% Protected</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2.5 text-center sm:text-left border-x border-[#E8E1D9] px-1.5 sm:px-3">
        <div className="w-8 h-8 rounded-full bg-white border border-[#E8E1D9] flex items-center justify-center text-[#8B4A12] shadow-xs flex-shrink-0">
          <span className="font-bold text-xs text-[#8B4A12]">₹</span>
        </div>
        <div>
          <h4 className="text-[10px] sm:text-xs font-semibold text-[#171717]">Multiple Options</h4>
          <p className="text-[9px] sm:text-[10px] text-[#667085]">Choose what suits you</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2.5 text-center sm:text-left">
        <div className="w-8 h-8 rounded-full bg-white border border-[#E8E1D9] flex items-center justify-center text-[#8B4A12] shadow-xs flex-shrink-0">
          <Headphones className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-[10px] sm:text-xs font-semibold text-[#171717]">24/7 Support</h4>
          <p className="text-[9px] sm:text-[10px] text-[#667085]">We&apos;re here to help</p>
        </div>
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
                {placedOrder.items?.map((item: any, idx: number) => {
                  const prodHref = `/products/${item.productId || item.product || item.slug || item._id}`;
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <Link href={prodHref} className="w-14 h-14 rounded-xl bg-[#faf8f5] p-1 border border-[#e8e2d8] overflow-hidden flex-shrink-0 hover:opacity-85 transition-opacity block">
                          <Image
                            src={item.imageUrl || '/products/placeholder.svg'}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </Link>
                        <div className="space-y-0.5 min-w-0">
                          <Link href={prodHref} className="text-xs sm:text-sm font-medium text-[#030303] truncate hover:text-[#8A5B2A] transition-colors block">
                            {item.name}
                          </Link>
                          <p className="text-[11px] text-slate-500 font-normal">
                            Size: {item.size} • Qty: {item.quantity}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs sm:text-sm font-semibold text-[#030303] flex-shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
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
                      {savedAddresses.length > 0 && activeAddress.street && (
                        <button
                          type="button"
                          onClick={() => setCurrentStep('address')}
                          className="text-xs font-semibold text-[#89591C] hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {savedAddresses.length > 0 && activeAddress.street ? (
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
                    ) : (
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#faf4ec] text-[#89591C] border border-[#e8e2d8] flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">No delivery address saved</p>
                            <p className="text-[11px] text-slate-500">Please add your shipping address to proceed.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenAddAddress}
                          className="px-3.5 py-1.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                        >
                          + Add Address
                        </button>
                      </div>
                    )}
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
                      {items.map((item, idx) => {
                        const prodHref = `/products/${item.productId || (item as any).slug || (item as any)._id}`;
                        return (
                          <div key={idx} className="py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                              <Link href={prodHref} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#faf8f5] p-1 border border-[#e8e2d8] overflow-hidden flex-shrink-0 hover:opacity-85 transition-opacity block">
                                <Image
                                  src={item.imageUrl || '/products/placeholder.svg'}
                                  alt={item.title}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </Link>
                              <div className="space-y-1 min-w-0">
                                <Link href={prodHref} className="text-xs sm:text-sm font-bold text-[#030303] truncate hover:text-[#8A5B2A] transition-colors block">
                                  {item.title}
                                </Link>
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
                        );
                      })}
                    </div>
                  </div>

                </div>

                <div className="lg:col-span-5 xl:col-span-4">
                  {renderOrderSummary('CONTINUE TO ADDRESS', () => {
                    if (savedAddresses.length === 0 || !activeAddress.street) {
                      handleOpenAddAddress();
                    } else {
                      setCurrentStep('address');
                    }
                  })}
                </div>
              </div>

              {renderBottomTrustBadges()}
            </div>
          )}

          {/* STAGE 2: DELIVERY ADDRESS SELECTION */}
          {currentStep === 'address' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 font-poppins">
              <div>
                <button
                  type="button"
                  onClick={() => setCurrentStep('cart')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#667085] hover:text-[#8B4A12] mb-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
                </button>
                <h2 className="text-[22px] sm:text-[26px] font-bold text-[#171717]">Delivery Address</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Choose where you want your order to be delivered
                </p>
              </div>

              <div className="space-y-3">
                {savedAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;

                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        updateUser({
                          name: addr.name,
                          phone: addr.phone,
                          address: formatAddressToString(addr),
                        });
                      }}
                      className={`rounded-[12px] p-4 sm:p-5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[1.5px] border-[#8B4A12] bg-[#FCF8F3] shadow-xs'
                          : 'border border-[#E8E1D9] bg-white hover:border-[#D9D1C8]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isSelected
                                ? 'border-[#8B4A12] bg-[#8B4A12]'
                                : 'border-[#D9D1C8] bg-white'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>

                          <div className="space-y-1 text-xs text-[#667085]">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[13px] text-[#171717]">{addr.name}</span>
                              {addr.isDefault && (
                                <span className="text-[9px] font-semibold bg-[#F2E7DA] text-[#8B4A12] px-[6px] py-[3px] rounded-[5px]">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] leading-[1.6] text-[#667085]">{addr.street},</p>
                            <p className="text-[11px] leading-[1.6] text-[#667085]">
                              {addr.city} - {addr.postalCode}
                            </p>
                            <p className="text-[11px] leading-[1.6] text-[#667085]">
                              {addr.state}, {addr.country} • <strong className="text-[#171717] font-semibold">{addr.phone}</strong>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditAddress(addr);
                          }}
                          className="text-xs font-semibold text-[#8B4A12] hover:underline flex-shrink-0"
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
                  className="w-full h-[46px] rounded-[12px] border border-dashed border-[#D9D1C8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#171717] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4 text-[#8B4A12]" />
                  <span>Add New Address</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (savedAddresses.length === 0 || !activeAddress.street) {
                    handleOpenAddAddress();
                    return;
                  }
                  setCurrentStep('payment');
                }}
                className="w-full h-[42px] sm:h-[46px] rounded-[10px] bg-[#8B4A12] hover:bg-[#6F390C] text-white text-xs sm:text-[13px] font-semibold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>CONTINUE TO PAYMENT →</span>
              </button>
            </div>
          )}

          {/* STAGE 3: PAYMENT OPTIONS */}
          {currentStep === 'payment' && (
            <div className="space-y-6 animate-in fade-in duration-300 font-poppins">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                  <div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep('address')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#667085] hover:text-[#8B4A12] mb-2"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Address
                    </button>
                    <h2 className="text-[22px] sm:text-[26px] font-bold text-[#171717]">Payment Options</h2>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Choose a safe and convenient payment method
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* UPI (Selected) */}
                    <div
                      onClick={() => setPaymentMethod('UPI')}
                      className={`min-h-[60px] rounded-[11px] p-3 transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'UPI'
                          ? 'border-[1.5px] border-[#8B4A12] bg-[#FCF8F3] shadow-xs'
                          : 'border border-[#E8E1D9] bg-white hover:border-[#D9D1C8]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === 'UPI'
                              ? 'border-[#8B4A12] bg-white'
                              : 'border-[#D9D1C8] bg-white'
                          }`}
                        >
                          {paymentMethod === 'UPI' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#8B4A12]" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-[12px] text-[#2b2b2b] tracking-wider italic">
                              UPI
                            </span>
                            <span className="text-[#3ba241] font-bold text-xs">❯</span>
                          </div>
                          <p className="text-[10px] text-[#667085] font-normal">
                            Pay using any UPI app
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 bg-[#E8F5E4] text-[#16A34A] font-bold text-[11px] rounded-lg border border-[#C4E8BC]">
                        SAVE ₹35
                      </span>
                    </div>

                    {/* Credit / Debit Card */}
                    <div
                      onClick={() => setPaymentMethod('Card')}
                      className={`min-h-[60px] rounded-[11px] p-3 transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'Card'
                          ? 'border-[1.5px] border-[#8B4A12] bg-[#FCF8F3] shadow-xs'
                          : 'border border-[#E8E1D9] bg-white hover:border-[#D9D1C8]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === 'Card'
                              ? 'border-[#8B4A12] bg-white'
                              : 'border-[#D9D1C8] bg-white'
                          }`}
                        >
                          {paymentMethod === 'Card' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#8B4A12]" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[12px] text-[#171717]">
                            Credit / Debit Card
                          </h4>
                          <p className="text-[10px] text-[#667085] font-normal">
                            Visa, Mastercard & RuPay
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#1a1f71] text-white font-extrabold text-[10px] rounded italic shadow-2xs">
                          VISA
                        </span>
                        <div className="flex -space-x-1.5 items-center">
                          <div className="w-4 h-4 rounded-full bg-[#eb001b]" />
                          <div className="w-4 h-4 rounded-full bg-[#f79e1b] opacity-80" />
                        </div>
                      </div>
                    </div>

                    {/* Net Banking */}
                    <div
                      onClick={() => setPaymentMethod('NetBanking')}
                      className={`min-h-[60px] rounded-[11px] p-3 transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'NetBanking'
                          ? 'border-[1.5px] border-[#8B4A12] bg-[#FCF8F3] shadow-xs'
                          : 'border border-[#E8E1D9] bg-white hover:border-[#D9D1C8]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === 'NetBanking'
                              ? 'border-[#8B4A12] bg-white'
                              : 'border-[#D9D1C8] bg-white'
                          }`}
                        >
                          {paymentMethod === 'NetBanking' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#8B4A12]" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[12px] text-[#171717]">
                            Net Banking
                          </h4>
                          <p className="text-[10px] text-[#667085] font-normal">
                            All major banks supported
                          </p>
                        </div>
                      </div>

                      <Building2 className="w-5 h-5 text-slate-400 stroke-[1.5]" />
                    </div>

                    {/* Wallets */}
                    <div
                      onClick={() => setPaymentMethod('Wallet')}
                      className={`min-h-[60px] rounded-[11px] p-3 transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'Wallet'
                          ? 'border-[1.5px] border-[#8B4A12] bg-[#FCF8F3] shadow-xs'
                          : 'border border-[#E8E1D9] bg-white hover:border-[#D9D1C8]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === 'Wallet'
                              ? 'border-[#8B4A12] bg-white'
                              : 'border-[#D9D1C8] bg-white'
                          }`}
                        >
                          {paymentMethod === 'Wallet' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#8B4A12]" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[12px] text-[#171717]">
                            Wallets
                          </h4>
                          <p className="text-[10px] text-[#667085] font-normal">
                            Paytm, PhonePe, Amazon Pay
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-extrabold tracking-tight">
                        <span className="text-[#002e6e]">pay</span>
                        <span className="text-[#00b9f5]">tm</span>
                      </span>
                    </div>

                    {/* Cash on Delivery */}
                    <div
                      onClick={() => setPaymentMethod('COD')}
                      className={`min-h-[60px] rounded-[11px] p-3 transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'COD'
                          ? 'border-[1.5px] border-[#8B4A12] bg-[#FCF8F3] shadow-xs'
                          : 'border border-[#E8E1D9] bg-white hover:border-[#D9D1C8]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === 'COD'
                              ? 'border-[#8B4A12] bg-white'
                              : 'border-[#D9D1C8] bg-white'
                          }`}
                        >
                          {paymentMethod === 'COD' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#8B4A12]" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[12px] text-[#171717]">
                            Cash on Delivery
                          </h4>
                          <p className="text-[10px] text-[#667085] font-normal">
                            Pay when you receive your order
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 bg-[#E8F5E4] text-[#16A34A] font-semibold text-[11px] rounded-lg border border-[#C4E8BC]">
                        Available
                      </span>
                    </div>
                  </div>

                  {orderError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                      {orderError}
                    </div>
                  )}
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

              {/* Bottom Trust Badges matching screenshot */}
              {renderBottomTrustBadges()}
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
