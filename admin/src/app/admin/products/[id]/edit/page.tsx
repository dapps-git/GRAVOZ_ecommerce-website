'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader, { ProductImageItem } from '@/components/admin/ImageUploader';
import SizeManager, { SizeAvailabilityItem } from '@/components/admin/SizeManager';
import ColorVariantManager, { ColorVariantItem } from '@/components/admin/ColorVariantManager';
import { ArrowLeft, Save, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [status, setStatus] = useState('active');

  // Images State
  const [images, setImages] = useState<ProductImageItem[]>([]);

  // Sizes State
  const [sizeAvailability, setSizeAvailability] = useState<SizeAvailabilityItem[]>([]);

  // Colors State
  const [colorVariants, setColorVariants] = useState<ColorVariantItem[]>([]);

  // Tags State
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isTopSeller, setIsTopSeller] = useState(false);
  const [isLatest, setIsLatest] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Optional SEO State
  const [showSeo, setShowSeo] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [slug, setSlug] = useState('');

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
          setIsBestSeller(Boolean(p.isBestSeller));
          setIsTopSeller(Boolean(p.isTopSeller));
          setIsFeatured(Boolean(p.isFeatured));
          setIsLatest(Boolean(p.isLatest));
          setStatus(p.status || 'active');
          setImages(p.images || []);

          if (p.seo) {
            setMetaTitle(p.seo.metaTitle || '');
            setMetaDescription(p.seo.metaDescription || '');
            setSlug(p.seo.slug || '');
          }

          // Load color variants
          if (Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
            setColorVariants(p.colorVariants);
          } else if (Array.isArray(p.colors) && p.colors.length > 0) {
            setColorVariants(
              p.colors.map((c: string) => ({
                id: `col-${c}`,
                name: c,
                colorCode: c.toLowerCase() === 'black' ? '#1a1a1a' : c.toLowerCase() === 'brown' ? '#4a2c11' : c.toLowerCase() === 'tan' ? '#c28b57' : '#000000',
                imageUrl: p.images?.[0]?.url || '',
                isAvailable: true,
              }))
            );
          }

          // Load sizes
          if (Array.isArray(p.sizeAvailability) && p.sizeAvailability.length > 0) {
            setSizeAvailability(p.sizeAvailability);
          } else if (Array.isArray(p.sizes) && p.sizes.length > 0) {
            setSizeAvailability(p.sizes.map((s: string) => ({ size: s, isAvailable: true, stock: 10 })));
          } else {
            setSizeAvailability([
              { size: '6', isAvailable: true, stock: 10 },
              { size: '7', isAvailable: true, stock: 10 },
              { size: '8', isAvailable: true, stock: 10 },
              { size: '9', isAvailable: true, stock: 10 },
            ]);
          }
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
      const sizesList = sizeAvailability.map((s) => s.size);
      const colorsList = colorVariants.map((c) => c.name);

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
          sizes: sizesList,
          sizeAvailability,
          colors: colorsList,
          colorVariants,
          isBestSeller,
          isTopSeller,
          isFeatured,
          isLatest,
          status,
          images: images.filter((img) => img?.url),
          seo: {
            metaTitle: metaTitle || name,
            metaDescription: metaDescription || description,
            slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          },
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
    return <div className="text-center py-20 text-slate-500 text-sm">Loading product...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-5 pb-20 font-sansation">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-[#faf8f5]/90 backdrop-blur-md py-3 z-10 border-b border-[#e8e2d8]">
        <div>
          <Link
            href="/admin/products"
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Edit Product</h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white border border-[#e8e2d8] text-xs font-semibold text-slate-800"
          >
            <option value="active">Active (Visible)</option>
            <option value="draft">Draft (Hidden)</option>
            <option value="archived">Archived</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="h-10 px-6 rounded-xl bg-[#89591C] hover:bg-[#724a17] text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Card 1: Basic Information */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#f0eae1] pb-2">
          1. Product Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Audience / Department *
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as any)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            >
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Babies">Kids / Babies</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            >
              <option value="">-- Select Category --</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.targetAudience})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>
        </div>
      </div>

      {/* Card 2: Price & Inventory */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#f0eae1] pb-2">
          2. Pricing & Stock
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Regular Price (₹) *
            </label>
            <input
              type="number"
              step="1"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sale / Offer Price (₹ Optional)
            </label>
            <input
              type="number"
              step="1"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>
        </div>
      </div>

      {/* Card 3: Photos */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] shadow-2xs">
        <ImageUploader images={images} onChange={(newImgs) => setImages(newImgs)} maxPhotos={6} />
      </div>

      {/* Card 4: Sizes */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] shadow-2xs">
        <SizeManager sizes={sizeAvailability} onChange={setSizeAvailability} />
      </div>

      {/* Card 5: Colors */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] shadow-2xs">
        <ColorVariantManager
          colorVariants={colorVariants}
          onChange={setColorVariants}
          availableImages={images}
        />
      </div>

      {/* Card 6: Homepage Sections */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-3 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#f0eae1] pb-2">
          3. Show in Homepage Sections
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 bg-[#faf8f5] p-3 rounded-xl border border-[#e8e2d8] hover:border-[#89591C] transition-all">
            <input
              type="checkbox"
              checked={isLatest}
              onChange={(e) => setIsLatest(e.target.checked)}
              className="w-4 h-4 rounded border-[#e8e2d8] text-[#89591C] focus:ring-[#89591C]"
            />
            <span>Latest Products</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 bg-[#faf8f5] p-3 rounded-xl border border-[#e8e2d8] hover:border-[#89591C] transition-all">
            <input
              type="checkbox"
              checked={isTopSeller}
              onChange={(e) => setIsTopSeller(e.target.checked)}
              className="w-4 h-4 rounded border-[#e8e2d8] text-[#89591C] focus:ring-[#89591C]"
            />
            <span>Top Selling</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 bg-[#faf8f5] p-3 rounded-xl border border-[#e8e2d8] hover:border-[#89591C] transition-all">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded border-[#e8e2d8] text-[#89591C] focus:ring-[#89591C]"
            />
            <span>Featured Products</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 bg-[#faf8f5] p-3 rounded-xl border border-[#e8e2d8] hover:border-[#89591C] transition-all">
            <input
              type="checkbox"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="w-4 h-4 rounded border-[#e8e2d8] text-[#89591C] focus:ring-[#89591C]"
            />
            <span>Best Sellers</span>
          </label>
        </div>
      </div>

      {/* Optional SEO Dropdown */}
      <div className="bg-white rounded-2xl border border-[#e8e2d8] overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowSeo(!showSeo)}
          className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-[#faf8f5] transition-colors"
        >
          <span>SEO & Search URL (Optional)</span>
          {showSeo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showSeo && (
          <div className="p-4 border-t border-[#f0eae1] space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Custom URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meta Description</label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-[#89591C] hover:bg-[#724a17] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
      >
        <Save className="w-4 h-4" /> {loading ? 'Saving Changes...' : 'Save Changes'}
      </button>
    </form>
  );
}
