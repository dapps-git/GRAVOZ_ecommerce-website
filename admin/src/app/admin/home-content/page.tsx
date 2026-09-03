'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Upload, Plus, Trash2, Save, CheckCircle2, AlertCircle,
  LayoutGrid, Link as LinkIcon, RefreshCw, ChevronDown,
  Package, ImageIcon, Star, TrendingUp, Zap, Sparkles,
  GripVertical, X, Eye, EyeOff, Check, Palette, Ruler,
  FileText,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface HomeSectionColor {
  name: string;
  colorCode: string;
}

interface HomeSectionSize {
  size: string;
  isAvailable: boolean;
}

interface HomeSectionItem {
  id?: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  insetImageUrl?: string;
  sizes?: HomeSectionSize[];
  colors?: HomeSectionColor[];
  linkUrl?: string;
  productId?: string;
  isAvailable?: boolean;
  displayOrder?: number;
}

interface HomeSectionData {
  _id?: string;
  sectionKey: 'best_sellers' | 'top_selling' | 'latest_products' | 'featured_products';
  title: string;
  subtitle?: string;
  isActive: boolean;
  displayOrder: number;
  items: HomeSectionItem[];
}

interface ProductOption {
  _id: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  sizes?: string[];
  sizeAvailability?: Array<{ size: string; isAvailable: boolean }>;
  colors?: string[];
  colorVariants?: Array<{ name: string; colorCode?: string }>;
  images?: Array<{ url: string } | string>;
}

/* ─── Section Meta ───────────────────────────────────────────────────────── */

const SECTIONS = [
  {
    key: 'best_sellers',
    label: 'Best Sellers',
    desc: 'Your top-rated, most purchased products',
    icon: Star,
    color: '#89591C',
    bg: '#faf4ec',
  },
  {
    key: 'top_selling',
    label: 'Top Selling',
    desc: 'Trending community favourites right now',
    icon: TrendingUp,
    color: '#557244',
    bg: '#f0f5ec',
  },
  {
    key: 'latest_products',
    label: 'Latest Arrivals',
    desc: 'Newest additions to the collection',
    icon: Zap,
    color: '#1d6fa4',
    bg: '#edf5fc',
  },
  {
    key: 'featured_products',
    label: 'Featured Collection',
    desc: 'Hand-picked premium showcase picks',
    icon: Sparkles,
    color: '#7c3d8f',
    bg: '#f7eefa',
  },
] as const;

const STANDARD_SIZES = ['4', '5', '6', '7', '8', '9', '10', '11'];

const PRESET_COLORS = [
  { name: 'Black', code: '#1a1a1a' },
  { name: 'Brown', code: '#4a2c11' },
  { name: 'Tan', code: '#c28b57' },
  { name: 'Red', code: '#dc2626' },
  { name: 'Olive', code: '#556b2f' },
  { name: 'Pink', code: '#f4a6b8' },
  { name: 'White', code: '#f8f8f8' },
  { name: 'Navy', code: '#1a2a40' },
];

