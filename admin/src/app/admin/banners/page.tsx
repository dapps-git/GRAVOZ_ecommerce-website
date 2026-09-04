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
  LayoutGrid,
  RefreshCw,
  ShoppingBag,
  Plus,
  Trash2,
} from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';

interface BannerData {
  _id?: string;
  slot: string;
  name: string;
  category: 'home_banner' | 'category_banner' | 'duo_showcase';
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

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [activeTab, setActiveTab] = useState<'home_banner' | 'category_banner' | 'duo_showcase'>('home_banner');
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
        showToast(`${banner.name} updated successfully!`);
      } else {
        showToast(data.error || 'Failed to save banner', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error saving banner', 'error');
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
        showToast('All banners updated successfully!');
      } else {
        showToast(data.error || 'Failed to save banners', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error saving banners', 'error');
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
        showToast('Image uploaded successfully!');
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const filteredBanners = banners.filter((b) => b.category === activeTab);

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
            Manage promotional banners, category cards, and the Duo Product Spotlight section below Best Sellers.
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
          onClick={() => setActiveTab('home_banner')}
          className={`px-4 py-2.5 text-xs font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'home_banner'
              ? 'border-[#89591C] text-[#89591C] bg-[#faf4ec]/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Promotional Store Banners (5)</span>
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
          <span>Category Card Banners (3)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('duo_showcase')}
          className={`px-4 py-2.5 text-xs font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'duo_showcase'
              ? 'border-[#89591C] text-[#89591C] bg-[#faf4ec]/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Duo Product Spotlight (Below Best Sellers)</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 animate-pulse h-64 border border-[#e8e2d8]" />
          ))}
        </div>
      ) : activeTab === 'duo_showcase' ? (
        /* ════════════════════════════════════════════════════════════════════════ */
        /* DUO PRODUCT SPOTLIGHT SECTION EDITOR (2 PRODUCTS, 3 PHOTOS EACH)       */
        /* ════════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Duo Product Spotlight Layout (Below Best Sellers)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure 2 showcase products with 3 photos each (Main photo, Inset thumbnail, and Tall lifestyle photo). Clicking these products opens the full inner product page.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={savingSlot === 'all'}
              className="h-9 px-4 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all shadow-xs cursor-pointer flex-shrink-0"
            >
              <Save className="w-3.5 h-3.5" /> Save Duo Spotlight
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredBanners.map((banner, index) => {
              const uploadMainKey = `${banner.slot}-imageUrl`;
              const uploadThumbKey = `${banner.slot}-thumbnailUrl`;
              const uploadLifeKey = `${banner.slot}-lifestyleUrl`;
              const sizeOptions = ['4', '5', '6', '7', '8', '9', '10', '11'];
              const currentSizes = banner.sizes || ['5', '6', '7', '8', '9', '10'];

              return (
                <div
                  key={banner.slot}
                  className="bg-white border border-[#e8e2d8] rounded-lg p-5 shadow-2xs space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-[#f0eae1] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#faf4ec] text-[#89591C] font-bold text-xs flex items-center justify-center border border-[#e8e2d8]">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{banner.name}</h3>
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
                        className="px-3 py-1 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        {savingSlot === banner.slot ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Form Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">Product Title</label>
                      <input
                        type="text"
                        value={banner.title || ''}
                        onChange={(e) => handleFieldChange(banner.slot, 'title', e.target.value)}
                        placeholder="e.g. Women's Casual Comfort Sandals"
                        className="w-full px-3 py-2 rounded-md border border-[#e8e2d8] text-xs bg-[#faf8f5] focus:outline-none focus:border-[#89591C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Price (₹)</label>
                      <input
                        type="number"
                        value={banner.price || 0}
                        onChange={(e) => handleFieldChange(banner.slot, 'price', Number(e.target.value))}
                        placeholder="1399"
                        className="w-full px-3 py-2 rounded-md border border-[#e8e2d8] text-xs bg-[#faf8f5] focus:outline-none focus:border-[#89591C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Original Price (₹ Strike-through)</label>
                      <input
                        type="number"
                        value={banner.originalPrice || 0}
                        onChange={(e) => handleFieldChange(banner.slot, 'originalPrice', Number(e.target.value))}
                        placeholder="1429"
                        className="w-full px-3 py-2 rounded-md border border-[#e8e2d8] text-xs bg-[#faf8f5] focus:outline-none focus:border-[#89591C]"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">Product Link / Slug</label>
                      <input
                        type="text"
                        value={banner.linkUrl || ''}
                        onChange={(e) => handleFieldChange(banner.slot, 'linkUrl', e.target.value)}
                        placeholder={`/products/${banner.slot}`}
                        className="w-full px-3 py-2 rounded-md border border-[#e8e2d8] text-xs bg-[#faf8f5] focus:outline-none focus:border-[#89591C]"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700">Product Description</label>
                      <textarea
                        rows={2}
                        value={banner.description || ''}
                        onChange={(e) => handleFieldChange(banner.slot, 'description', e.target.value)}
                        placeholder="Experience premium everyday comfort with handcrafted artisan materials..."
                        className="w-full px-3 py-2 rounded-md border border-[#e8e2d8] text-xs bg-[#faf8f5] focus:outline-none focus:border-[#89591C]"
                      />
                    </div>

                    {/* Sizes Selection */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-700 block">Available Sizes</label>
                      <div className="flex flex-wrap gap-1.5">
                        {sizeOptions.map((size) => {
                          const isSelected = currentSizes.includes(size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                const updated = isSelected
                                  ? currentSizes.filter((s) => s !== size)
                                  : [...currentSizes, size];
                                handleFieldChange(banner.slot, 'sizes', updated);
                              }}
                              className={`w-7 h-7 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#89591C] text-white border-[#89591C]'
                                  : 'bg-white text-slate-600 border-[#e8e2d8] hover:border-slate-400'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 3 Photos Uploaders */}
                  <div className="space-y-3 pt-2 border-t border-[#f0eae1]">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      3 Required Spotlight Photos:
                    </span>

                    {/* Photo 1: Main Photo */}
                    <div className="p-3 bg-[#faf8f5] rounded-lg border border-[#e8e2d8] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">1. Main Showcase Photo</span>
                        {uploadingField === uploadMainKey && (
                          <span className="text-[10px] text-[#89591C] font-semibold animate-pulse">Uploading...</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={banner.imageUrl || ''}
                          onChange={(e) => handleFieldChange(banner.slot, 'imageUrl', e.target.value)}
                          placeholder="Upload or paste image URL..."
                          className="flex-1 px-3 py-1.5 rounded-md border border-[#e8e2d8] text-xs bg-white focus:outline-none focus:border-[#89591C]"
                        />
                        <label className="px-3 py-1.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-colors">
                          <Upload className="w-3 h-3" /> Upload
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

                    {/* Photo 2: Inset Thumbnail */}
                    <div className="p-3 bg-[#faf8f5] rounded-lg border border-[#e8e2d8] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">2. Inset Close-up Thumbnail</span>
                        {uploadingField === uploadThumbKey && (
                          <span className="text-[10px] text-[#89591C] font-semibold animate-pulse">Uploading...</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={banner.thumbnailUrl || ''}
                          onChange={(e) => handleFieldChange(banner.slot, 'thumbnailUrl', e.target.value)}
                          placeholder="Upload or paste inset close-up photo URL..."
                          className="flex-1 px-3 py-1.5 rounded-md border border-[#e8e2d8] text-xs bg-white focus:outline-none focus:border-[#89591C]"
                        />
                        <label className="px-3 py-1.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-colors">
                          <Upload className="w-3 h-3" /> Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(banner.slot, 'thumbnailUrl', file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Photo 3: Lifestyle Photo */}
                    <div className="p-3 bg-[#faf8f5] rounded-lg border border-[#e8e2d8] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">3. Lifestyle / On-Model Photo</span>
                        {uploadingField === uploadLifeKey && (
                          <span className="text-[10px] text-[#89591C] font-semibold animate-pulse">Uploading...</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={banner.lifestyleUrl || ''}
                          onChange={(e) => handleFieldChange(banner.slot, 'lifestyleUrl', e.target.value)}
                          placeholder="Upload or paste lifestyle photo URL..."
                          className="flex-1 px-3 py-1.5 rounded-md border border-[#e8e2d8] text-xs bg-white focus:outline-none focus:border-[#89591C]"
                        />
                        <label className="px-3 py-1.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-colors">
                          <Upload className="w-3 h-3" /> Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(banner.slot, 'lifestyleUrl', file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Live Visual Preview */}
                  <div className="pt-2 border-t border-[#f0eae1] space-y-2">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                      Live Layout Preview:
                    </span>
                    <div className="grid grid-cols-2 gap-3 bg-[#faf8f5] p-3 rounded-lg border border-[#e8e2d8]">
                      {/* Left: Main with Inset */}
                      <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-white border border-[#e8e2d8] flex items-center justify-center">
                        {banner.imageUrl ? (
                          <Image src={banner.imageUrl} alt="Preview Main" fill className="object-cover" sizes="200px" />
                        ) : (
                          <span className="text-[10px] text-slate-400 text-center p-2">Main Photo</span>
                        )}
                        {banner.thumbnailUrl && (
                          <div className="absolute bottom-2 left-2 w-10 h-10 rounded-md bg-white border border-white/90 p-0.5 shadow-md overflow-hidden z-10">
                            <div className="relative w-full h-full rounded-sm overflow-hidden">
                              <Image src={banner.thumbnailUrl} alt="Preview Inset" fill className="object-cover" sizes="40px" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Lifestyle */}
                      <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-white border border-[#e8e2d8] flex items-center justify-center">
                        {banner.lifestyleUrl ? (
                          <Image src={banner.lifestyleUrl} alt="Preview Lifestyle" fill className="object-cover" sizes="200px" />
                        ) : (
                          <span className="text-[10px] text-slate-400 text-center p-2">Lifestyle Photo</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════════ */
        /* STANDARD PROMO BANNERS & CATEGORY CARDS                                 */
        /* ════════════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 gap-5">
          {filteredBanners.map((banner, index) => (
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
                    {banner.imageUrl ? (
                      <Image
                        src={banner.imageUrl}
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
          ))}
        </div>
      )}
    </div>
  );
}
