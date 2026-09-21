'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PackagePlus,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  RefreshCw,
  ShoppingBag,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';

interface Addon {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  sku: string;
  stock: number;
  applicableCategories: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Shoes' },
  { value: 'shoes', label: 'Shoes (General)' },
  { value: 'casual', label: 'Casual Shoes' },
  { value: 'formal', label: 'Formal Shoes' },
  { value: 'sports', label: 'Sports Shoes' },
  { value: 'sandals', label: 'Sandals' },
  { value: 'boots', label: 'Boots' },
  { value: 'babies', label: 'Babies / Kids' },
];

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  sku: '',
  stock: '99999',
  applicableCategories: ['all'] as string[],
  isActive: true,
  displayOrder: '0',
};

export default function AddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchAddons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/addons');
      const data = await res.json();
      if (data.success && Array.isArray(data.addons)) {
        setAddons(data.addons);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  // ── Filters ──────────────────────────────────────────────────────────────
  const filtered = addons.filter((a) => {
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.sku.toLowerCase().includes(search.toLowerCase());
    const matchActive =
      filterActive === 'all' ||
      (filterActive === 'active' && a.isActive) ||
      (filterActive === 'inactive' && !a.isActive);
    return matchSearch && matchActive;
  });

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEdit = (addon: Addon) => {
    setEditingId(addon._id);
    setForm({
      name: addon.name,
      description: addon.description || '',
      price: addon.price.toString(),
      imageUrl: addon.imageUrl || '',
      sku: addon.sku,
      stock: addon.stock.toString(),
      applicableCategories: addon.applicableCategories,
      isActive: addon.isActive,
      displayOrder: addon.displayOrder.toString(),
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalError('');
  };

  const toggleCategory = (val: string) => {
    setForm((prev) => {
      let cats = [...prev.applicableCategories];
      if (val === 'all') {
        cats = ['all'];
      } else {
        cats = cats.filter((c) => c !== 'all');
        if (cats.includes(val)) {
          cats = cats.filter((c) => c !== val);
          if (cats.length === 0) cats = ['all'];
        } else {
          cats.push(val);
        }
      }
      return { ...prev, applicableCategories: cats };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setModalError('');
    try {
      let uploadFile: File = file;
      try {
        uploadFile = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
      } catch {
        // use original if compress fails
      }

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('folder', 'gravoz/addons');
      formData.append('alt', form.name || 'Shoe Care Add-On');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setForm((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        setModalError(data.error || 'Failed to upload image. You can paste a URL instead.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setModalError('');
    if (!form.name.trim()) { setModalError('Name is required'); return; }
    if (!form.sku.trim()) { setModalError('SKU is required'); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      setModalError('Enter a valid price'); return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        imageUrl: form.imageUrl.trim(),
        sku: form.sku.trim().toUpperCase(),
        stock: Number(form.stock) || 99999,
        applicableCategories: form.applicableCategories,
        isActive: form.isActive,
        displayOrder: Number(form.displayOrder) || 0,
      };

      const url = editingId ? `/api/addons/${editingId}` : '/api/addons';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setModalError(data.error || 'Failed to save addon');
        return;
      }

      await fetchAddons();
      closeModal();
    } catch (err: any) {
      setModalError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/addons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAddons((prev) => prev.filter((a) => a._id !== id));
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Failed to delete addon');
    }
  };

  const handleToggleActive = async (addon: Addon) => {
    try {
      const res = await fetch(`/api/addons/${addon._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !addon.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setAddons((prev) =>
          prev.map((a) => (a._id === addon._id ? { ...a, isActive: !a.isActive } : a))
        );
      }
    } catch {
      // silent
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PackagePlus className="w-6 h-6 text-[#89591C]" />
            Add-Ons Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage shoe care add-ons (polish, laces, care kits) shown to customers at checkout
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#89591C] hover:bg-[#6F3D0E] text-white rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Add-On
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#89591C]/20 focus:border-[#89591C]"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterActive(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${filterActive === f
                  ? 'bg-[#89591C] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-[#89591C] hover:text-[#89591C]'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={fetchAddons}
          title="Refresh"
          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#89591C] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <span className="text-sm text-slate-400 ml-auto">
          {filtered.length} addon{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-slate-300 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading add-ons...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No add-ons found</p>
            <p className="text-xs text-slate-400 mt-1">
              {search ? 'Try a different search term.' : 'Click "New Add-On" to create your first add-on.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Add-On</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Applies To</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((addon) => (
                  <tr key={addon._id} className="hover:bg-slate-50 transition-colors group">
                    {/* Name + Image */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200">
                          {addon.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={addon.imageUrl} alt={addon.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{addon.name}</p>
                          {addon.description && (
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{addon.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* SKU */}
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{addon.sku}</td>
                    {/* Price */}
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      ₹{addon.price.toLocaleString('en-IN')}
                    </td>
                    {/* Categories */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {addon.applicableCategories.map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold capitalize"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* Status Toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(addon)}
                        title={addon.isActive ? 'Click to deactivate' : 'Click to activate'}
                        className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                      >
                        {addon.isActive ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                            <span className="text-emerald-600">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-slate-300" />
                            <span className="text-slate-400">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openEdit(addon)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#89591C] hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(addon._id, addon.name)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Add-On' : 'Create New Add-On'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {modalError && (
                <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 font-medium">
                  {modalError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Premium Shoe Polish Kit"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#89591C]/20 focus:border-[#89591C]"
                />
              </div>

              {/* SKU + Price Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    SKU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value.toUpperCase() }))}
                    placeholder="ADDON-001"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#89591C]/20 focus:border-[#89591C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    placeholder="99"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#89591C]/20 focus:border-[#89591C]"
                  />
                </div>


              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Short description shown to customers..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#89591C]/20 focus:border-[#89591C]"
                />
              </div>

              {/* Product Image Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-600">
                    Product Image
                  </label>
                  {uploadingImage && (
                    <span className="text-[11px] text-[#89591C] font-semibold animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Uploading image...
                    </span>
                  )}
                </div>

                {/* Main Upload Dropzone & Button */}
                <label
                  className={`w-full rounded-xl border-2 border-dashed transition-all p-4 flex flex-col items-center justify-center cursor-pointer text-center ${uploadingImage
                      ? 'border-[#89591C] bg-[#89591C]/5 pointer-events-none'
                      : 'border-[#e8e2d8] hover:border-[#89591C] bg-[#faf8f5] hover:bg-[#f4efe8]'
                    }`}
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <RefreshCw className="w-6 h-6 text-[#89591C] animate-spin" />
                      <span className="text-xs font-semibold text-[#89591C]">Optimizing & uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 py-1">
                      <div className="w-10 h-10 rounded-full bg-[#89591C]/10 flex items-center justify-center text-[#89591C] mb-1">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Upload from Files
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Click here to choose a photo from your computer (JPG, PNG, WEBP)
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Uploaded / Selected Image Preview */}
                {form.imageUrl && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {form.imageUrl.startsWith('/uploads/')
                          ? 'Uploaded File'
                          : form.imageUrl.includes('cloudinary')
                            ? 'Cloudinary Asset'
                            : 'Linked Image'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                        {form.imageUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Optional direct URL input */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Or enter image URL directly:
                  </label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#89591C]/20 focus:border-[#89591C] bg-white text-slate-700"
                  />
                </div>
              </div>

              {/* Stock + Display Order Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#89591C]/20 focus:border-[#89591C]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">99999 = unlimited</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.displayOrder}
                    onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#89591C]/20 focus:border-[#89591C]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Lower = shows first</p>
                </div>
              </div>

              {/* Applicable Categories */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Applicable Categories
                  <span className="text-[10px] font-normal text-slate-400 ml-1">(when to show this add-on)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map(({ value, label }) => {
                    const isSelected = form.applicableCategories.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleCategory(value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${isSelected
                            ? 'bg-[#89591C] text-white border-[#89591C]'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#89591C] hover:text-[#89591C]'
                          }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Active</p>
                  <p className="text-xs text-slate-400">Inactive add-ons won&apos;t be shown to customers</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                  className="cursor-pointer"
                >
                  {form.isActive ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#89591C] hover:bg-[#6F3D0E] disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingId ? 'Update Add-On' : 'Create Add-On'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
