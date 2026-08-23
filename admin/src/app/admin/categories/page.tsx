'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { Plus, FolderTree, Layers } from 'lucide-react';

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  targetAudience: 'Men' | 'Women' | 'Babies' | 'All';
  subCategories: string[];
  displayOrder: number;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [targetAudience, setTargetAudience] = useState<'Men' | 'Women' | 'Babies' | 'All'>('Men');
  const [subCategoriesStr, setSubCategoriesStr] = useState('Sneakers, Running, Casual, Formal');
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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          targetAudience,
          subCategories: subCategoriesStr.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to create category:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<CategoryItem>[] = [
    {
      header: 'Category Name',
      accessor: (row: CategoryItem) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#faf4ec] text-[#89591C] border border-[#e8e2d8]">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs">{row.name}</span>
            <div className="text-[10px] text-slate-400">Slug: /{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Group Target',
      accessor: (row: CategoryItem) => (
        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold border ${
          row.targetAudience === 'Men' ? 'bg-[#faf4ec] text-[#89591C] border-[#e8e2d8]' :
          row.targetAudience === 'Women' ? 'bg-pink-50 text-pink-700 border-pink-200' :
          row.targetAudience === 'Babies' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          'bg-slate-100 text-slate-700 border-slate-200'
        }`}>
          {row.targetAudience}
        </span>
      ),
    },
    {
      header: 'Sub-Categories',
      accessor: (row: CategoryItem) => (
        <div className="flex flex-wrap gap-1">
          {row.subCategories?.map((sub: string, idx: number) => (
            <span key={idx} className="bg-[#faf8f5] text-slate-700 text-[10px] px-2 py-0.5 rounded-md border border-[#e8e2d8]">
              {sub}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row: CategoryItem) => (
        <span className={`text-[10px] font-bold ${row.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
          {row.isActive ? '● Active' : '○ Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4 font-light">
      <div className="flex items-center justify-between gap-4 border-b border-[#e8e2d8] pb-3">
        <p className="text-xs text-slate-500 font-normal">Organize shoes under Men, Women, Babies and sub-type tags</p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Category
        </button>
      </div>

      <DataTable columns={columns} data={categories} loading={loading} />

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Shoe Category">
        <form onSubmit={handleCreateCategory} className="space-y-3 font-light">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Athletic & Sport Footwear"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Target Group
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as 'Men' | 'Women' | 'Babies' | 'All')}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            >
              <option value="Men">Men's Footwear</option>
              <option value="Women">Women's Footwear</option>
              <option value="Babies">Baby / Toddler Shoes</option>
              <option value="All">All Groups</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#89591C]" /> Sub-categories (Comma separated)
            </label>
            <input
              type="text"
              placeholder="Running, High Tops, Sandals, Walkers"
              value={subCategoriesStr}
              onChange={(e) => setSubCategoriesStr(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#89591C] hover:bg-[#724816] text-white font-bold text-xs rounded-md shadow-xs transition-all"
          >
            {submitting ? 'Creating...' : 'Save Category'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
