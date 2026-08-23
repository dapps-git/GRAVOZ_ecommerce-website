'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, X, Tag } from 'lucide-react';

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

export default function ImageUploader({ images = [], onChange, maxPhotos = 3 }: ImageUploaderProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(targetIndex);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', images[targetIndex]?.alt || `Shoe photo ${targetIndex + 1}`);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        const newImages = [...images];
        newImages[targetIndex] = {
          url: data.url,
          alt: data.alt || `Product Photo ${targetIndex + 1}`,
          publicId: data.publicId,
        };
        onChange(newImages);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleAltChange = (index: number, altValue: string) => {
    const newImages = [...images];
    if (newImages[index]) {
      newImages[index].alt = altValue;
      onChange(newImages);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const photoSlots = Array.from({ length: maxPhotos });

  return (
    <div className="space-y-4 font-light">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
          Product Photos ({images.filter(img => img?.url).length} of {maxPhotos} Required)
        </label>
        <span className="text-[11px] text-[#89591C] font-semibold">Cloudinary WebP Auto-Optimized</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {photoSlots.map((_, index) => {
          const imgData = images[index];
          const isUploading = uploadingIndex === index;

          return (
            <div
              key={index}
              className="bg-[#faf8f5] border border-[#e8e2d8] rounded-2xl p-3 flex flex-col justify-between space-y-3 relative group"
            >
              <div className="aspect-square w-full rounded-xl bg-white overflow-hidden relative border border-[#e8e2d8] flex items-center justify-center">
                {imgData?.url ? (
                  <>
                    <Image
                      src={imgData.url}
                      alt={imgData.alt || `Photo ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors shadow-sm"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-white/90 text-[#89591C] px-2 py-0.5 rounded-md border border-[#e8e2d8]">
                      Photo #{index + 1}
                    </span>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-[#faf4ec] transition-colors p-4 text-center">
                    {isUploading ? (
                      <div className="text-xs text-[#89591C] animate-pulse font-medium">Uploading to Cloudinary...</div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-[#89591C] mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-800">Upload Photo #{index + 1}</span>
                        <span className="text-[10px] text-slate-400 mt-1">WebP/AVIF (Max 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, index)}
                        />
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Alt Text Input */}
              <div>
                <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1 mb-1">
                  <Tag className="w-3 h-3 text-[#89591C]" /> Alt Text (SEO Tag)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. Men's Leather Running Shoe Side View`}
                  value={imgData?.alt || ''}
                  onChange={(e) => handleAltChange(index, e.target.value)}
                  className="w-full bg-white border border-[#e8e2d8] rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#89591C]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
