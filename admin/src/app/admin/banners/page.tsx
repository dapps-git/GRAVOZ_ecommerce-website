'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ImageIcon,
  Save,
  Upload,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';

interface BannerData {
  _id?: string;
  slot: string;
  name: string;
  category: 'home_banner' | 'category_banner';
  imageUrl: string;
  thumbnailUrl?: string;
  lifestyleUrl?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  productId?: string;
  linkUrl?: string;
  sizes?: string[];
  colors?: Array<{ name: string; colorCode: string; imageUrl?: string }>;
  aspectRatio?: string;
  isActive: boolean;
  displayOrder: number;
}

/** Safely extracts a valid image URL string from either a string or an object like { url, alt } */
function getImageUrl(img: any): string {
  if (!img) return '';
  if (typeof img === 'string') {
    const trimmed = img.trim();
    return trimmed.startsWith('http') || trimmed.startsWith('/') ? trimmed : '';
  }
  if (typeof img === 'object') {
    const candidate = img.url || img.secure_url || img.src || '';
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      return trimmed.startsWith('http') || trimmed.startsWith('/') ? trimmed : '';
    }
  }
  return '';
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [activeTab, setActiveTab] = useState<'hero_slider' | 'home_banner' | 'category_banner'>('hero_slider');
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const heroSlots = ['hero', 'hero_slide_2', 'hero_slide_3', 'hero_slide_4'];

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (data.banners && Array.isArray(data.banners)) {
        setBanners(data.banners);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleFieldChange = (slot: string, field: keyof BannerData, value: any) => {
    setBanners((prev) =>
      prev.map((b) => (b.slot === slot ? { ...b, [field]: value } : b))
    );
  };



  const handleSaveBanner = async (banner: BannerData) => {
    try {
      setSavingSlot(banner.slot);
      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banner),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${banner.name} updated!`);
      } else {
        showToast(data.error || 'Failed to save', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error', 'error');
    } finally {
      setSavingSlot(null);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSavingSlot('all');
      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Spotlight saved successfully!');
      } else {
        showToast(data.error || 'Failed to save', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error', 'error');
    } finally {
      setSavingSlot(null);
    }
  };

  const handleFileUpload = async (slot: string, field: 'imageUrl' | 'thumbnailUrl' | 'lifestyleUrl', file: File) => {
    const uploadKey = `${slot}-${field}`;
    try {
      setUploadingField(uploadKey);
      const optimizedFile = await compressImage(file, { maxWidth: 2000, maxHeight: 2000, quality: 0.85 });
      const formData = new FormData();
      formData.append('file', optimizedFile);
      formData.append('folder', 'gravoz/banners');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.url) {
        handleFieldChange(slot, field, data.url);
        showToast('Photo replaced!');
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const filteredBanners = banners.filter((b) => {
    if (activeTab === 'hero_slider') {
      return heroSlots.includes(b.slot);
    }
    if (activeTab === 'home_banner') {
      return b.category === 'home_banner' && !heroSlots.includes(b.slot);
    }
    return b.category === activeTab;
  });

  const heroBannersCount = banners.filter((b) => heroSlots.includes(b.slot)).length || 4;
  const storeBannersCount = banners.filter((b) => b.category === 'home_banner' && !heroSlots.includes(b.slot)).length || 4;
  const categoryBannersCount = banners.filter((b) => b.category === 'category_banner').length || 3;

  return (
    <div className="w-full space-y-5 pb-24 font-sans font-normal" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-md shadow-2xl flex items-center gap-3 text-white text-xs font-semibold animate-in slide-in-from-bottom-4 duration-200 ${
            toast.type === 'success' ? 'bg-[#89591C]' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-normal mb-1">
            <Link href="/admin" className="hover:text-slate-700 transition-colors">Dashboard</Link>
            <span>&gt;</span>
            <span className="text-slate-800 font-medium">Banners</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#030303] tracking-tight">Banner &amp; Showcase Management</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Manage top hero slider, promotional banners, category cards, and the Duo Product Spotlight.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBanners}
            className="h-9 px-3.5 rounded-md bg-white border border-[#e8e2d8] hover:bg-[#faf4ec] text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={savingSlot === 'all'}
            className="h-9 px-4 rounded-md bg-[#89591C] hover:bg-[#724816] disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingSlot === 'all' ? 'Saving All...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e8e2d8] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('hero_slider')}
          className={`px-4 py-2.5 text-xs font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'hero_slider'
              ? 'border-[#89591C] text-[#89591C] bg-[#faf4ec]/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Top Hero Slider ({heroBannersCount} Slides)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('home_banner')}
          className={`px-4 py-2.5 text-xs font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'home_banner'
              ? 'border-[#89591C] text-[#89591C] bg-[#faf4ec]/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Promotional Store Banners ({storeBannersCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('category_banner')}
          className={`px-4 py-2.5 text-xs font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'category_banner'
              ? 'border-[#89591C] text-[#89591C] bg-[#faf4ec]/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Category Card Banners ({categoryBannersCount})</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 animate-pulse h-64 border border-[#e8e2d8]" />
          ))}
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════════ */
        /* STANDARD PROMO BANNERS, HERO SLIDES & CATEGORY CARDS                    */
        /* ════════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {activeTab === 'hero_slider' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#faf4ec] border border-[#e8d7c2] rounded-xl px-5 py-3 text-xs text-[#89591C]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#89591C] flex-shrink-0" />
                <span>
                  <strong>Top Hero Slider (4 Slides):</strong> Automatically rotates every 3 seconds on the store homepage with smooth crossfade animation and no breadcrumbs.
                </span>
              </div>
              <span className="text-[11px] font-semibold bg-white px-2.5 py-1 rounded-md border border-[#e8d7c2] self-start sm:self-auto flex-shrink-0">
                Aspect Ratio: 1816 / 866
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5">
          {filteredBanners.map((banner, index) => {
            const bannerImgUrl = getImageUrl(banner.imageUrl);

            return (
              <div
                key={banner.slot}
                className="bg-white border border-[#e8e2d8] rounded-lg p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0eae1] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#faf4ec] text-[#89591C] font-bold text-xs flex items-center justify-center border border-[#e8e2d8]">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{banner.name}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">Slot ID: {banner.slot}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={banner.isActive}
                        onChange={(e) => handleFieldChange(banner.slot, 'isActive', e.target.checked)}
                        className="w-3.5 h-3.5 text-[#89591C] rounded border-slate-300 focus:ring-[#89591C]"
                      />
                      <span>{banner.isActive ? 'Active' : 'Disabled'}</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleSaveBanner(banner)}
                      disabled={savingSlot === banner.slot}
                      className="h-8 px-3.5 bg-[#89591C] hover:bg-[#724816] disabled:opacity-60 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingSlot === banner.slot ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left: Image Preview & Upload (5 Cols) */}
                  <div className="lg:col-span-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                        Live Preview &amp; Aspect Ratio
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Target Ratio: {banner.aspectRatio || '16/9'}</span>
                    </div>

                    <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#faf8f5] border border-[#e8e2d8] shadow-2xs group">
                      {bannerImgUrl ? (
                        <Image
                          src={bannerImgUrl}
                          alt={banner.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 40vw"
                          className="object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                          <ImageIcon className="w-8 h-8 stroke-1" />
                          <span className="text-xs font-medium">No Image Uploaded</span>
                        </div>
                      )}

                      {/* Upload Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="px-3 py-1.5 bg-white text-[#030303] text-xs font-semibold rounded-md shadow-md cursor-pointer hover:bg-slate-100 transition-colors flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Change Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(banner.slot, 'imageUrl', file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {uploadingField === `${banner.slot}-imageUrl` && (
                      <div className="text-xs text-[#89591C] font-semibold flex items-center gap-1.5 animate-pulse">
                        <Upload className="w-3.5 h-3.5 animate-spin" /> Uploading to Cloudinary CDN...
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-600">Image URL or Cloudinary Link</label>
                      <input
                        type="text"
                        value={banner.imageUrl || ''}
                        onChange={(e) => handleFieldChange(banner.slot, 'imageUrl', e.target.value)}
                        placeholder="https://res.cloudinary.com/... or /images/banner.webp"
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-[#e8e2d8] focus:outline-none focus:border-[#89591C] bg-[#faf8f5]"
                      />
                    </div>
                  </div>

                  {/* Right: Content Fields (7 Cols) */}
                  <div className="lg:col-span-7 space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Headline Title
                      </label>
                      <input
                        type="text"
                        value={banner.title || ''}
                        onChange={(e) => handleFieldChange(banner.slot, 'title', e.target.value)}
                        placeholder="e.g. Step Better. Feel the Comfort."
                        className="w-full px-3 py-2 rounded-md border border-[#e8e2d8] text-xs text-slate-800 focus:outline-none focus:border-[#89591C] bg-[#faf8f5]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Subtitle / Tagline
                      </label>
                      <input
                        type="text"
                        value={banner.subtitle || ''}
                        onChange={(e) => handleFieldChange(banner.slot, 'subtitle', e.target.value)}
                        placeholder="e.g. Quality Sandals for Every Family Moment"
                        className="w-full px-3 py-2 rounded-md border border-[#e8e2d8] text-xs text-slate-800 focus:outline-none focus:border-[#89591C] bg-[#faf8f5]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Destination Link URL
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={banner.linkUrl || ''}
                          onChange={(e) => handleFieldChange(banner.slot, 'linkUrl', e.target.value)}
                          placeholder="e.g. /products or /category/men"
                          className="w-full pl-3 pr-8 py-2 rounded-md border border-[#e8e2d8] text-xs text-slate-800 focus:outline-none focus:border-[#89591C] bg-[#faf8f5]"
                        />
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
