'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export interface SizeAvailabilityItem {
  size: string;
  isAvailable: boolean;
  stock?: number;
}

interface SizeManagerProps {
  sizes: SizeAvailabilityItem[];
  onChange: (sizes: SizeAvailabilityItem[]) => void;
}

const DEFAULT_SIZES = ['4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function SizeManager({ sizes = [], onChange }: SizeManagerProps) {
  const [customSize, setCustomSize] = useState('');

  const toggleSize = (sizeLabel: string) => {
    const exists = sizes.some((s) => s.size === sizeLabel);
    if (exists) {
      onChange(sizes.filter((s) => s.size !== sizeLabel));
    } else {
      const updated = [...sizes, { size: sizeLabel, isAvailable: true, stock: 10 }];
      updated.sort((a, b) => (parseFloat(a.size) || 0) - (parseFloat(b.size) || 0));
      onChange(updated);
    }
  };

  const toggleAvailability = (sizeLabel: string) => {
    onChange(
      sizes.map((s) =>
        s.size === sizeLabel ? { ...s, isAvailable: !s.isAvailable } : s
      )
    );
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = customSize.trim();
    if (!trimmed) return;
    if (!sizes.some((s) => s.size.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...sizes, { size: trimmed, isAvailable: true, stock: 10 }];
      onChange(updated);
    }
    setCustomSize('');
  };

  return (
    <div className="space-y-4 font-sansation">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
          Available Sizes
        </label>
        <span className="text-[11px] text-slate-400">
          {sizes.length} selected
        </span>
      </div>

      {/* Quick-pick size buttons */}
      <div>
        <p className="text-[11px] text-slate-500 mb-2">Click to enable/disable a size:</p>
        <div className="flex flex-wrap items-center gap-2">
          {DEFAULT_SIZES.map((size) => {
            const isSelected = sizes.some((s) => s.size === size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`w-11 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? 'bg-[#89591C] text-white shadow-xs'
                    : 'bg-white border border-[#e8e2d8] text-slate-700 hover:border-slate-400'
                }`}
              >
                {size}
              </button>
            );
          })}

          {/* Custom size input */}
          <div className="flex items-center gap-1.5 ml-1">
            <input
              type="text"
              placeholder="+ Size"
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
              className="w-16 h-10 bg-white border border-[#e8e2d8] rounded-xl px-2 text-center text-xs text-slate-800 focus:outline-none focus:border-[#89591C]"
            />
            <button
              type="button"
              onClick={() => handleAddCustom()}
              className="h-10 px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#89591C] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Selected sizes with In Stock / Out of Stock toggle */}
      {sizes.length > 0 && (
        <div className="border-t border-[#f0eae1] pt-3 space-y-2">
          <p className="text-[11px] text-slate-500">Tap a size below to mark it In Stock or Out of Stock:</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((item) => (
              <div
                key={item.size}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  item.isAvailable
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {/* Toggle availability on click */}
                <button
                  type="button"
                  onClick={() => toggleAvailability(item.size)}
                  className="flex items-center gap-1 cursor-pointer"
                  title={item.isAvailable ? 'Click to mark Out of Stock' : 'Click to mark In Stock'}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  Size {item.size}
                </button>

                {/* Remove size */}
                <button
                  type="button"
                  onClick={() => toggleSize(item.size)}
                  className="text-slate-400 hover:text-rose-600 ml-1"
                  title="Remove size"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400">
            🟢 Green = In Stock (shows on website) &nbsp;|&nbsp; 🔴 Red = Out of Stock (greyed out on website)
          </p>
        </div>
      )}
    </div>
  );
}
