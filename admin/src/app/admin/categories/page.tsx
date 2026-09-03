'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  FolderTree,
  Upload,
  Percent,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Users,
  Sparkles,
  Layers,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  targetAudience: 'Men' | 'Women' | 'Babies' | 'All';
  image?: string;
  discountPercentage?: number;
  subCategories: string[];
  displayOrder: number;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [targetAudience, setTargetAudience] = useState<'Men' | 'Women' | 'Babies' | 'All'>('Men');
  const [image, setImage] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [subCategoriesStr, setSubCategoriesStr] = useState('Casual Sandals, Leather Shoes, Loafers, Sneakers');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCat(null);
    setName('');
    setImage('');
    setDiscountPercentage('');
    setTargetAudience('Men');
    setSubCategoriesStr('Casual Sandals, Leather Shoes, Loafers, Sneakers');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCat(cat);
    setName(cat.name);
    setImage(cat.image || '');
    setDiscountPercentage(cat.discountPercentage ? cat.discountPercentage.toString() : '');
    setTargetAudience(cat.targetAudience);
    setSubCategoriesStr(Array.isArray(cat.subCategories) ? cat.subCategories.join(', ') : '');
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', `${name || 'Category'} Image`);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setImage(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const subCategoriesArray = subCategoriesStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        targetAudience,
        image: image || undefined,
        discountPercentage: discountPercentage ? Number(discountPercentage) : 0,
        subCategories: subCategoriesArray,
      };

      let res;
      if (editingCat) {
        res = await fetch(`/api/categories/${editingCat._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        fetchCategories();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save category');
      }
    } catch {
      alert('Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCategories();
      }
    } catch {
      alert('Delete failed');
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = categories.length;
    const menCount = categories.filter((c) => c.targetAudience === 'Men').length;
    const womenCount = categories.filter((c) => c.targetAudience === 'Women').length;
    const kidsCount = categories.filter((c) => c.targetAudience === 'Babies').length;
    const discountedCount = categories.filter((c) => c.discountPercentage && c.discountPercentage > 0).length;

    return { total, menCount, womenCount, kidsCount, discountedCount };
  }, [categories]);

  // Filtered List
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = (c.name || '').toLowerCase().includes(q) || (c.slug || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (audienceFilter !== 'all' && c.targetAudience !== audienceFilter) {
        return false;
      }
      return true;
    });
  }, [categories, search, audienceFilter]);

  return (
    <div className="w-full space-y-5 pb-20 font-sans font-normal" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-normal mb-1">
            <Link href="/admin" className="hover:text-slate-700 transition-colors">Dashboard</Link>
            <span>&gt;</span>
            <span className="text-slate-800 font-medium">Categories</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#030303] tracking-tight">Category Management</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Manage store categories, target audience collections, and category discounts.</p>
        </div>

        <div>
          <button
            type="button"
            onClick={openCreateModal}
            className="h-9 px-4 rounded-md bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards (5 Cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-lg border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Total Categories</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.total}</span>
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Active catalog groups</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#f4f2ee] text-slate-600 flex items-center justify-center flex-shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Men Collection</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.menCount}</span>
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Men categories</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#edf7ee] text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Women Collection</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.womenCount}</span>
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Women categories</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#fcf4e8] text-amber-600 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Kids Collection</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.kidsCount}</span>
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Babies &amp; kids categories</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#edf5fc] text-blue-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Category Discounts</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.discountedCount}</span>
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Active % discounts</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#fcedec] text-rose-600 flex items-center justify-center flex-shrink-0">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="bg-white rounded-lg border border-[#e8e2d8] p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search category name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[#faf8f5] border border-[#e8e2d8] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#89591C]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-[#faf8f5] border border-[#e8e2d8] text-xs text-slate-700 font-medium focus:outline-none focus:border-[#89591C] cursor-pointer"
          >
            <option value="all">All Audiences</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Babies">Kids / Babies</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setAudienceFilter('all');
            }}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-[#89591C] hover:bg-[#faf4ec] transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-lg border border-[#e8e2d8] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ece7de] bg-[#faf8f5] text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 pl-4 pr-3">Category</th>
                <th className="py-3.5 px-3">Target Audience</th>
                <th className="py-3.5 px-3">Sub-Categories / Styles</th>
                <th className="py-3.5 px-3">Discount (%)</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 pl-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f0eae1] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Loading Categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => {
                  const validImg = c.image || '/products/placeholder.svg';

                  return (
                    <tr key={c._id} className="hover:bg-[#faf8f5]/80 transition-colors">
                      {/* Category Name & Thumbnail */}
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-[#faf8f5] border border-[#e8e2d8] overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                            <Image
                              src={validImg}
                              alt={c.name}
                              fill
                              sizes="40px"
                              className="object-cover object-center"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">/{c.slug}</span>
                          </div>
                        </div>
                      </td>

                      {/* Target Audience */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${
                            c.targetAudience === 'Men'
                              ? 'bg-[#edf7ee] text-emerald-700'
                              : c.targetAudience === 'Women'
                              ? 'bg-[#fcf4e8] text-amber-700'
                              : 'bg-[#edf5fc] text-blue-700'
                          }`}
                        >
                          {c.targetAudience}
                        </span>
                      </td>

                      {/* Sub-Categories */}
                      <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs truncate">
                        {Array.isArray(c.subCategories) && c.subCategories.length > 0
                          ? c.subCategories.join(', ')
                          : '—'}
                      </td>

                      {/* Discount (%) */}
                      <td className="py-3 px-3">
                        {c.discountPercentage && c.discountPercentage > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#edf7ee] text-emerald-700 border border-emerald-200">
                            {c.discountPercentage}% OFF
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#edf7ee] text-emerald-700">
                          Active
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-4 pl-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            title="Edit Category"
                            className="w-7 h-7 rounded-md border border-slate-200 hover:border-[#89591C] hover:bg-[#faf4ec] text-slate-600 hover:text-[#89591C] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(c._id)}
                            title="Delete Category"
                            className="w-7 h-7 rounded-md border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-[#e8e2d8] w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[#ece7de] pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCat ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Casual Sandals"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Audience *</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Babies">Kids / Babies</option>
                    <option value="All">All Audiences</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    placeholder="e.g. 20"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Sub-Categories / Styles (comma separated)</label>
                <input
                  type="text"
                  placeholder="Casual Sandal, Leather Shoe, Loafers, Sneakers"
                  value={subCategoriesStr}
                  onChange={(e) => setSubCategoriesStr(e.target.value)}
                  className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category Card Image</label>
                <div className="flex items-center gap-3">
                  {image && (
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-[#faf8f5] border border-[#e8e2d8]">
                      <Image src={image} alt="Category" fill className="object-cover" />
                    </div>
                  )}

                  <label className="flex-1 px-3 py-2 rounded-md border border-dashed border-slate-300 hover:border-[#89591C] bg-[#faf8f5] flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-[#89591C] cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ece7de]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCat ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