/* ─── Toast ─────────────────────────────────────────────────────────────── */

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-white text-xs font-semibold animate-in slide-in-from-bottom-4 duration-300 ${
        type === 'success' ? 'bg-[#557244]' : 'bg-rose-600'
      }`}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle  className="w-4 h-4 flex-shrink-0" />}
      {message}
    </div>
  );
}

/* ─── Single Card Editor ─────────────────────────────────────────────────── */

function CardEditor({
  item,
  index,
  total,
  products,
  sectionColor,
  uploading,
  onUpdate,
  onRemove,
  onUpload,
  onPickProduct,
}: {
  item: HomeSectionItem;
  index: number;
  total: number;
  products: ProductOption[];
  sectionColor: string;
  uploading: { itemIdx: number; field: 'image' | 'inset' } | null;
  onUpdate: (field: keyof HomeSectionItem, value: any) => void;
  onRemove: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'inset') => void;
  onPickProduct: (productId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customColorName, setCustomColorName] = useState('');
  const [customColorCode, setCustomColorCode] = useState('#1a1a1a');

  // Sizes array fallback
  const currentSizes: HomeSectionSize[] = Array.isArray(item.sizes) ? item.sizes : [];
  // Colors array fallback
  const currentColors: HomeSectionColor[] = Array.isArray(item.colors) ? item.colors : [];

  const toggleSize = (sizeVal: string) => {
    const exists = currentSizes.find((s) => s.size === sizeVal);
    if (exists) {
      // If present, toggle availability or remove if already unavailable
      if (exists.isAvailable) {
        onUpdate(
          'sizes',
          currentSizes.map((s) => (s.size === sizeVal ? { ...s, isAvailable: false } : s))
        );
      } else {
        onUpdate('sizes', currentSizes.filter((s) => s.size !== sizeVal));
      }
    } else {
      // Add as available
      onUpdate('sizes', [...currentSizes, { size: sizeVal, isAvailable: true }]);
    }
  };

  const addCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (!currentSizes.some((s) => s.size === trimmed)) {
      onUpdate('sizes', [...currentSizes, { size: trimmed, isAvailable: true }]);
    }
    setCustomSizeInput('');
  };

  const togglePresetColor = (colorName: string, colorCode: string) => {
    const exists = currentColors.some((c) => c.name.toLowerCase() === colorName.toLowerCase());
    if (exists) {
      onUpdate('colors', currentColors.filter((c) => c.name.toLowerCase() !== colorName.toLowerCase()));
    } else {
      onUpdate('colors', [...currentColors, { name: colorName, colorCode }]);
    }
  };

  const addCustomColor = () => {
    const trimmed = customColorName.trim();
    if (!trimmed) return;
    if (!currentColors.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      onUpdate('colors', [...currentColors, { name: trimmed, colorCode: customColorCode || '#1a1a1a' }]);
    }
    setCustomColorName('');
  };

  const removeColor = (colorName: string) => {
    onUpdate('colors', currentColors.filter((c) => c.name !== colorName));
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e8e2d8] overflow-hidden shadow-2xs">
      {/* Card Header — always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-[#faf8f5] transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Drag handle visual */}
        <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />

        {/* Slot number */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: sectionColor }}
        >
          {index + 1}
        </div>

        {/* Preview thumb */}
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#e8e2d8] bg-[#f4f2ee] flex-shrink-0">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt="thumb" width={40} height={40} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-slate-300" />
            </div>
          )}
        </div>

        {/* Title / fallback */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-900 truncate">
            {item.title || `Card ${index + 1} — untitled`}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
            <span>{item.imageUrl ? 'Photo uploaded' : 'No photo yet'}</span>
            <span>·</span>
            <span>₹{item.price || '—'}</span>
            {currentColors.length > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  {currentColors.map((c) => (
                    <span
                      key={c.name}
                      className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block"
                      style={{ background: c.colorCode }}
                    />
                  ))}
                </span>
              </>
            )}
            {currentSizes.length > 0 && (
              <>
                <span>·</span>
                <span>{currentSizes.length} sizes</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
            title="Remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform cursor-pointer ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Expandable body */}
      {expanded && (
        <div className="border-t border-[#f0ece5] px-4 py-4 space-y-4">

          {/* Step 1 — Pick from catalog (optional shortcut) */}
          {products.length > 0 && (
            <div className="bg-[#faf8f5] rounded-xl p-3 space-y-1.5 border border-[#eee8de]">
              <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                Auto-fill from Product Catalog <span className="font-normal text-slate-400">(optional)</span>
              </p>
              <select
                value={item.productId || ''}
                onChange={(e) => onPickProduct(e.target.value)}
                className="w-full text-xs bg-white border border-[#e8e2d8] rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="">— Choose a product to auto-fill title, description, price, sizes, colors &amp; images —</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} · ₹{p.discountPrice || p.price}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 2 — Photos */}
          <div>
            <p className="text-[11px] font-bold text-slate-700 mb-2">1. Photos</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Main hero photo */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Main card photo *
                </p>
                <PhotoSlot
                  url={item.imageUrl}
                  alt={item.title}
                  hint="Lifestyle / model photo — shown on the card"
                  isUploading={uploading?.itemIdx === index && uploading?.field === 'image'}
                  onFile={(e) => onUpload(e, 'image')}
                  onUrlChange={(v) => onUpdate('imageUrl', v)}
                />
              </div>

              {/* Floating inset thumbnail */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Inset thumbnail <span className="text-slate-400 normal-case">(optional)</span>
                </p>
                <PhotoSlot
                  url={item.insetImageUrl || ''}
                  alt="Inset"
                  hint="Small floating corner thumbnail on the card"
                  isUploading={uploading?.itemIdx === index && uploading?.field === 'inset'}
                  onFile={(e) => onUpload(e, 'inset')}
                  onUrlChange={(v) => onUpdate('insetImageUrl', v)}
                  soft
                />
              </div>
            </div>
          </div>

          {/* Step 3 — Card Basic Details */}
          <div>
            <p className="text-[11px] font-bold text-slate-700 mb-2">2. Product Details &amp; Pricing</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Product Title *</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => onUpdate('title', e.target.value)}
                  placeholder="e.g. Men's Casual Comfort Sandals"
                  className="w-full text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 font-medium"
                />
              </div>

              {/* Description */}
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400" />
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={item.description || ''}
                  onChange={(e) => onUpdate('description', e.target.value)}
                  placeholder="Brief description of materials, comfort features, or occasion..."
                  className="w-full text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Price (₹) *</label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => onUpdate('price', Number(e.target.value))}
                  placeholder="1399"
                  className="w-full text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Original Price</label>
                <input
                  type="number"
                  value={item.originalPrice || ''}
                  onChange={(e) => onUpdate('originalPrice', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="1429 (for strikethrough)"
                  className="w-full text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-slate-500 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-slate-400" /> Link URL
                </label>
                <input
                  type="text"
                  value={item.linkUrl || ''}
                  onChange={(e) => onUpdate('linkUrl', e.target.value)}
                  placeholder="/products/your-product-id"
                  className="w-full text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-slate-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Step 4 — Size Selection */}
          <div className="bg-[#faf8f5] rounded-xl p-3.5 border border-[#eee8de] space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-slate-500" />
                Available Sizes
              </p>
              <span className="text-[10px] text-slate-400">Click to toggle active sizes</span>
            </div>

            {/* Standard size chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {STANDARD_SIZES.map((sz) => {
                const itemSize = currentSizes.find((s) => s.size === sz);
                const isSelected = !!itemSize;
                const isAvailable = itemSize ? itemSize.isAvailable : false;

                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`min-w-[36px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected && isAvailable
                        ? 'bg-[#030303] text-white shadow-xs'
                        : isSelected && !isAvailable
                        ? 'bg-rose-100 text-rose-600 border border-rose-200 line-through opacity-70'
                        : 'bg-white border border-[#e8e2d8] text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <span>{sz}</span>
                    {isSelected && isAvailable && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}

              {/* Extra custom sizes if any */}
              {currentSizes
                .filter((s) => !STANDARD_SIZES.includes(s.size))
                .map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => toggleSize(s.size)}
                    className={`min-w-[36px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      s.isAvailable
                        ? 'bg-[#89591C] text-white shadow-xs'
                        : 'bg-rose-100 text-rose-600 border border-rose-200 line-through opacity-70'
                    }`}
                  >
                    <span>{s.size}</span>
                    {s.isAvailable && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                ))}
            </div>

            {/* Add custom size input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                placeholder="Custom size (e.g. 12, S, M)..."
                className="text-[11px] bg-white border border-[#e8e2d8] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none w-48"
              />
              <button
                type="button"
                onClick={addCustomSize}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#e8e2d8] hover:bg-slate-50 text-slate-700 text-[11px] font-bold cursor-pointer"
              >
                + Add Size
              </button>
            </div>
          </div>

          {/* Step 5 — Color Options */}
          <div className="bg-[#faf8f5] rounded-xl p-3.5 border border-[#eee8de] space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-500" />
                Color Options
              </p>
              <span className="text-[10px] text-slate-400">Select preset or type custom hex</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((preset) => {
                const isSelected = currentColors.some((c) => c.name.toLowerCase() === preset.name.toLowerCase());
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => togglePresetColor(preset.name, preset.code)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-2 border-[#030303] shadow-xs'
                        : 'bg-white border border-[#e8e2d8] text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 flex-shrink-0"
                      style={{ background: preset.code }}
                    />
                    <span>{preset.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#030303] stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Selected colors active list */}
            {currentColors.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#f0ece5]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mr-1">Active:</span>
                {currentColors.map((c) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#e8e2d8] text-xs font-medium text-slate-800 shadow-2xs"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ background: c.colorCode }}
                    />
                    <span>{c.name}</span>
                    <button
                      type="button"
                      onClick={() => removeColor(c.name)}
                      className="text-slate-400 hover:text-rose-500 ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Custom Color Creator with Live Preview Dot */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                type="text"
                value={customColorName}
                onChange={(e) => setCustomColorName(e.target.value)}
                placeholder="Color name (e.g. Cherry Red)..."
                className="text-[11px] bg-white border border-[#e8e2d8] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none w-44"
              />

              {/* Color Code + Visual Wheel + Live Preview */}
              <div className="flex items-center gap-1.5 bg-white border border-[#e8e2d8] rounded-lg px-2 py-1">
                <input
                  type="color"
                  value={customColorCode.startsWith('#') ? customColorCode : '#000000'}
                  onChange={(e) => setCustomColorCode(e.target.value)}
                  className="w-5 h-5 rounded border-0 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={customColorCode}
                  onChange={(e) => {
                    let v = e.target.value.trim();
                    if (!v.startsWith('#') && v.length > 0) v = '#' + v;
                    setCustomColorCode(v);
                  }}
                  placeholder="#hex"
                  className="text-[11px] font-mono text-slate-800 focus:outline-none w-20"
                />
                {/* Live color dot */}
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs"
                  style={{ background: customColorCode || '#1a1a1a' }}
                />
              </div>

              <button
                type="button"
                onClick={addCustomColor}
                className="px-3 py-1.5 rounded-lg bg-[#89591C] hover:bg-[#724a17] text-white text-[11px] font-bold cursor-pointer transition-colors"
              >
                + Add Color
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

/* ─── Photo Slot ─────────────────────────────────────────────────────────── */

function PhotoSlot({
  url, alt, hint, isUploading, onFile, onUrlChange, soft,
}: {
  url: string;
  alt: string;
  hint: string;
  isUploading: boolean;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlChange: (v: string) => void;
  soft?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {/* Preview / Upload box */}
      <div
        className={`relative w-full aspect-[4/3] rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors ${
          url
            ? 'border-transparent'
            : soft
            ? 'border-[#d8d0c4] bg-[#fafaf8]'
            : 'border-[#c9b8a0] bg-[#faf4ec]'
        }`}
      >
        {url ? (
          <>
            <Image src={url} alt={alt || 'preview'} fill className="object-cover" />
            <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer gap-1">
              <Upload className="w-4 h-4" />
              <span className="text-[10px] font-bold">Change photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
          </>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-[#f5ede0]/50 transition-colors px-2 text-center gap-1">
            {isUploading ? (
              <span className="text-[10px] font-bold text-[#89591C] animate-pulse">Uploading…</span>
            ) : (
              <>
                <Upload className={`w-5 h-5 mb-0.5 ${soft ? 'text-slate-400' : 'text-[#89591C]'}`} />
                <span className={`text-[10px] font-semibold ${soft ? 'text-slate-500' : 'text-slate-700'}`}>
                  Click to upload
                </span>
                <span className="text-[9px] text-slate-400">{hint}</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        )}
      </div>

      {/* URL input */}
      <input
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="Or paste image URL…"
        className="w-full text-[10px] bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none placeholder:text-slate-300 font-mono"
      />
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function AdminHomeContentPage() {
  const [sections, setSections]         = useState<HomeSectionData[]>([]);
  const [activeKey, setActiveKey]       = useState<string>('best_sellers');
  const [products, setProducts]         = useState<ProductOption[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [uploading, setUploading]       = useState<{ itemIdx: number; field: 'image' | 'inset' } | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── Load data ── */
  const load = async () => {
    setLoading(true);
    try {
      const [secRes, prodRes] = await Promise.all([
        fetch('/api/home-sections'),
        fetch('/api/products?limit=200').catch(() => null),
      ]);

      const secData = await secRes.json();
      if (secData.success && Array.isArray(secData.sections)) {
        setSections(secData.sections as HomeSectionData[]);
      }

      if (prodRes) {
        const pd = await prodRes.json();
        if (Array.isArray(pd.products)) setProducts(pd.products);
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── Helpers ── */
  const activeMeta  = SECTIONS.find((s) => s.key === activeKey)!;
  const ActiveIcon  = activeMeta.icon;

  const currentSection: HomeSectionData =
    sections.find((s) => s.sectionKey === activeKey) ?? {
      sectionKey: activeKey as any,
      title:      activeMeta.label,
      subtitle:   activeMeta.desc,
      isActive:   true,
      displayOrder: SECTIONS.findIndex((s) => s.key === activeKey) + 1,
      items: [],
    };

  const update = (fields: Partial<HomeSectionData>) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.sectionKey === activeKey);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...fields };
        return next;
      }
      return [...prev, { ...currentSection, ...fields }];
    });
  };

  const updateItem = (itemIdx: number, field: keyof HomeSectionItem, value: any) => {
    const items = [...currentSection.items];
    items[itemIdx] = { ...items[itemIdx], [field]: value };
    update({ items });
  };

  const removeItem = (itemIdx: number) => {
    update({ items: currentSection.items.filter((_, i) => i !== itemIdx) });
  };

  const addItem = () => {
    if (currentSection.items.length >= 10) {
      showToast('Max 10 cards per section', 'error');
      return;
    }
    update({
      items: [
        ...currentSection.items,
        {
          id:           `item_${Date.now()}`,
          title:        '',
          description:  '',
          price:        1399,
          originalPrice:1429,
          imageUrl:     '',
          insetImageUrl:'',
          sizes:        [
            { size: '6', isAvailable: true },
            { size: '7', isAvailable: true },
            { size: '8', isAvailable: true },
            { size: '9', isAvailable: true },
            { size: '10', isAvailable: true },
          ],
          colors:       [
            { name: 'Black', colorCode: '#1a1a1a' },
            { name: 'Brown', colorCode: '#4a2c11' },
            { name: 'Tan', colorCode: '#c28b57' },
          ],
          linkUrl:      '/products',
          isAvailable:  true,
          displayOrder: currentSection.items.length,
        },
      ],
    });
  };

  const pickProduct = (itemIdx: number, productId: string) => {
    const prod = products.find((p) => p._id === productId);
    if (!prod) return;
    const img0 = typeof prod.images?.[0] === 'string' ? prod.images[0] : (prod.images?.[0] as any)?.url || '';
    const img1 = typeof prod.images?.[1] === 'string' ? prod.images[1] : (prod.images?.[1] as any)?.url || img0;

    // Convert product sizes
    let prodSizes: HomeSectionSize[] = [];
    if (Array.isArray(prod.sizeAvailability) && prod.sizeAvailability.length > 0) {
      prodSizes = prod.sizeAvailability.map((s) => ({ size: s.size, isAvailable: s.isAvailable }));
    } else if (Array.isArray(prod.sizes) && prod.sizes.length > 0) {
      prodSizes = prod.sizes.map((s) => ({ size: s, isAvailable: true }));
    }

    // Convert product colors
    let prodColors: HomeSectionColor[] = [];
    if (Array.isArray(prod.colorVariants) && prod.colorVariants.length > 0) {
      prodColors = prod.colorVariants.map((v) => ({ name: v.name, colorCode: v.colorCode || '#1a1a1a' }));
    } else if (Array.isArray(prod.colors) && prod.colors.length > 0) {
      prodColors = prod.colors.map((c) => ({
        name: c,
        colorCode:
          c.toLowerCase() === 'black' ? '#1a1a1a' :
          c.toLowerCase() === 'brown' ? '#4a2c11' :
          c.toLowerCase() === 'tan' ? '#c28b57' :
          c.toLowerCase() === 'red' ? '#dc2626' :
          c.toLowerCase() === 'olive' ? '#556b2f' :
          c.toLowerCase() === 'pink' ? '#f4a6b8' :
          c.toLowerCase() === 'white' ? '#f8f8f8' :
          c.toLowerCase() === 'navy' ? '#1a2a40' : '#1a1a1a',
      }));
    }

    const items = [...currentSection.items];
    items[itemIdx] = {
      ...items[itemIdx],
      productId:     prod._id,
      title:         prod.name,
      description:   prod.description || items[itemIdx].description || '',
      price:         prod.discountPrice || prod.price,
      originalPrice: prod.price !== (prod.discountPrice || prod.price) ? prod.price : undefined,
      sizes:         prodSizes.length > 0 ? prodSizes : items[itemIdx].sizes,
      colors:        prodColors.length > 0 ? prodColors : items[itemIdx].colors,
      linkUrl:       `/products/${prod._id}`,
      imageUrl:      items[itemIdx].imageUrl || img0,
      insetImageUrl: items[itemIdx].insetImageUrl || img1,
    };
    update({ items });
    showToast(`Loaded ${prod.name} with sizes and colors!`);
  };

  const uploadPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    itemIdx: number,
    field: 'image' | 'inset'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading({ itemIdx, field });
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('alt', `${currentSection.title} card ${itemIdx + 1}`);
      const res  = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data.url) {
        updateItem(itemIdx, field === 'image' ? 'imageUrl' : 'insetImageUrl', data.url);
        showToast('Photo uploaded!');
      } else {
        showToast(data.error || 'Upload failed — try pasting a URL', 'error');
      }
    } catch {
      showToast('Upload failed — try pasting a URL', 'error');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res  = await fetch('/api/home-sections', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(currentSection),
      });
      const data = await res.json();
      data.success
        ? showToast(`"${currentSection.title}" saved!`)
        : showToast(data.error || 'Save failed', 'error');
    } catch (e: any) {
      showToast(e.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="max-w-5xl space-y-6 pb-20 font-sansation">

      {/* Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* ── Page Title ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e2d8] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#faf4ec] border border-[#edd9b4]">
            <LayoutGrid className="w-5 h-5 text-[#89591C]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#030303]">Homepage Content Sections</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage product cards, images, descriptions, sizes, and colors for Best Sellers, Top Selling, Latest, and Featured sections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="p-2.5 rounded-xl border border-[#e8e2d8] bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#89591C] hover:bg-[#724a17] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : `Save "${currentSection.title}"`}
          </button>
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SECTIONS.map((sec) => {
          const Icon   = sec.icon;
          const isActive = activeKey === sec.key;
          const count  = sections.find((s) => s.sectionKey === sec.key)?.items?.length ?? 0;

          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => setActiveKey(sec.key)}
              className={`flex flex-col items-start gap-1.5 p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                isActive
                  ? 'shadow-sm scale-[1.01]'
                  : 'border-[#e8e2d8] bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
              style={
                isActive
                  ? { borderColor: sec.color, background: sec.bg }
                  : {}
              }
            >
              <div className="flex items-center justify-between w-full">
                <Icon
                  className="w-4 h-4"
                  style={{ color: isActive ? sec.color : '#94a3b8' }}
                />
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={
                    isActive
                      ? { background: sec.color, color: '#fff' }
                      : { background: '#f1f5f9', color: '#64748b' }
                  }
                >
                  {count}/10
                </span>
              </div>
              <div>
                <p
                  className="text-xs font-bold"
                  style={{ color: isActive ? sec.color : '#1e293b' }}
                >
                  {sec.label}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                  {sec.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Active Section Panel ── */}
      <div className="space-y-4">

        {/* Section settings bar */}
        <div className="bg-white rounded-2xl border border-[#e8e2d8] p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-2xs">
          <div
            className="flex items-center gap-2 flex-shrink-0 px-3 py-2 rounded-xl"
            style={{ background: activeMeta.bg }}
          >
            <ActiveIcon className="w-4 h-4" style={{ color: activeMeta.color }} />
            <span className="text-xs font-bold" style={{ color: activeMeta.color }}>
              {activeMeta.label}
            </span>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={currentSection.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Section heading shown on home page"
              className="w-full text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
            />
            <input
              type="text"
              value={currentSection.subtitle || ''}
              onChange={(e) => update({ subtitle: e.target.value })}
              placeholder="Optional subtitle / tagline"
              className="w-full text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-slate-500 focus:outline-none"
            />
          </div>

          {/* Show / hide toggle */}
          <button
            type="button"
            onClick={() => update({ isActive: !currentSection.isActive })}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
              currentSection.isActive
                ? 'bg-[#f0f5ec] border-[#b6d4a3] text-[#557244]'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            {currentSection.isActive
              ? <><Eye className="w-3.5 h-3.5" /> Visible on Home</>
              : <><EyeOff className="w-3.5 h-3.5" /> Hidden</>}
          </button>
        </div>

        {/* How it works tip */}
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#faf8f5] border border-[#eee8de] text-[11px] text-slate-600">
          <span className="text-base leading-none mt-0.5">💡</span>
          <span>
            Each card lets you specify the <strong>main lifestyle photo</strong>, <strong>floating inset thumbnail</strong>, <strong>description</strong>, <strong>size options</strong>, and <strong>color swatches</strong> with live color circle previews. Auto-filling from the catalog will automatically pull all details into the card!
          </span>
        </div>

        {/* Cards list header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">
            Product Cards
            <span className="ml-2 text-xs font-normal text-slate-400">
              {currentSection.items.length} of 10 added
            </span>
          </p>
          {currentSection.items.length < 10 && (
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm active:scale-95 cursor-pointer"
              style={{ background: activeMeta.color }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Card
            </button>
          )}
        </div>

        {/* Empty state */}
        {currentSection.items.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-14 rounded-2xl border-2 border-dashed border-[#e8e2d8] bg-[#faf8f5] gap-3 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: activeMeta.bg }}
            >
              <ActiveIcon className="w-6 h-6" style={{ color: activeMeta.color }} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No cards added yet</p>
              <p className="text-xs text-slate-500 mt-0.5 max-w-xs">
                This section will auto-show products marked as <em>{activeMeta.label}</em>.<br />
                Add cards below to customize lifestyle photos, sizes, and colors.
              </p>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer active:scale-95 shadow-sm"
              style={{ background: activeMeta.color }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Card
            </button>
          </div>
        )}

        {/* Cards */}
        <div className="space-y-3">
          {currentSection.items.map((item, idx) => (
            <CardEditor
              key={item.id || idx}
              item={item}
              index={idx}
              total={currentSection.items.length}
              products={products}
              sectionColor={activeMeta.color}
              uploading={uploading}
              onUpdate={(field, value) => updateItem(idx, field, value)}
              onRemove={() => removeItem(idx)}
              onUpload={(e, field) => uploadPhoto(e, idx, field)}
              onPickProduct={(pid) => pickProduct(idx, pid)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
