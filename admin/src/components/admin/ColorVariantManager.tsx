'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, X, Upload, Link as LinkIcon, Check, Ruler } from 'lucide-react';
import { ProductImageItem } from './ImageUploader';
import { compressImage } from '@/lib/imageCompression';

export interface ColorVariantImageItem {
  url: string;
  alt: string;
}

export interface ColorVariantSizeItem {
  size: string;
  isAvailable: boolean;
  stock?: number;
}

export interface ColorVariantItem {
  id?: string;
  name: string;
  colorCode?: string;
  imageUrl?: string;
  images?: ColorVariantImageItem[];
  sizes?: ColorVariantSizeItem[];
  isAvailable?: boolean;
}

interface ColorVariantManagerProps {
  colorVariants: ColorVariantItem[];
  onChange: (variants: ColorVariantItem[]) => void;
  availableImages?: ProductImageItem[];
  defaultSizes?: string[];
}

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

const STANDARD_SIZES = ['4', '5', '6', '7', '8', '9', '10', '11'];
const MAX_COLOR_IMAGES = 6;

export default function ColorVariantManager({
  colorVariants = [],
  onChange,
  availableImages = [],
  defaultSizes = ['6', '7', '8', '9', '10'],
}: ColorVariantManagerProps) {
  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('#dc2626');
  const [urlInputs, setUrlInputs] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [customSizeInputs, setCustomSizeInputs] = useState<Record<number, string>>({});

  const addColor = (name: string, code: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (colorVariants.some((v) => v.name.toLowerCase() === trimmed.toLowerCase())) return;

    // Default sizes for the new color variant
    const initialSizes: ColorVariantSizeItem[] = defaultSizes.map((sz) => ({
      size: sz,
      isAvailable: true,
      stock: 10,
    }));

    const newVariant: ColorVariantItem = {
      id: `col-${Date.now()}`,
      name: trimmed,
      colorCode: code || '#000000',
      imageUrl: '',
      images: [],
      sizes: initialSizes,
      isAvailable: true,
    };
    onChange([...colorVariants, newVariant]);
    setCustomName('');
  };

  const removeColor = (index: number) => {
    onChange(colorVariants.filter((_, idx) => idx !== index));
  };

  const updateVariantImages = (index: number, newImages: ColorVariantImageItem[]) => {
    const updated = colorVariants.map((item, idx) => {
      if (idx !== index) return item;
      return {
        ...item,
        images: newImages,
        imageUrl: newImages[0]?.url || item.imageUrl || '',
      };
    });
    onChange(updated);
  };

  const updateVariantSizes = (variantIdx: number, newSizes: ColorVariantSizeItem[]) => {
    const updated = colorVariants.map((item, idx) => {
      if (idx !== variantIdx) return item;
      return {
        ...item,
        sizes: newSizes,
      };
    });
    onChange(updated);
  };

  const toggleSizeForVariant = (variantIdx: number, sizeVal: string) => {
    const variant = colorVariants[variantIdx];
    const currentSizes = Array.isArray(variant.sizes) ? variant.sizes : [];
    const exists = currentSizes.find((s) => s.size === sizeVal);

    if (exists) {
      if (exists.isAvailable) {
        // Toggle to out of stock
        updateVariantSizes(
          variantIdx,
          currentSizes.map((s) => (s.size === sizeVal ? { ...s, isAvailable: false } : s))
        );
      } else {
        // Remove size
        updateVariantSizes(
          variantIdx,
          currentSizes.filter((s) => s.size !== sizeVal)
        );
      }
    } else {
      // Add size as in stock
      updateVariantSizes(variantIdx, [...currentSizes, { size: sizeVal, isAvailable: true, stock: 10 }]);
    }
  };

  const addCustomSizeForVariant = (variantIdx: number) => {
    const inputVal = (customSizeInputs[variantIdx] || '').trim();
    if (!inputVal) return;

    const variant = colorVariants[variantIdx];
    const currentSizes = Array.isArray(variant.sizes) ? variant.sizes : [];
    if (!currentSizes.some((s) => s.size === inputVal)) {
      updateVariantSizes(variantIdx, [...currentSizes, { size: inputVal, isAvailable: true, stock: 10 }]);
    }
    setCustomSizeInputs((prev) => ({ ...prev, [variantIdx]: '' }));
  };

  // File upload for a specific color variant
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    variantIdx: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const variant = colorVariants[variantIdx];
    const currentImages = variant.images || [];
    if (currentImages.length >= MAX_COLOR_IMAGES) {
      alert(`Maximum ${MAX_COLOR_IMAGES} photos per color allowed.`);
      return;
    }

    const uploadKey = `${variantIdx}-new`;
    setUploading((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const optimizedFile = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
      const formData = new FormData();
      formData.append('file', optimizedFile);
      formData.append('alt', `${variant.name || 'Variant'} color photo`);

      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok && data.url) {
        const newImgList = [...currentImages, { url: data.url, alt: `${variant.name} photo` }];
        updateVariantImages(variantIdx, newImgList);
      } else {
        alert(data.error || 'Upload failed. Try pasting a URL instead.');
      }
    } catch {
      alert('Upload failed. Try pasting a URL instead.');
    } finally {
      setUploading((prev) => ({ ...prev, [uploadKey]: false }));
      e.target.value = '';
    }
  };

  // Add URL image to a variant
  const handleAddUrl = (variantIdx: number) => {
    const url = (urlInputs[variantIdx] || '').trim();
    if (!url) return;
    const variant = colorVariants[variantIdx];
    const currentImages = variant.images || [];
    if (currentImages.length >= MAX_COLOR_IMAGES) {
      alert(`Maximum ${MAX_COLOR_IMAGES} photos per color.`);
      return;
    }
    const newImgList = [...currentImages, { url, alt: `${variant.name} photo` }];
    updateVariantImages(variantIdx, newImgList);
    setUrlInputs((prev) => ({ ...prev, [variantIdx]: '' }));
  };

  // Remove one image from a variant
  const handleRemoveImage = (variantIdx: number, imgIdx: number) => {
    const current = colorVariants[variantIdx].images || [];
    updateVariantImages(variantIdx, current.filter((_, i) => i !== imgIdx));
  };

  // Quick-pick from uploaded product photos
  const handlePickPhoto = (variantIdx: number, url: string) => {
    const variant = colorVariants[variantIdx];
    const current = variant.images || [];
    const alreadyAdded = current.some((img) => img.url === url);
    if (alreadyAdded) return;
    if (current.length >= MAX_COLOR_IMAGES) {
      alert(`Maximum ${MAX_COLOR_IMAGES} photos per color.`);
      return;
    }
    updateVariantImages(variantIdx, [...current, { url, alt: `${variant.name} photo` }]);
  };

  return (
    <div className="space-y-3 font-sansation">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
          Product Colors &amp; Per-Color Sizes ({colorVariants.length} Added)
        </label>
        <span className="text-[11px] text-slate-400">Up to 6 photos + sizes per color</span>
      </div>

      {/* Add Custom / Preset Colors */}
      <div className="p-3.5 bg-[#faf8f5] rounded-2xl border border-[#e8e2d8] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700">Quick Color Presets:</span>
          {/* Live Preview Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#e8e2d8] shadow-2xs">
            <span className="text-[10px] text-slate-400 font-medium">Live Preview:</span>
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs transition-colors"
              style={{ backgroundColor: customCode || '#1a1a1a' }}
            />
            <span className="text-[11px] font-bold text-slate-800">
              {customName || 'Color'} ({customCode})
            </span>
          </div>
        </div>

        {/* Quick-Add Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_COLORS.map((preset) => {
            const isAdded = colorVariants.some((v) => v.name.toLowerCase() === preset.name.toLowerCase());
            return (
              <button
                key={preset.name}
                type="button"
                disabled={isAdded}
                onClick={() => addColor(preset.name, preset.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isAdded
                    ? 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed border-slate-200'
                    : 'bg-white border-[#e8e2d8] text-slate-800 hover:border-[#89591C] hover:bg-[#faf4ec]'
                }`}
              >
                <span className="w-3 h-3 rounded-full border border-black/20 flex-shrink-0" style={{ backgroundColor: preset.code }} />
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* Custom Color Creator with Live Hex Code Detection */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Visual Color Wheel Picker */}
          <div className="flex items-center gap-1.5 bg-white border border-[#e8e2d8] rounded-xl px-2 py-1 shadow-2xs">
            <input
              type="color"
              aria-label="Pick color"
              value={customCode.startsWith('#') && customCode.length === 7 ? customCode : '#1a1a1a'}
              onChange={(e) => setCustomCode(e.target.value)}
              className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent p-0"
            />
            <span className="text-[10px] text-slate-400 font-medium">Pick Shade</span>
          </div>

          {/* Hex Code Input with Live Preview */}
          <div className="flex items-center gap-1.5 bg-white border border-[#e8e2d8] rounded-xl px-2.5 py-1.5 shadow-2xs">
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/20 flex-shrink-0 transition-colors"
              style={{ backgroundColor: customCode || '#1a1a1a' }}
            />
            <input
              type="text"
              placeholder="Hex (e.g. #8B4513)"
              value={customCode}
              onChange={(e) => {
                let val = e.target.value.trim();
                if (val && !val.startsWith('#') && /^[0-9A-Fa-f]{3,6}$/.test(val)) {
                  val = '#' + val;
                }
                setCustomCode(val);
              }}
              className="w-24 text-xs font-mono text-slate-800 focus:outline-none placeholder-slate-400"
            />
          </div>

          {/* Color Name Input */}
          <div className="flex-1 min-w-[140px] bg-white border border-[#e8e2d8] rounded-xl px-2.5 py-1.5 shadow-2xs">
            <input
              type="text"
              placeholder="Color name (e.g. Mocha, Cherry Red)..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addColor(customName, customCode);
                }
              }}
              className="w-full text-xs text-slate-800 focus:outline-none placeholder-slate-400"
            />
          </div>

          {/* Add Color Button */}
          <button
            type="button"
            onClick={() => addColor(customName, customCode)}
            className="px-4 py-2 rounded-xl bg-[#89591C] hover:bg-[#724a17] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Color</span>
          </button>
        </div>
      </div>

      {/* Color Variant Cards */}
      {colorVariants.length > 0 && (
        <div className="space-y-4 pt-1">
          {colorVariants.map((item, variantIdx) => {
            const varImages = item.images || [];
            const varSizes = Array.isArray(item.sizes) ? item.sizes : [];
            const isUploadingNew = uploading[`${variantIdx}-new`];
            const canAddMore = varImages.length < MAX_COLOR_IMAGES;

            return (
              <div key={item.id || variantIdx} className="p-4 bg-white rounded-2xl border border-[#e8e2d8] space-y-3.5 shadow-2xs">
                {/* Color Header */}
                <div className="flex items-center justify-between border-b border-[#f0ece5] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: item.colorCode || '#000' }} />
                    <span className="text-sm font-bold text-slate-900">{item.name}</span>
                    <span className="text-[11px] text-slate-400">· {varImages.length}/{MAX_COLOR_IMAGES} photos · {varSizes.filter(s => s.isAvailable).length} sizes available</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeColor(variantIdx)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    title="Remove color"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 1. Photos for this Color */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">Angle Photos ({item.name}):</span>
                  <div className="flex flex-wrap gap-2">
                    {varImages.map((img, imgIdx) => (
                      <div key={imgIdx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#e8e2d8] bg-[#faf8f5] group flex-shrink-0">
                        <Image src={img.url} alt={img.alt} fill sizes="64px" className="object-cover" />
                        {imgIdx === 0 && (
                          <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-[#89591C] text-white px-1 rounded font-bold">Hero</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(variantIdx, imgIdx)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Upload slot */}
                    {canAddMore && (
                      <label className="w-16 h-16 flex-shrink-0 rounded-xl border-2 border-dashed border-[#e8e2d8] hover:border-[#89591C] bg-[#faf8f5] hover:bg-[#f2ece2] flex flex-col items-center justify-center cursor-pointer transition-colors">
                        {isUploadingNew ? (
                          <span className="text-[9px] text-[#89591C] font-semibold animate-pulse text-center px-1">Uploading...</span>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-[#89591C] mb-0.5" />
                            <span className="text-[9px] font-bold text-slate-600">Upload</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, variantIdx)}
                        />
                      </label>
                    )}
                  </div>

                  {/* URL Input Row */}
                  {canAddMore && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 flex items-center gap-1.5 bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-2.5 py-1.5">
                        <LinkIcon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="Or paste photo URL for this color..."
                          value={urlInputs[variantIdx] || ''}
                          onChange={(e) => setUrlInputs((prev) => ({ ...prev, [variantIdx]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddUrl(variantIdx);
                            }
                          }}
                          className="w-full text-xs text-slate-800 bg-transparent focus:outline-none placeholder-slate-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddUrl(variantIdx)}
                        className="h-8 px-3 rounded-lg bg-[#89591C] hover:bg-[#724a17] text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Quick-pick from product photos */}
                  {availableImages.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold">Quick pick:</span>
                      {availableImages.map((pImg, pIdx) => {
                        const alreadyPicked = varImages.some((i) => i.url === pImg.url);
                        return (
                          <button
                            key={pIdx}
                            type="button"
                            disabled={alreadyPicked || !canAddMore}
                            onClick={() => handlePickPhoto(variantIdx, pImg.url)}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition-all ${
                              alreadyPicked
                                ? 'bg-[#89591C] text-white border-[#89591C]'
                                : canAddMore
                                ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer'
                                : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed opacity-60'
                            }`}
                          >
                            {alreadyPicked ? '✓ ' : ''}Photo {pIdx + 1}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. SIZES FOR THIS SPECIFIC COLOR */}
                <div className="bg-[#faf8f5] rounded-xl p-3 border border-[#eee8de] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-slate-500" />
                      Sizes &amp; Availability for {item.name}:
                    </span>
                    <span className="text-[10px] text-slate-400">Green = in stock · Red = out of stock · Gray = not offered</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {STANDARD_SIZES.map((sz) => {
                      const found = varSizes.find((s) => s.size === sz);
                      const isSelected = !!found;
                      const isAvailable = found ? found.isAvailable : false;

                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSizeForVariant(variantIdx, sz)}
                          className={`min-w-[36px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            isSelected && isAvailable
                              ? 'bg-[#557244] text-white shadow-2xs'
                              : isSelected && !isAvailable
                              ? 'bg-rose-100 text-rose-600 border border-rose-300 line-through'
                              : 'bg-white border border-[#e8e2d8] text-slate-600 hover:border-slate-400'
                          }`}
                          title={
                            isSelected && isAvailable
                              ? `Size ${sz} In Stock (click to mark out of stock)`
                              : isSelected && !isAvailable
                              ? `Size ${sz} Out of Stock (click to remove)`
                              : `Add Size ${sz}`
                          }
                        >
                          <span>{sz}</span>
                          {isSelected && isAvailable && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      );
                    })}

                    {/* Extra sizes for this variant */}
                    {varSizes
                      .filter((s) => !STANDARD_SIZES.includes(s.size))
                      .map((s) => (
                        <button
                          key={s.size}
                          type="button"
                          onClick={() => toggleSizeForVariant(variantIdx, s.size)}
                          className={`min-w-[36px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            s.isAvailable
                              ? 'bg-[#89591C] text-white shadow-2xs'
                              : 'bg-rose-100 text-rose-600 border border-rose-300 line-through'
                          }`}
                        >
                          <span>{s.size}</span>
                          {s.isAvailable && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      ))}
                  </div>

                  {/* Add Custom Size for this color */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="text"
                      placeholder="Custom size (e.g. 12)..."
                      value={customSizeInputs[variantIdx] || ''}
                      onChange={(e) => setCustomSizeInputs((prev) => ({ ...prev, [variantIdx]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomSizeForVariant(variantIdx);
                        }
                      }}
                      className="text-[11px] bg-white border border-[#e8e2d8] rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none w-36"
                    />
                    <button
                      type="button"
                      onClick={() => addCustomSizeForVariant(variantIdx)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#e8e2d8] hover:bg-slate-50 text-slate-700 text-[11px] font-bold cursor-pointer"
                    >
                      + Add Size
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
