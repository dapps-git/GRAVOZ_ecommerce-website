'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader, { ProductImageItem } from '@/components/admin/ImageUploader';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface CategoryItem {
  _id: string;
  name: string;
  targetAudience: string;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [targetAudience, setTargetAudience] = useState<'Men' | 'Women' | 'Babies'>('Men');
  const [categoryId, setCategoryId] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [sizes, setSizes] = useState('');
  const [colors, setColors] = useState('');
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState('active');
  const [images, setImages] = useState<ProductImageItem[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch((err) => console.error(err));

    fetch(`/api/products/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((p) => {
        if (p._id) {
          setName(p.name || '');
          setTargetAudience(p.targetAudience || 'Men');
          setCategoryId(p.category?._id || p.category || '');
          setSubCategory(p.subCategory || '');
          setDescription(p.description || '');
          setPrice(p.price?.toString() || '');
          setDiscountPrice(p.discountPrice?.toString() || '');
          setStock(p.stock?.toString() || '0');
          setSizes(Array.isArray(p.sizes) ? p.sizes.join(', ') : '');
          setColors(Array.isArray(p.colors) ? p.colors.join(', ') : '');
          setIsBestSeller(Boolean(p.isBestSeller));
          setIsFeatured(Boolean(p.isFeatured));
          setStatus(p.status || 'active');
          setImages(p.images || []);
        }
      })
      .catch((err) => setError('Failed to load product details: ' + err.message))
      .finally(() => setFetching(false));
  }, [resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/products/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          targetAudience,
          category: categoryId,
          subCategory,
          description,
          price: Number(price),
          discountPrice: discountPrice ? Number(discountPrice) : undefined,
          stock: Number(stock),
          sizes: sizes.split(',').map((s) => s.trim()).filter(Boolean),
          colors: colors.split(',').map((c) => c.trim()).filter(Boolean),
          isBestSeller,
          isFeatured,
          status,
          images: images.filter((img) => img?.url),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update product');

      router.push('/admin/products');
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-slate-400 animate-pulse">Loading product details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products List
        </Link>
        <h1 className="text-xl font-bold text-white">Edit Product: {name}</h1>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3.5 rounded-xl text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Product Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as 'Men' | 'Women' | 'Babies')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Men">Men's Footwear</option>
                <option value="Women">Women's Footwear</option>
                <option value="Babies">Baby / Toddler Shoes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} ({cat.targetAudience})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="active">Active (Visible)</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* 3 Photos Upload Manager */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <ImageUploader images={images} onChange={(newImgs) => setImages(newImgs)} maxPhotos={3} />
        </div>

        {/* Pricing & Stock */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Discount Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Stock (Pairs)
              </label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="rounded border-slate-700 text-amber-500"
              />
              <Sparkles className="w-4 h-4 text-amber-400" /> Best Seller Product
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" /> {loading ? 'Saving Changes...' : 'Update Product Listing'}
        </button>
      </form>
    </div>
  );
}
