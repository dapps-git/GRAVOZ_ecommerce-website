'use client';

import React, { useState, useEffect } from 'react';
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
  Eye,
  RefreshCw,
} from 'lucide-react';

interface BannerData {
  _id?: string;
  slot: string;
  name: string;
  category: 'home_banner' | 'category_banner';
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  aspectRatio?: string;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [activeTab, setActiveTab] = useState<'home_banner' | 'category_banner'>('home_banner');
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
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

  const handleFileUpload = async (slot: string, file: File) => {
    try {
      setUploadingSlot(slot);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'gravoz/banners');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.url) {
        handleFieldChange(slot, 'imageUrl', data.url);
        showToast('Image uploaded successfully!');
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingSlot(null);
    }
  };

  const filteredBanners = banners.filter((b) => b.category === activeTab);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sansation">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-white text-xs font-semibold animate-in slide-in-from-bottom-4 duration-200 ${
            toast.type === 'success' ? 'bg-[#89591C]' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e2d8] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="w-5 h-5 text-[#89591C]" />
            <span className="text-xs uppercase tracking-widest font-semibold text-[#89591C]">
              Visual Media
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Banner Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage all 5 promotional hero banners and 3 category card banners across the storefront.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchBanners}
            className="px-3.5 py-2.5 bg-white border border-[#e8e2d8] hover:bg-[#faf4ec] text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={savingSlot === 'all'}
            className="px-5 py-2.5 bg-[#89591C] hover:bg-[#724816] disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {savingSlot === 'all' ? 'Saving All...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e8e2d8]">
        <button
          type="button"
          onClick={() => setActiveTab('home_banner')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'home_banner'
              ? 'border-[#89591C] text-[#89591C]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Promotional Store Banners (5 Total)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('category_banner')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'category_banner'
              ? 'border-[#89591C] text-[#89591C]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Category Card Banners (3 Total)</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#f4f2ee] rounded-2xl p-6 animate-pulse h-64 border border-[#e8e2d8]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredBanners.map((banner, index) => (
            <div
              key={banner.slot}
              className="bg-white border border-[#e8e2d8] rounded-2xl p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-all space-y-5"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0eae1] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#faf4ec] text-[#89591C] font-bold text-xs flex items-center justify-center border border-[#e8e2d8]">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{banner.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">Slot ID: {banner.slot}</span>
                  </div>
                </div>

                {/* Status Toggle & Save Single */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={banner.isActive}
                      onChange={(e) => handleFieldChange(banner.slot, 'isActive', e.target.checked)}
                      className="w-4 h-4 text-[#89591C] rounded border-slate-300 focus:ring-[#89591C]"
                    />
                    <span>{banner.isActive ? 'Active' : 'Disabled'}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleSaveBanner(banner)}
                    disabled={savingSlot === banner.slot}
                    className="px-4 py-1.5 bg-[#89591C] hover:bg-[#724816] disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingSlot === banner.slot ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Card Body: Split into Preview & Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Banner Image Preview (Left 5 Cols) */}
                <div className="lg:col-span-5 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                    Live Banner Preview
                  </span>
                  <div className="relative w-full aspect-[16/8] rounded-xl overflow-hidden bg-[#f4f2ee] border border-[#e8e2d8] flex items-center justify-center group shadow-2xs">
                    {banner.imageUrl ? (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.name}
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400 text-xs">
                        <ImageIcon className="w-8 h-8" />
                        <span>No image assigned</span>
                      </div>
                    )}

                    {/* Overlay view icon */}
                    {banner.imageUrl && (
                      <a
                        href={banner.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black transition-colors opacity-0 group-hover:opacity-100"
                        title="View Full Image"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Upload Image Button */}
                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#faf8f5] hover:bg-[#f0eae1] border border-[#e8e2d8] rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-[#89591C]" />
                      <span>{uploadingSlot === banner.slot ? 'Uploading...' : 'Upload Image / Cloudinary'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(banner.slot, file);
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Banner Settings (Right 7 Cols) */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Image URL */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Image URL / Path</label>
                    <input
                      type="text"
                      value={banner.imageUrl}
                      onChange={(e) => handleFieldChange(banner.slot, 'imageUrl', e.target.value)}
                      placeholder="/images/banner.webp or https://res.cloudinary.com/..."
                      className="w-full h-10 px-3 bg-[#faf9f7] border border-[#e8e2d8] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#89591C] font-mono"
                    />
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Banner Title</label>
                    <input
                      type="text"
                      value={banner.title || ''}
                      onChange={(e) => handleFieldChange(banner.slot, 'title', e.target.value)}
                      placeholder="e.g. Step Better. Feel the Comfort."
                      className="w-full h-10 px-3 bg-[#faf9f7] border border-[#e8e2d8] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#89591C]"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Subtitle / Description</label>
                    <input
                      type="text"
                      value={banner.subtitle || ''}
                      onChange={(e) => handleFieldChange(banner.slot, 'subtitle', e.target.value)}
                      placeholder="e.g. Handcrafted for Everyday Comfort"
                      className="w-full h-10 px-3 bg-[#faf9f7] border border-[#e8e2d8] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#89591C]"
                    />
                  </div>

                  {/* Target Link URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Click Link URL</label>
                    <input
                      type="text"
                      value={banner.linkUrl || ''}
                      onChange={(e) => handleFieldChange(banner.slot, 'linkUrl', e.target.value)}
                      placeholder="/products or /category/men"
                      className="w-full h-10 px-3 bg-[#faf9f7] border border-[#e8e2d8] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#89591C]"
                    />
                  </div>

                  {/* Aspect Ratio Note */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Recommended Aspect Ratio</label>
                    <input
                      type="text"
                      value={banner.aspectRatio || '16/9'}
                      disabled
                      className="w-full h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed font-mono"
                    />
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
