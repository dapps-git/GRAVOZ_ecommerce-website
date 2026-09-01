'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, X, Link as LinkIcon, Plus } from 'lucide-react';

export interface ProductImageItem {
  url: string;
  alt: string;
  publicId?: string;
}

interface ImageUploaderProps {
  images: ProductImageItem[];
  onChange: (images: ProductImageItem[]) => void;
  maxPhotos?: number;
}

export default function ImageUploader({ images = [], onChange, maxPhotos = 6 }: ImageUploaderProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(targetIndex);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', `Product photo ${targetIndex + 1}`);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        const newImages = [...images];
        newImages[targetIndex] = {
          url: data.url,
          alt: `Product photo ${targetIndex + 1}`,
          publicId: data.publicId,
        };
        onChange(newImages);
      } else {
        alert(data.error || 'Upload failed. You can paste image URL directly.');
      }
    } catch (err: any) {
      alert('Upload failed. You can paste image URL directly.');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (images.length >= maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed.`);
      return;
    }
    onChange([...images, { url: trimmed, alt: `Photo ${images.length + 1}` }]);
    setUrlInput('');
  };

  const handleRemovePhoto = (index: number) => {
    const newImages = images.filter((_, idx) => idx !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-3 font-sansation">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
          Product Photos ({images.length} / {maxPhotos})
        </label>
        <span className="text-[11px] text-slate-400">First photo is main hero image</span>
      </div>

      {/* Grid of uploaded images + upload buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {images.map((img, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl bg-white border border-[#e8e2d8] overflow-hidden group shadow-2xs flex items-center justify-center"
          >
            <Image
              src={img.url}
              alt={img.alt || `Photo ${index + 1}`}
              fill
              sizes="120px"
              className="object-contain p-1"
            />
            {index === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-[#89591C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                Main
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemovePhoto(index)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              title="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Upload slot button if under max */}
        {images.length < maxPhotos && (
          <label className="aspect-square rounded-xl bg-[#faf8f5] hover:bg-[#f2ece2] border-2 border-dashed border-[#e8e2d8] hover:border-[#89591C] flex flex-col items-center justify-center cursor-pointer transition-colors p-2 text-center shadow-2xs">
            {uploadingIndex === images.length ? (
              <span className="text-[11px] text-[#89591C] font-semibold animate-pulse">Uploading...</span>
            ) : (
              <>
                <Upload className="w-6 h-6 text-[#89591C] mb-1" />
                <span className="text-[11px] font-bold text-slate-700">+ Upload File</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, images.length)}
                />
              </>
            )}
          </label>
        )}
      </div>

      {/* Quick URL Input */}
      {images.length < maxPhotos && (
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 flex items-center gap-2 bg-white border border-[#e8e2d8] rounded-xl px-3 py-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Or paste photo URL (e.g. /products/product1.webp or https://...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              className="w-full text-xs text-slate-800 focus:outline-none placeholder-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={handleAddUrl}
            className="h-9 px-4 rounded-xl bg-[#89591C] hover:bg-[#724a17] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      )}
    </div>
  );
}
