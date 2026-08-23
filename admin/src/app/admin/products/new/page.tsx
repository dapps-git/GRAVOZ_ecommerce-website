'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader, { ProductImageItem } from '@/components/admin/ImageUploader';
import { ArrowLeft, Save, Sparkles, Globe, Tag } from 'lucide-react';
import Link from 'next/link';

interface CategoryItem {
  _id: string;
  name: string;
  targetAudience: string;
}

interface BrandItem {
  _id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [targetAudience, setTargetAudience] = useState<'Men' | 'Women' | 'Babies'>('Men');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [subCategory, setSubCategory] = useState('Sneakers');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [sizes, setSizes] = useState('7, 8, 9, 10, 11');
  const [colors, setColors] = useState('Black, White, Red');
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFeatured, setIsFeatured] = useState(true);

  // SEO Management State
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywordsStr, setKeywordsStr] = useState('');
  const [slug, setSlug] = useState('');
  const [ogImage, setOgImage] = useState('');

  // Exactly 3 photos upload state
  const [images, setImages] = useState<ProductImageItem[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) setCategoryId(data[0]._id);
        }
      })
      .catch((err) => console.error(err));

    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBrands(data);
          if (data.length > 0) setBrandId(data[0]._id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0 || !images[0]?.url) {
      setError('Please upload at least 1 image (up to 3 max)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          targetAudience,
          categoryId,
          brand: brandId || undefined,
          subCategory,
          description,
          price: Number(price),
          discountPrice: discountPrice ? Number(discountPrice) : undefined,
          stock: Number(stock),
          sizes: sizes.split(',').map((s) => s.trim()).filter(Boolean),
          colors: colors.split(',').map((c) => c.trim()).filter(Boolean),
          isBestSeller,
          isFeatured,
          images: images.filter((img) => img?.url),
          seo: {
            metaTitle: metaTitle || name,
            metaDescription: metaDescription || description,
            keywords: keywordsStr.split(',').map((k) => k.trim()).filter(Boolean),
            slug: generatedSlug,
            ogTitle: metaTitle || name,
            ogDescription: metaDescription || description,
            ogImage: ogImage || (images[0]?.url || ''),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');

      router.push('/admin/products');
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 font-light">
      <div className="flex items-center justify-between border-b border-[#e8e2d8] pb-3">
        <Link
          href="/admin/products"
          className="text-xs font-semibold text-slate-600 hover:text-[#89591C] flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
        </Link>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-md text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-md p-4 border border-[#e8e2d8] space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#e8e2d8] pb-2">
            1. Basic Product Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Product Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. GRAVOZ Apex Air Runner"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Audience Category
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as 'Men' | 'Women' | 'Babies')}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              >
                <option value="Men">Men's Footwear</option>
                <option value="Women">Women's Footwear</option>
                <option value="Babies">Baby / Toddler Shoes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assign Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} ({cat.targetAudience})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#89591C]" /> Assign Brand
              </label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              >
                <option value="">No Brand (Generic Catalog)</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sub-Category / Style Tag
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Running, Boots, Casual, Walkers"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="High performance breathable footwear with ergonomic arch support..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>
        </div>

        {/* Section 2: 3 Photos Upload Manager */}
        <div className="bg-white rounded-md p-4 border border-[#e8e2d8] space-y-3">
          <ImageUploader images={images} onChange={(newImgs) => setImages(newImgs)} maxPhotos={3} />
        </div>

        {/* Section 3: Pricing & Stock */}
        <div className="bg-white rounded-md p-4 border border-[#e8e2d8] space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#e8e2d8] pb-2">
            3. Pricing, Inventory & Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Regular Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="129.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Discount Price ($ Optional)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="99.99"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Stock Quantity (Pairs)
              </label>
              <input
                type="number"
                required
                placeholder="25"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Available Sizes (Comma separated)
              </label>
              <input
                type="text"
                placeholder="7, 8, 9, 10, 11"
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Colors (Comma separated)
              </label>
              <input
                type="text"
                placeholder="Black, White, Red"
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#89591C] bg-[#faf4ec] px-3 py-1.5 rounded-md border border-[#e8e2d8]">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="rounded border-[#e8e2d8] text-[#89591C] focus:ring-[#89591C]"
              />
              <Sparkles className="w-3.5 h-3.5 text-[#89591C]" /> Pin as Best Seller Product
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-[#faf8f5] px-3 py-1.5 rounded-md border border-[#e8e2d8]">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-[#e8e2d8] text-[#89591C] focus:ring-[#89591C]"
              />
              Showcase on Home Featured Banner
            </label>
          </div>
        </div>

        {/* Section 4: SEO Management & Meta Tags */}
        <div className="bg-white rounded-md p-4 border border-[#e8e2d8] space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-[#e8e2d8] pb-2 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-[#89591C]" /> 4. SEO Management & Open Graph Meta Tags
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Meta Title
              </label>
              <input
                type="text"
                placeholder="e.g. Buy GRAVOZ Apex Air Runner | Premium Leather Shoes"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                URL Slug
              </label>
              <input
                type="text"
                placeholder="gravoz-apex-air-runner"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Meta Description (Google SERP Snippet)
            </label>
            <textarea
              rows={2}
              placeholder="Discover the GRAVOZ Apex Air Runner. Crafted for maximum performance and ergonomic support..."
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                SEO Keywords (Comma separated)
              </label>
              <input
                type="text"
                placeholder="gravoz shoes, men running sneakers, leather athletic footwear"
                value={keywordsStr}
                onChange={(e) => setKeywordsStr(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Open Graph Image URL (OG Photo)
              </label>
              <input
                type="url"
                placeholder="https://res.cloudinary.com/.../og-photo.jpg"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#89591C] hover:bg-[#724816] text-white font-bold text-xs uppercase tracking-wider rounded-md shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" /> {loading ? 'Publishing Shoe Listing...' : 'Publish Product Listing'}
        </button>
      </form>
    </div>
  );
}
