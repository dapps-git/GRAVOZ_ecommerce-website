'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  User,
  Package,
  Clock,
  Heart,
  ShoppingCart,
  RotateCcw,
  Bell,
  Shield,
  Camera,
  Check,
  Star,
  ChevronRight,
  LogOut,
  Upload,
  Video,
  X,
  Loader2,
  Truck,
} from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';

type TabType = 'profile' | 'orders' | 'history' | 'wishlist' | 'cart' | 'returns' | 'notifications' | 'security';

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global User Context
  const { user, isLoggedIn, isLoading, updateUser, updateAvatar, logout } = useUser();

  // Profile Form State synced with UserContext
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/profile');
    }
  }, [isLoading, isLoggedIn, router]);

  // Real Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [reviewItem, setReviewItem] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMedia, setReviewMedia] = useState<{ url: string; type: string }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchUserOrders = async () => {
    if (!user?.email) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchUserOrders();
    }
  }, [user?.email]);

  // Wishlist & Cart Context
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const { items: cartItems, subtotal, addToCart } = useCart();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email, phone, address });
    showToast('Profile updated successfully!');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateAvatar(url);
      showToast('Profile photo updated everywhere!');
    }
  };

  const sidebarItems: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'cart', label: 'Cart', icon: ShoppingCart },
    { id: 'returns', label: 'Return & Refund', icon: RotateCcw },
    { id: 'notifications', label: 'Notification', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-white text-[#030303] font-sans flex flex-col justify-between overflow-x-hidden selection:bg-[#89591C]/20 selection:text-[#89591C]">
      <Header />

      <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10">
        
        {/* Mobile Header Title & Quick Icon-Only Tabs Bar */}
        <div className="block md:hidden mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#030303] tracking-tight font-sansation">
              User Profile
            </h1>
            <span className="text-xs text-[#89591C] font-sansation font-bold bg-[#faf8f5] px-3 py-1 rounded-full border border-[#e8e2d8]">
              {sidebarItems.find(i => i.id === activeTab)?.label}
            </span>
          </div>

          {/* Icon-Only Responsive Tab Bar for Mobile (Overflow Hidden) */}
          <div className="flex items-center justify-between gap-1 overflow-hidden pb-2 pt-1 border-b border-[#e8e2d8]">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#89591C] text-white shadow-sm ring-2 ring-[#89591C]/30 scale-105'
                      : 'bg-[#faf8f5] text-slate-600 hover:text-black hover:bg-[#e8e2d8] border border-[#e8e2d8]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile Main Section Container */}
        <div className="flex flex-col md:flex-row gap-6 lg:gap-12 min-h-[580px]">
          
          {/* Desktop Left Sidebar */}
          <aside className="hidden md:flex w-[260px] lg:w-[280px] flex-shrink-0 bg-[#faf9f6] rounded-2xl p-6 border border-[#ece8e1] flex-col justify-between self-start">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#030303] tracking-tight font-sansation px-1">
                User Profile
              </h2>

              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all font-sansation text-left group relative ${
                        isActive
                          ? 'bg-white text-[#030303] font-bold shadow-2xs border border-[#e8e2d8]'
                          : 'text-slate-600 hover:text-[#030303] hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-[#89591C]' : 'text-slate-400 group-hover:text-slate-600'
                        }`} />
                        <span>{item.label}</span>
                      </div>

                      {/* Right vertical brown line for active item to match reference design */}
                      {isActive && (
                        <span className="absolute right-0 top-2 bottom-2 w-1 rounded-l-full bg-[#89591C]" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-6 border-t border-[#eae5dc] mt-6">
              <button
                type="button"
                onClick={() => showToast('Signed out safely.')}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-colors font-sansation"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <div className="flex-1 min-w-0 bg-white py-2">
            
            {/* TAB 1: PROFILE FORM (Matches reference image & updates Navbar avatar) */}
            {activeTab === 'profile' && (
              <div className="max-w-xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                
                {/* Avatar with Camera Overlay Badge */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#f89530] flex items-center justify-center text-white overflow-hidden shadow-sm border-2 border-white ring-4 ring-[#faf9f6]">
                      {user?.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt="User Avatar"
                          width={112}
                          height={112}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        /* Default Vector Avatar illustration matching reference image */
                        <svg className="w-20 h-20 sm:w-24 sm:h-24 text-white" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="48" fill="#F97316" />
                          <path d="M50 42C56.6274 42 62 36.6274 62 30C62 23.3726 56.6274 18 50 18C43.3726 18 38 23.3726 38 30C38 36.6274 43.3726 42 50 42Z" fill="#1E293B" />
                          <path d="M50 45C36 45 26 55 26 68V82H74V68C74 55 64 45 50 45Z" fill="#334155" />
                          <path d="M47 45H53V62H47V45Z" fill="#E2E8F0" />
                          <path d="M50 50L53 58H47L50 50Z" fill="#0F172A" />
                        </svg>
                      )}
                    </div>

                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-[#e8e2d8] shadow-md flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Change Profile Photo"
                    >
                      <Camera className="w-4 h-4 text-slate-700" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-400 font-sansation">
                    Click camera icon to change photo
                  </span>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 font-sansation sm:hidden">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-2xl border border-[#e5e5e5] bg-white text-sm text-[#030303] placeholder:text-slate-400 focus:outline-none focus:border-[#89591C] focus:ring-1 focus:ring-[#89591C]/20 transition-all font-sansation shadow-2xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 font-sansation sm:hidden">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-2xl border border-[#e5e5e5] bg-white text-sm text-[#030303] placeholder:text-slate-400 focus:outline-none focus:border-[#89591C] focus:ring-1 focus:ring-[#89591C]/20 transition-all font-sansation shadow-2xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 font-sansation sm:hidden">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-2xl border border-[#e5e5e5] bg-white text-sm text-[#030303] placeholder:text-slate-400 focus:outline-none focus:border-[#89591C] focus:ring-1 focus:ring-[#89591C]/20 transition-all font-sansation shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 font-sansation sm:hidden">
                      Address
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Address"
                      rows={4}
                      className="w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[#e5e5e5] bg-white text-sm text-[#030303] placeholder:text-slate-400 focus:outline-none focus:border-[#89591C] focus:ring-1 focus:ring-[#89591C]/20 transition-all font-sansation shadow-2xs resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-center">
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-medium text-xs sm:text-sm px-8 py-3 rounded-full transition-colors font-sansation shadow-xs cursor-pointer text-center"
                    >
                      Save & Update
                    </button>
                  </div>
                </form>

              </div>
            )}

            {/* TAB 2: MY ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#030303] font-sansation">My Orders</h3>
                    <p className="text-xs text-slate-500 font-sansation">Track and manage your footwear orders</p>
                  </div>
                  <span className="text-xs bg-[#faf8f5] border border-[#e8e2d8] px-3 py-1 rounded-full font-medium text-[#89591C] font-sansation">
                    {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>

                {ordersLoading ? (
                  <div className="py-12 flex items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#89591C]" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-[#faf8f5] rounded-2xl border border-[#e8e2d8]">
                    <Package className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No orders placed yet</p>
                    <Link
                      href="/"
                      className="inline-block px-5 py-2 bg-[#89591C] text-white text-xs font-bold rounded-xl"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => {
                      const isDelivered = ord.orderStatus === 'delivered';
                      const isCancelled = ord.orderStatus === 'cancelled';
                      return (
                        <div key={ord._id} className="border border-[#e5e5e5] rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs bg-white">
                          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-sansation border-b border-[#f0ece5] pb-3">
                            <div>
                              <span className="text-slate-400">Order ID: </span>
                              <span className="font-bold text-[#030303]">#{ord.orderNumber}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Placed on: </span>
                              <span className="font-medium text-slate-700">
                                {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const st = ord.orderStatus;
                                if (st === 'cancelled') {
                                  return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
                                }
                                if (st === 'return_approved') {
                                  return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E8F8EE] text-[#22C55E] border border-[#22C55E]/30">Return Accepted</span>;
                                }
                                if (st === 'return_requested') {
                                  return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">Return Requested</span>;
                                }
                                if (st === 'under_review') {
                                  return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">Under Review</span>;
                                }
                                if (st === 'pickup_scheduled') {
                                  return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">Pickup Scheduled</span>;
                                }
                                if (st === 'return_received') {
                                  return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200">Return Received</span>;
                                }
                                if (st === 'refund_initiated') {
                                  return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200">Refund Initiated</span>;
                                }
                                if (st === 'refunded') {
                                  return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-50 text-green-800 border border-green-200">Refunded</span>;
                                }
                                if (st === 'return_rejected') {
                                  return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">Return Declined</span>;
                                }
                                if (st === 'delivered') {
                                  return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Delivered</span>;
                                }
                                return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 capitalize">{st.replace(/_/g, ' ')}</span>;
                              })()}
                              <Link
                                href={`/orders/${ord._id}`}
                                className="px-3 py-1 bg-[#FAF7F3] hover:bg-[#F6E9D7]/50 text-[#8A5B2A] text-[11px] font-medium rounded-lg border border-[#E5E1DC] transition-colors"
                              >
                                Track / Manage
                              </Link>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {ord.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between gap-3 sm:gap-4">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#f2f0ed] p-1 flex-shrink-0 border border-[#eae6e1] overflow-hidden">
                                    <Image
                                      src={item.imageUrl || '/products/placeholder.svg'}
                                      alt={item.name}
                                      width={64}
                                      height={64}
                                      className="object-contain w-full h-full"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-0.5 font-sansation">
                                    <h4 className="text-xs sm:text-sm font-semibold text-[#030303] truncate">
                                      {item.name}
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                      Size: {item.size} {item.color ? `| Color: ${item.color}` : ''} | Qty: {item.quantity}
                                    </p>
                                    <span className="text-xs font-bold text-[#c25e09]">Γé╣{(item.price * item.quantity).toLocaleString()}</span>
                                  </div>
                                </div>

                                {isDelivered && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReviewOrder(ord);
                                      setReviewItem(item);
                                      setReviewRating(5);
                                      setReviewComment('');
                                      setReviewMedia([]);
                                      setReviewModalOpen(true);
                                    }}
                                    className="flex-shrink-0 px-3 py-1.5 bg-[#89591C] hover:bg-[#724a17] text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Star className="w-3 h-3 fill-white" /> Review
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-[#e5e5e5] pb-4">
                  <h3 className="text-lg font-bold text-[#030303] font-sansation">Browsing & Order History</h3>
                  <p className="text-xs text-slate-500 font-sansation">Your recently viewed items and activity log</p>
                </div>
                <div className="space-y-3">
                  <div className="p-3.5 sm:p-4 rounded-xl border border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sansation bg-white">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-[#89591C] flex-shrink-0" />
                      <span>Viewed <strong>MenΓÇÖs Casual Comfort Sandals ΓÇô WGP50020 Black</strong></span>
                    </div>
                    <span className="text-slate-400 text-[11px]">Today, 11:30 AM</span>
                  </div>
                  <div className="p-3.5 sm:p-4 rounded-xl border border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sansation bg-white">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Delivered order <strong>#GRV-84920</strong></span>
                    </div>
                    <span className="text-slate-400 text-[11px]">26 Aug 2026</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: WISHLIST OVERVIEW */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#030303] font-sansation">Wishlist ({wishlistItems.length})</h3>
                    <p className="text-xs text-slate-500 font-sansation">Your saved products</p>
                  </div>
                  <Link
                    href="/wishlist"
                    className="text-xs font-semibold text-[#c25e09] hover:underline flex items-center gap-1 font-sansation"
                  >
                    Go to Wishlist Page <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {wishlistItems.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 font-sansation">Your wishlist is currently empty.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlistItems.map((item) => (
                      <div key={item.productId} className="p-3.5 rounded-2xl border border-[#e5e5e5] flex items-center justify-between gap-3 bg-white">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-14 h-14 rounded-xl bg-[#f2f0ed] p-1 flex-shrink-0 border border-[#eae6e1]">
                            <Image src={item.imageUrl || '/products/placeholder.svg'} alt={item.title} width={56} height={56} className="object-contain w-full h-full" />
                          </div>
                          <div className="min-w-0 flex-1 font-sansation space-y-0.5">
                            <h4 className="text-xs font-semibold text-[#030303] truncate">{item.title}</h4>
                            <span className="text-xs font-bold text-[#c25e09]">Γé╣{item.price}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            await addToCart({
                              productId: item.productId,
                              title: item.title,
                              price: item.price,
                              originalPrice: item.originalPrice,
                              size: item.size || '9',
                              quantity: 1,
                              imageUrl: item.imageUrl,
                              color: item.color,
                            });
                            await removeFromWishlist(item.productId);
                            showToast(`Moved ${item.title} to Cart! Redirecting...`);
                            router.push('/cart');
                          }}
                          className="bg-[#c25e09] hover:bg-[#a04a05] text-white text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-full transition-colors font-sansation whitespace-nowrap cursor-pointer flex-shrink-0"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: CART OVERVIEW */}
            {activeTab === 'cart' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#030303] font-sansation">Shopping Cart ({cartItems.length})</h3>
                    <p className="text-xs text-slate-500 font-sansation">Items ready for checkout</p>
                  </div>
                  <Link
                    href="/cart"
                    className="text-xs font-semibold text-[#c25e09] hover:underline flex items-center gap-1 font-sansation"
                  >
                    View Full Cart <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {cartItems.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 font-sansation">Your cart is empty.</p>
                ) : (
                  <div className="space-y-3 font-sansation">
                    {cartItems.map((item) => (
                      <div key={item.productId} className="p-3.5 rounded-2xl border border-[#e5e5e5] flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#f2f0ed] p-1 flex-shrink-0 border border-[#eae6e1]">
                            <Image src={item.imageUrl || '/products/placeholder.svg'} alt={item.title} width={48} height={48} className="object-contain w-full h-full" />
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-[#030303]">{item.title}</h4>
                            <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#c25e09]">Γé╣{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-[#e5e5e5] flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">Subtotal:</span>
                      <span className="font-bold text-[#c25e09]">Γé╣{subtotal}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: RETURN & REFUND */}
            {activeTab === 'returns' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-[#e5e5e5] pb-4">
                  <h3 className="text-lg font-bold text-[#030303] font-sansation">Return & Refund Requests</h3>
                  <p className="text-xs text-slate-500 font-sansation">Manage returns and check refund status</p>
                </div>
                <div className="p-6 rounded-2xl border border-[#e5e5e5] bg-[#faf9f6] text-center space-y-3 font-sansation">
                  <RotateCcw className="w-8 h-8 text-[#89591C] mx-auto" />
                  <h4 className="text-sm font-bold text-[#030303]">No Active Return Requests</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    All Gravoz orders come with 7-day easy returns and a 6-month product warranty.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 7: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-[#e5e5e5] pb-4">
                  <h3 className="text-lg font-bold text-[#030303] font-sansation">Notification Preferences</h3>
                  <p className="text-xs text-slate-500 font-sansation">Configure how you receive order updates & offers</p>
                </div>
                <div className="space-y-4 font-sansation">
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-[#e5e5e5] bg-white">
                    <div>
                      <h4 className="text-xs font-semibold text-[#030303]">Order & Shipping Alerts</h4>
                      <p className="text-[11px] text-slate-500">Get instant WhatsApp & SMS tracking notifications</p>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-[#c25e09] w-4 h-4 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-[#e5e5e5] bg-white">
                    <div>
                      <h4 className="text-xs font-semibold text-[#030303]">Exclusive Discounts & Offers</h4>
                      <p className="text-[11px] text-slate-500">Receive promo codes and new product drop announcements</p>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-[#c25e09] w-4 h-4 cursor-pointer" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-300 max-w-md">
                <div className="border-b border-[#e5e5e5] pb-4">
                  <h3 className="text-lg font-bold text-[#030303] font-sansation">Account Security</h3>
                  <p className="text-xs text-slate-500 font-sansation">Update password and manage security settings</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); showToast('Password updated!'); }} className="space-y-4 font-sansation">
                  <div>
                    <input type="password" placeholder="Current Password" className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-2xl border border-[#e5e5e5] bg-white text-sm text-[#030303] placeholder:text-slate-400 focus:outline-none focus:border-[#89591C]" required />
                  </div>
                  <div>
                    <input type="password" placeholder="New Password" className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-2xl border border-[#e5e5e5] bg-white text-sm text-[#030303] placeholder:text-slate-400 focus:outline-none focus:border-[#89591C]" required />
                  </div>
                  <div>
                    <input type="password" placeholder="Confirm New Password" className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-2xl border border-[#e5e5e5] bg-white text-sm text-[#030303] placeholder:text-slate-400 focus:outline-none focus:border-[#89591C]" required />
                  </div>
                  <button type="submit" className="w-full sm:w-auto bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium px-6 py-2.5 rounded-full transition-colors text-center">
                    Update Password
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>

        {/* TESTIMONIAL SECTION (Matches reference screenshot bottom layout) */}
        <section className="mt-12 sm:mt-24 space-y-6 sm:space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#030303] tracking-tight font-sansation">
              Testimonial
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            
            {/* Testimonial Card 1 (Hashim) */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ef4444] flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    H
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#030303] font-sansation">
                      Hashim
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sansation">
                      Verified User
                    </p>
                  </div>
                </div>

                {/* 5 Stars */}
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#C19968] text-[#C19968]" />
                  ))}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sansation italic">
                &ldquo;The quality is exceptional, and the shoes feel incredibly comfortable from the first wear. The craftsmanship and finish are truly impressive.&rdquo;
              </p>
            </div>

            {/* Testimonial Card 2 (Lakshmi) */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#f59e0b] flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    L
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#030303] font-sansation">
                      lakshmi
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sansation">
                      Verified User
                    </p>
                  </div>
                </div>

                {/* 5 Stars */}
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#C19968] text-[#C19968]" />
                  ))}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sansation italic">
                &ldquo;Gravoz has the perfect balance of premium style and comfort. The leather feels luxurious, and the fit is excellent.&rdquo;
              </p>
            </div>

          </div>

          {/* Carousel Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span className="w-7 h-2.5 rounded-full bg-slate-800"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
          </div>
        </section>

      </main>

      {/* Footer includes the 4 black feature highlight cards & brand footer */}
      <Footer />

      {/* ΓöÇΓöÇ WRITE REVIEW MODAL ΓöÇΓöÇ */}
      {reviewModalOpen && reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border border-[#e8e2d8] relative max-h-[90vh] overflow-y-auto font-sansation">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-[#030303]">Write a Product Review</h3>
            <p className="text-xs text-slate-500 mt-0.5">{reviewItem.name}</p>

            {/* Product thumbnail */}
            <div className="mt-3 flex items-center gap-3 p-2.5 bg-[#faf8f5] rounded-xl border border-[#e8e2d8]">
              <div className="w-12 h-12 rounded-lg bg-white border border-[#e8e2d8] overflow-hidden flex-shrink-0">
                <Image
                  src={reviewItem.imageUrl || '/products/placeholder.svg'}
                  alt={reviewItem.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-900 line-clamp-1">{reviewItem.name}</p>
                <p className="text-[11px] text-emerald-700 font-semibold">Verified Purchase</p>
              </div>
            </div>

            {/* Star Rating Picker */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rating *</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= reviewRating
                          ? 'text-[#C19968] fill-[#C19968]'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-bold text-[#89591C]">
                  {reviewRating === 5 ? 'Excellent' : reviewRating === 4 ? 'Good' : reviewRating === 3 ? 'Average' : reviewRating === 2 ? 'Below Average' : 'Poor'}
                </span>
              </div>
            </div>

            {/* Review Comment */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Review <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How was the fit, leather quality, and comfort?"
                rows={3}
                className="w-full p-3 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl focus:outline-none focus:border-[#89591C] resize-none"
              />
            </div>

            {/* Media Upload */}
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Add Photos / Videos <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {reviewMedia.map((m, idx) => (
                  <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#e8e2d8] bg-black">
                    {m.type === 'video' ? (
                      <video src={m.url} className="w-full h-full object-cover" />
                    ) : (
                      <Image src={m.url} alt="Review upload" fill className="object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setReviewMedia(reviewMedia.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px]"
                    >
                      ├ù
                    </button>
                  </div>
                ))}

                {reviewMedia.length < 4 && (
                  <label className="w-14 h-14 rounded-lg border-2 border-dashed border-[#d8cebe] hover:border-[#89591C] bg-[#faf8f5] flex flex-col items-center justify-center text-slate-400 hover:text-[#89591C] cursor-pointer transition-colors">
                    {uploadingMedia ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#89591C]" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span className="text-[9px] mt-0.5 font-semibold">Upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      disabled={uploadingMedia}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingMedia(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const res = await fetch('/api/reviews/upload', {
                            method: 'POST',
                            body: formData,
                          });
                          const data = await res.json();
                          if (res.ok && data.url) {
                            setReviewMedia([...reviewMedia, { url: data.url, type: data.type }]);
                          } else {
                            showToast('Upload failed: ' + (data.error || 'Please try again'));
                          }
                        } catch {
                          showToast('Upload failed. Please try again.');
                        } finally {
                          setUploadingMedia(false);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-5">
              <button
                type="button"
                disabled={submittingReview}
                onClick={async () => {
                  setSubmittingReview(true);
                  try {
                    const res = await fetch('/api/reviews', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        productId: reviewItem.productId,
                        orderId: reviewOrder._id,
                        customerName: user?.name || 'Verified Customer',
                        customerEmail: user?.email,
                        rating: reviewRating,
                        comment: reviewComment,
                        images: reviewMedia.filter((m) => m.type !== 'video').map((m) => m.url),
                        videos: reviewMedia.filter((m) => m.type === 'video').map((m) => m.url),
                      }),
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                      setReviewModalOpen(false);
                      showToast('Review submitted successfully! Thank you.');
                    } else {
                      showToast(data.error || 'Failed to submit review.');
                    }
                  } catch {
                    showToast('Network error while submitting review.');
                  } finally {
                    setSubmittingReview(false);
                  }
                }}
                className="w-full py-3 bg-[#89591C] hover:bg-[#724a17] disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingReview ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#030303] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 border border-white/20 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-5 h-5 rounded-full bg-[#89591C] flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-medium font-sansation">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
