'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import Image from 'next/image';
import { Plus, Tag, Globe } from 'lucide-react';

interface BrandItem {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  status: 'active' | 'inactive';
  seo?: { metaTitle?: string; metaDescription?: string; keywords?: string[] };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
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

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          logoUrl,
          description,
          status: 'active',
          seo: {
            metaTitle: metaTitle || name,
            metaDescription: metaDescription || description,
            keywords: keywordsStr.split(',').map((k) => k.trim()).filter(Boolean),
          },
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        setLogoUrl('');
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
      header: 'Brand Description',
      accessor: (row) => <p className="text-xs text-slate-600 italic font-normal max-w-xs">{row.description || 'No description provided.'}</p>,
    },
    {
      header: 'SEO Meta Title',
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-normal">
          <Globe className="w-3.5 h-3.5 text-[#89591C]" />
          <span>{row.seo?.metaTitle || row.name}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${
          row.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4 font-light">
      <div className="flex items-center justify-between gap-4 border-b border-[#e8e2d8] pb-3">
        <p className="text-xs text-slate-500 font-normal">Manage footwear brand portfolio, logos, and search engine SEO metadata</p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Brand
        </button>
      </div>

      <DataTable columns={columns} data={brands} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Footwear Brand">
        <form onSubmit={handleCreateBrand} className="space-y-3 font-light">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Brand Name</label>
            <input
              type="text"
              required
              placeholder="e.g. GRAVOZ Atelier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Brand Logo Image URL</label>
            <input
              type="url"
              placeholder="https://res.cloudinary.com/.../brand-logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Premium handcrafted leather shoe brand..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div className="border-t border-[#e8e2d8] pt-2 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase">SEO Management</h4>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Meta Title</label>
              <input
                type="text"
                placeholder="GRAVOZ Atelier - Handcrafted Luxury Shoes"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Meta Description</label>
              <input
                type="text"
                placeholder="Shop official GRAVOZ Atelier premium footwear..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Keywords (Comma separated)</label>
              <input
                type="text"
                placeholder="gravoz, luxury shoes, men footwear, leather sneakers"
                value={keywordsStr}
                onChange={(e) => setKeywordsStr(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#89591C] hover:bg-[#724816] text-white font-bold text-xs rounded-md shadow-xs"
          >
            {submitting ? 'Creating Brand...' : 'Save Brand'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
