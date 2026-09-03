'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import Image from 'next/image';
import { Plus, Tag, Globe, Percent, Edit2 } from 'lucide-react';

interface BrandItem {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  discountPercentage?: number;
  status: 'active' | 'inactive';
  seo?: { metaTitle?: string; metaDescription?: string; keywords?: string[] };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [description, setDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywordsStr, setKeywordsStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setBrands(data);
      }
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openCreateModal = () => {
    setEditingBrand(null);
    setName('');
    setLogoUrl('');
    setDiscountPercentage('');
    setDescription('');
    setMetaTitle('');
    setMetaDescription('');
    setKeywordsStr('');
    setIsModalOpen(true);
  };

  const openEditModal = (brand: BrandItem) => {
    setEditingBrand(brand);
    setName(brand.name);
    setLogoUrl(brand.logoUrl || '');
    setDiscountPercentage(brand.discountPercentage ? brand.discountPercentage.toString() : '');
    setDescription(brand.description || '');
    setMetaTitle(brand.seo?.metaTitle || '');
    setMetaDescription(brand.seo?.metaDescription || '');
    setKeywordsStr(brand.seo?.keywords?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name,
        logoUrl,
        discountPercentage: discountPercentage ? Number(discountPercentage) : 0,
        description,
        status: 'active',
        seo: {
          metaTitle: metaTitle || name,
          metaDescription: metaDescription || description,
          keywords: keywordsStr.split(',').map((k) => k.trim()).filter(Boolean),
        },
      };

      const url = editingBrand ? `/api/brands/${editingBrand._id}` : '/api/brands';
      const method = editingBrand ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        setLogoUrl('');
        setDiscountPercentage('');
        setDescription('');
        fetchBrands();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<BrandItem>[] = [
    {
      header: 'Brand Name',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#faf8f5] overflow-hidden relative border border-[#e8e2d8] flex-shrink-0 flex items-center justify-center">
            {row.logoUrl ? (
              <Image src={row.logoUrl} alt={row.name} fill sizes="36px" className="object-contain p-1" />
            ) : (
              <Tag className="w-4 h-4 text-[#89591C]" />
            )}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs">{row.name}</span>
            <div className="text-[10px] text-slate-400">Slug: /{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Brand Discount',
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
          row.discountPercentage && row.discountPercentage > 0
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
            : 'bg-slate-50 text-slate-400 border-slate-200'
        }`}>
          {row.discountPercentage && row.discountPercentage > 0 ? `${row.discountPercentage}% OFF` : 'None'}
        </span>
      ),
    },
    {
      header: 'Description',
      accessor: (row) => (
        <span className="text-xs text-slate-600 line-clamp-1 max-w-xs">{row.description || '—'}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span className="text-xs font-semibold text-emerald-600 capitalize">
          ● {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <button
          type="button"
          onClick={() => openEditModal(row)}
          className="text-xs font-semibold text-[#89591C] hover:underline cursor-pointer"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4 font-sansation">
      <div className="flex items-center justify-between gap-4 border-b border-[#e8e2d8] pb-3">
        <div>
          <h1 className="text-xl font-bold text-[#030303]">Footwear Brands</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Manage partner brands, brand discounts, and manufacturer information.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      <DataTable columns={columns} data={brands} loading={loading} />

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBrand ? `Edit Brand: ${editingBrand.name}` : "Add New Brand"}>
        <form onSubmit={handleSaveBrand} className="space-y-4 font-sansation">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Gravoz Artisans"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand Discount (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="90"
                  placeholder="e.g. 10 for 10% OFF"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl pl-3 pr-8 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#89591C]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Logo URL
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Brand story and heritage..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0ece5]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#e8e2d8] text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Brand'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
