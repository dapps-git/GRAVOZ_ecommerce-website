'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { compressImage } from '@/lib/imageCompression';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
  GripVertical,
  Check,
  RotateCcw,
  Sliders,
  Tag,
  FolderTree,
  Eye,
  Info,
} from 'lucide-react';

interface CategoryItem {
  _id: string;
  name: string;
  targetAudience: string;
}

interface BrandItem {
  _id: string;
  name: string;
}

interface ProductImageItem {
  url: string;
  alt?: string;
  publicId?: string;
}

interface ColorVariantSizeItem {
  size: string;
  isAvailable: boolean;
  stock?: number;
}

interface ColorVariantItem {
  id: string;
  name: string;
  colorCode: string;
  images: ProductImageItem[];
  sizes: ColorVariantSizeItem[];
  isAvailable?: boolean;
}

const DEFAULT_SIZES_LIST = ['6', '7', '8', '9', '10', '11'];

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);

  // Active Stepper Tab (1 to 8)
  const [activeTab, setActiveTab] = useState<number>(3); // Defaulting to 3 like Figma or 1

  // 1. Basic Info
  const [name, setName] = useState('Pure Leather Casual Shoe');
  const [sku, setSku] = useState('JS5061');
  const [targetAudience, setTargetAudience] = useState<'Men' | 'Women' | 'Babies'>('Men');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [subCategory, setSubCategory] = useState('Casual Shoes');
  const [itemType, setItemType] = useState('Shoe');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('draft');

  // 2. Pricing & Inventory
  const [price, setPrice] = useState('1999');
  const [discountPercent, setDiscountPercent] = useState('30');
  const [discountPrice, setDiscountPrice] = useState('1399');
  const [stock, setStock] = useState('50');
  const [gst, setGst] = useState('12');

  // 3. Variants (Color & Images)
  const [colorVariants, setColorVariants] = useState<ColorVariantItem[]>([
    {
      id: 'var-1',
      name: 'Brown',
      colorCode: '#8B4513',
      images: [],
      sizes: DEFAULT_SIZES_LIST.map((s) => ({ size: s, isAvailable: true, stock: 10 })),
      isAvailable: true,
    },
    {
      id: 'var-2',
      name: 'Black',
      colorCode: '#000000',
      images: [],
      sizes: DEFAULT_SIZES_LIST.map((s) => ({ size: s, isAvailable: true, stock: 10 })),
      isAvailable: true,
    },
  ]);

  const [collapsedVariants, setCollapsedVariants] = useState<Record<string, boolean>>({});

  // 4. Default Sizes
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['6', '7', '8', '9', '10', '11']);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // 5. Description
  const [description, setDescription] = useState(
    'Handcrafted from high-grade full-grain leather, these casual shoes deliver timeless elegance with ergonomic arch support for everyday comfort.'
  );

  // 6. Features
  const [features, setFeatures] = useState(
    '• Anatomical dual-density footbed for pressure relief\n• Genuine water-resistant full-grain leather upper\n• Ultra-lightweight anti-skid TPR outsole\n• Handcrafted with luxury reinforced cross-stitching'
  );

  // 7. Specifications & Attributes
  const [material, setMaterial] = useState('Genuine Full-Grain Leather');
  const [occasion, setOccasion] = useState('Casual / Smart Casual');
  const [strapType, setStrapType] = useState('No Strap');
  const [closureType, setClosureType] = useState('Slip-On');
  const [shoeType, setShoeType] = useState('Casual Loafers');
  const [ageRange, setAgeRange] = useState('Adults (18-60)');
  const [manufacturer, setManufacturer] = useState('GRAVOZ Artisans Pvt. Ltd.');
  const [hsnCode, setHsnCode] = useState('64032000');
  const [packingLength, setPackingLength] = useState('32');
  const [packingWidth, setPackingWidth] = useState('18');
  const [packingHeight, setPackingHeight] = useState('12');

  // 8. SEO & Showcase
  const [isBestSeller, setIsBestSeller] = useState(true);
  const [isTopSeller, setIsTopSeller] = useState(false);
  const [isLatest, setIsLatest] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywordsStr, setKeywordsStr] = useState('leather casual shoes, gravoz footwear, mens comfort loafers');
  const [slug, setSlug] = useState('');

  // Dynamic Price calculations
  const handleRegularPriceChange = (val: string) => {
    setPrice(val);
    const numPrice = Number(val);
    const numPercent = Number(discountPercent);
    if (numPrice > 0 && numPercent > 0) {
      const calculatedSale = Math.round(numPrice * (1 - numPercent / 100));
      setDiscountPrice(calculatedSale.toString());
    }
  };

  const handlePercentChange = (val: string) => {
    setDiscountPercent(val);
    const numPercent = Number(val);
    const numPrice = Number(price);
    if (numPrice > 0) {
      if (numPercent > 0) {
        const calculatedSale = Math.round(numPrice * (1 - numPercent / 100));
        setDiscountPrice(calculatedSale.toString());
      } else {
        setDiscountPrice('');
      }
    }
  };

  const handleSalePriceChange = (val: string) => {
    setDiscountPrice(val);
    const numSale = Number(val);
    const numPrice = Number(price);
    if (numPrice > 0 && numSale > 0 && numSale < numPrice) {
      const calculatedPercent = Math.round(((numPrice - numSale) / numPrice) * 100);
      setDiscountPercent(calculatedPercent.toString());
    } else if (!val) {
      setDiscountPercent('');
    }
  };

  // Fetch Categories & Brands
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0 && !categoryId) setCategoryId(data[0]._id);
        }
      })
      .catch(() => {});

    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBrands(data);
          if (data.length > 0 && !brandId) setBrandId(data[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  // Variant Helpers
  const addColorVariant = () => {
    const newId = `var-${Date.now()}`;
    const newVariant: ColorVariantItem = {
      id: newId,
      name: `Color ${colorVariants.length + 1}`,
      colorCode: '#633e21',
      images: [],
      sizes: selectedSizes.map((s) => ({ size: s, isAvailable: true, stock: 10 })),
      isAvailable: true,
    };
    setColorVariants([...colorVariants, newVariant]);
  };

  const removeColorVariant = (id: string) => {
    if (colorVariants.length <= 1) {
      alert('You must have at least one color variant.');
      return;
    }
    setColorVariants(colorVariants.filter((v) => v.id !== id));
  };

  const updateVariantField = (id: string, field: keyof ColorVariantItem, value: any) => {
    setColorVariants(
      colorVariants.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const toggleVariantCollapse = (id: string) => {
    setCollapsedVariants((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Upload one or more images to a specific variant (parallel)
  const handleVariantImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    variantId: string
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check how many slots remain
    const currentVariant = colorVariants.find((v) => v.id === variantId);
    const currentCount = currentVariant?.images?.length || 0;
    const slotsLeft = 5 - currentCount;
    if (slotsLeft <= 0) {
      alert('Maximum 5 images allowed per variant.');
      return;
    }
    const filesToUpload = files.slice(0, slotsLeft);

    setUploadingVariantId(variantId);
    try {
      // Compress and upload all files in parallel
      const uploadResults = await Promise.all(
        filesToUpload.map(async (file) => {
          try {
            const optimizedFile = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
            const formData = new FormData();
            formData.append('file', optimizedFile);
            formData.append('alt', `${name || 'Product'} photo`);
            const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok && data.url) return { url: data.url, alt: `${name || 'Product'} photo` };
            console.error('Variant upload error:', data.error);
            return null;
          } catch (itemErr) {
            console.error('Failed to upload image item:', itemErr);
            return null;
          }
        })
      );

      const uploaded = uploadResults.filter(Boolean) as { url: string; alt: string }[];

      if (uploaded.length > 0) {
        setColorVariants((prev) =>
          prev.map((v) => {
            if (v.id === variantId) {
              return { ...v, images: [...(v.images || []), ...uploaded] };
            }
            return v;
          })
        );
      } else {
        alert('All uploads failed. Check network or server.');
      }
    } catch {
      alert('Upload failed. Check network or server.');
    } finally {
      setUploadingVariantId(null);
      // Reset input so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  const removeVariantImage = (variantId: string, imgIdx: number) => {
    setColorVariants((prev) =>
      prev.map((v) => {
        if (v.id === variantId) {
          const updated = [...v.images];
          updated.splice(imgIdx, 1);
          return { ...v, images: updated };
        }
        return v;
      })
    );
  };

  // Size toggles
  const toggleSizeSelection = (size: string) => {
    const nextSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];

    setSelectedSizes(nextSizes);

    // Sync to all variants
    setColorVariants((prev) =>
      prev.map((v) => ({
        ...v,
        sizes: nextSizes.map((s) => {
          const existing = v.sizes.find((sz) => sz.size === s);
          return existing || { size: s, isAvailable: true, stock: 10 };
        }),
      }))
    );
  };

  const addCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (!trimmed || selectedSizes.includes(trimmed)) return;
    toggleSizeSelection(trimmed);
    setCustomSizeInput('');
  };

  // Live Summary Computed Values
  const selectedBrandObj = brands.find((b) => b._id === brandId);
  const selectedCategoryObj = categories.find((c) => c._id === categoryId);

  const heroImagePreview = useMemo(() => {
    for (const v of colorVariants) {
      const valid = v.images?.find((img) => img?.url && !img.url.includes('placeholder.svg'));
      if (valid) return valid.url;
      if (v.images?.[0]?.url) return v.images[0].url;
    }
    return '/products/placeholder.svg';
  }, [colorVariants]);

  // Handle Save
  const handleSave = async (targetStatus: 'active' | 'draft' = 'active') => {
    if (!name.trim()) {
      setError('Please enter a product title.');
      setActiveTab(1);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const keywordsArray = keywordsStr.split(',').map((k) => k.trim()).filter(Boolean);

      // Collect all images for fallback
      const allVariantImages: ProductImageItem[] = [];
      colorVariants.forEach((v) => {
        if (Array.isArray(v.images)) {
          v.images.forEach((img) => {
            if (img.url && !allVariantImages.some((i) => i.url === img.url)) {
              allVariantImages.push(img);
            }
          });
        }
      });

      if (allVariantImages.length === 0) {
        allVariantImages.push({ url: '/products/placeholder.svg', alt: name });
      }

      const defaultSizeAvail = selectedSizes.map((s) => ({
        size: s,
        isAvailable: true,
        stock: Math.ceil(Number(stock) / (selectedSizes.length || 1)),
      }));

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
          targetAudience,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          subCategory,
          itemType,
          description,
          features,
          price: Number(price) || 1999,
          discountPrice: discountPrice ? Number(discountPrice) : undefined,
          gst: Number(gst) || 12,
          stock: Number(stock) || 50,
          sizes: selectedSizes,
          sizeAvailability: defaultSizeAvail,
          colors: colorVariants.map((c) => c.name),
          colorVariants: colorVariants.map((c) => ({
            id: c.id,
            name: c.name,
            colorCode: c.colorCode,
            images: c.images,
            imageUrl: c.images[0]?.url || '',
            sizes: c.sizes,
            isAvailable: true,
          })),
          images: allVariantImages,
          material,
          ageRange,
          occasion,
          strapType,
          closureType,
          shoeType,
          manufacturer,
          hsnCode,
          packingLength: packingLength ? Number(packingLength) : undefined,
          packingWidth: packingWidth ? Number(packingWidth) : undefined,
          packingHeight: packingHeight ? Number(packingHeight) : undefined,
          isBestSeller,
          isTopSeller,
          isFeatured,
          isLatest,
          status: targetStatus,
          seo: {
            metaTitle: metaTitle || name,
            metaDescription: metaDescription || description,
            keywords: keywordsArray,
            slug: generatedSlug,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabsList = [
    { id: 1, label: 'Basic Information' },
    { id: 2, label: 'Pricing & Inventory' },
    { id: 3, label: 'Variants (Color & Images)' },
    { id: 4, label: 'Sizes & Stock' },
    { id: 5, label: 'Description' },
    { id: 6, label: 'Features' },
    { id: 7, label: 'Specifications & Attributes' },
    { id: 8, label: 'SEO & Status' },
  ];

  return (
    <div className="w-full space-y-5 pb-24 font-sans font-normal" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      
      {/* ── Top Header Banner (Matches Figma Header) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-[#ece7de]">
        <div>
          <Link
            href="/admin/products"
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-1 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
          </Link>
          <h1 className="text-2xl font-bold text-[#030303] tracking-tight">Add New Product</h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">Add a new product to your store</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSave('draft')}
            className="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSave('active')}
            className="px-5 py-2 rounded-md bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{loading ? 'Saving...' : 'Save Product'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-md text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Main 3-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ══════════════════════════════════════════════════════════════ */}
        {/* COLUMN 1: Left Stepper Navigation                             */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <aside className="lg:col-span-3 xl:col-span-2 space-y-1 sticky top-20 bg-white p-2.5 rounded-lg border border-[#e8e2d8] shadow-2xs">
          {tabsList.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#faf4ec] text-[#89591C] font-semibold shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-[#faf8f5] font-medium'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold flex-shrink-0 ${
                    isActive ? 'bg-[#89591C] text-white' : 'bg-[#89591C]/15 text-[#89591C]'
                  }`}
                >
                  {t.id}
                </span>
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </aside>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* COLUMN 2: Center Main Active Tab Content                      */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <main className="lg:col-span-6 xl:col-span-7 space-y-5">
          
          {/* ── TAB 1: Basic Information ── */}
          {activeTab === 1 && (
            <div className="bg-white rounded-lg p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">1</span>
                  Basic Information
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">Core identification and catalog hierarchy details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Product Title / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pure Leather Casual Shoe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">SKU ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JS5061"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C] font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Target Gender *</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C] font-medium"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Babies">Kids / Babies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Category *</span>
                    <Link href="/admin/categories" className="text-xs text-[#89591C] font-semibold hover:underline">+ New Category</Link>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C] font-medium"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.targetAudience})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Brand *</span>
                    <Link href="/admin/brands" className="text-xs text-[#89591C] font-semibold hover:underline">+ New Brand</Link>
                  </label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C] font-medium"
                  >
                    <option value="">-- Select Brand (Default: GRAVOZ) --</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Sub Category / Style</label>
                  <input
                    type="text"
                    placeholder="e.g. Casual Shoes, Leather Loafers"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Item Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Footwear, Loafer, Sandal"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C] font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: Pricing & Inventory ── */}
          {activeTab === 2 && (
            <div className="bg-white rounded-lg p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  Pricing &amp; Inventory
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">Set retail MRP, percentage discounts, GST, and inventory count</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Regular Price / MRP (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="1999"
                    value={price}
                    onChange={(e) => handleRegularPriceChange(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 font-bold text-[#89591C] focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Discount (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="30"
                      value={discountPercent}
                      onChange={(e) => handlePercentChange(e.target.value)}
                      className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg pl-3.5 pr-8 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#89591C]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Final Sale Price (₹)</label>
                  <input
                    type="number"
                    placeholder="1399"
                    value={discountPrice}
                    onChange={(e) => handleSalePriceChange(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3.5 py-2.5 text-xs text-emerald-700 font-bold focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">GST (%)</label>
                  <select
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#89591C]"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Total Stock Quantity</label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#89591C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: Variants (Color & Images) (Exact Figma Card Layout) ── */}
          {activeTab === 3 && (
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-[#e8e2d8] shadow-2xs">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">3</span>
                    Variants (Color &amp; Images)
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Add color variants for this product. You can add up to 5 color variants.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addColorVariant}
                  className="px-3.5 py-2 rounded-md border border-[#e8e2d8] bg-[#faf8f5] hover:bg-white text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#89591C]" />
                  <span>Add Color Variant</span>
                </button>
              </div>

              {/* Variant Cards List */}
              {colorVariants.map((variant, index) => {
                const isCollapsed = Boolean(collapsedVariants[variant.id]);
                const isDefault = index === 0;

                return (
                  <div
                    key={variant.id}
                    className="bg-white rounded-lg border border-[#e8e2d8] overflow-hidden shadow-2xs transition-shadow hover:shadow-xs"
                  >
                    {/* Card Top Bar */}
                    <div className="flex items-center justify-between p-3.5 bg-white border-b border-[#f0eae1]">
                      <div className="flex items-center gap-2.5">
                        <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                        <span
                          className="w-4 h-4 rounded-full border border-black/15 shadow-inner inline-block"
                          style={{ backgroundColor: variant.colorCode || '#8B4513' }}
                        />
                        <span className="text-xs font-bold text-slate-900">{variant.name || `Color ${index + 1}`}</span>
                        {isDefault && (
                          <span className="px-2 py-0.5 rounded-md bg-[#faf4ec] text-[#89591C] text-[10px] font-bold border border-[#ebdcc9]">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleVariantCollapse(variant.id)}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-500 cursor-pointer"
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeColorVariant(variant.id)}
                          className="p-1 rounded-md hover:bg-rose-50 text-rose-500 cursor-pointer"
                          title="Delete variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    {!isCollapsed && (
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Color Name</label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => updateVariantField(variant.id, 'name', e.target.value)}
                              placeholder="e.g. Brown, Black, Tan"
                              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#89591C]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Color Code</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={variant.colorCode || '#8B4513'}
                                onChange={(e) => updateVariantField(variant.id, 'colorCode', e.target.value)}
                                className="w-8 h-8 rounded-md border border-slate-200 cursor-pointer p-0.5 bg-white"
                              />
                              <input
                                type="text"
                                value={variant.colorCode || '#8B4513'}
                                onChange={(e) => updateVariantField(variant.id, 'colorCode', e.target.value)}
                                placeholder="#8B4513"
                                className="flex-1 bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:border-[#89591C]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Product Images • (Max 5 images) */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-700">
                            Product Images • <span className="text-slate-500 font-medium">(Max 5 images)</span>
                          </label>

                          <div className="flex flex-wrap items-center gap-2.5">
                            {variant.images.map((img, imgIdx) => (
                              <div
                                key={imgIdx}
                                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-[#faf8f5] border border-[#e8e2d8] group"
                              >
                                <Image
                                  src={img.url}
                                  alt={img.alt || 'Variant photo'}
                                  fill
                                  sizes="96px"
                                  className="object-cover object-center"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeVariantImage(variant.id, imgIdx)}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            {/* Add Image Button */}
                            {variant.images.length < 5 && (
                              <label className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#89591C] bg-[#faf8f5] hover:bg-[#faf4ec] flex flex-col items-center justify-center text-slate-600 hover:text-[#89591C] transition-all cursor-pointer">
                                <Plus className="w-4 h-4 mb-0.5" />
                                <span className="text-[10px] font-semibold text-center leading-tight px-1">
                                  {uploadingVariantId === variant.id ? 'Uploading...' : 'Add Images'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  disabled={uploadingVariantId === variant.id}
                                  onChange={(e) => handleVariantImageUpload(e, variant.id)}
                                  className="sr-only"
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TAB 4: Sizes & Stock ── */}
          {activeTab === 4 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">4</span>
                  Sizes &amp; Stock Availability
                </h2>
                <p className="text-xs text-slate-400 font-light mt-0.5">Select footwear sizes that will be available across variants</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-normal text-slate-700">Select Available Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {['4', '5', '6', '7', '8', '9', '10', '11', '12'].map((sz) => {
                    const isSelected = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSizeSelection(sz)}
                        className={`w-11 h-11 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#89591C] text-white border-[#89591C] shadow-xs'
                            : 'bg-[#faf8f5] text-slate-700 border-[#e8e2d8] hover:border-slate-400'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>

                {/* Custom size input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Custom size (e.g. 13, UK 8)"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    className="w-48 bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                  <button
                    type="button"
                    onClick={addCustomSize}
                    className="px-3.5 py-2 rounded-xl bg-white border border-[#e8e2d8] text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    + Add Size
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 5: Description ── */}
          {activeTab === 5 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">5</span>
                  Product Description
                </h2>
                <p className="text-xs text-slate-400 font-light mt-0.5">Engaging story, leather craftsmanship, and comfort pitch for the storefront</p>
              </div>

              <div>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe genuine leather craftsmanship, footbed cushioning, arch support, and occasion versatility..."
                  className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C] leading-relaxed font-light"
                />
              </div>
            </div>
          )}

          {/* ── TAB 6: Features ── */}
          {activeTab === 6 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">6</span>
                  Product Features
                </h2>
                <p className="text-xs text-slate-400 font-light mt-0.5">Key selling points rendered as bullet points on the customer product page</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-normal text-slate-700">Features (one per line)</label>
                <textarea
                  rows={6}
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder={"• Anatomical dual-density footbed for pressure relief\n• Genuine water-resistant full-grain leather upper\n• Ultra-lightweight anti-skid TPR outsole\n• Handcrafted with luxury reinforced cross-stitching"}
                  className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C] leading-relaxed font-light"
                />
                <p className="text-[10px] text-slate-400">Each bullet line automatically formats inside the description accordion.</p>
              </div>
            </div>
          )}

          {/* ── TAB 7: Specifications & Attributes ── */}
          {activeTab === 7 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">7</span>
                  Specifications &amp; Logistics Attributes
                </h2>
                <p className="text-xs text-slate-400 font-light mt-0.5">Material, closures, packing dimensions, manufacturer and HSN details</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Material</label>
                  <input
                    type="text"
                    placeholder="e.g. Genuine Leather, PU"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Occasion</label>
                  <input
                    type="text"
                    placeholder="e.g. Casual, Formal, Wedding"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Strap Type</label>
                  <select
                    value={strapType}
                    onChange={(e) => setStrapType(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  >
                    <option value="No Strap">No Strap</option>
                    <option value="Ankle Strap">Ankle Strap</option>
                    <option value="T-Strap">T-Strap</option>
                    <option value="Back Strap">Back Strap</option>
                    <option value="Cross Strap">Cross Strap</option>
                    <option value="Toe Loop">Toe Loop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Closure Type</label>
                  <select
                    value={closureType}
                    onChange={(e) => setClosureType(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  >
                    <option value="Slip-On">Slip-On</option>
                    <option value="Buckle">Buckle</option>
                    <option value="Velcro">Velcro</option>
                    <option value="Lace-Up">Lace-Up</option>
                    <option value="Zipper">Zipper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Sandal / Shoe Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Loafers, Kolhapuri, Derby"
                    value={shoeType}
                    onChange={(e) => setShoeType(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Age Range</label>
                  <input
                    type="text"
                    placeholder="e.g. Adults (18-60)"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. GRAVOZ Artisans Pvt. Ltd."
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 64032000"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Packing Length (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="32"
                    value={packingLength}
                    onChange={(e) => setPackingLength(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Packing Width (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="18"
                    value={packingWidth}
                    onChange={(e) => setPackingWidth(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Packing Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="12"
                    value={packingHeight}
                    onChange={(e) => setPackingHeight(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 8: SEO & Status ── */}
          {activeTab === 8 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-5 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">8</span>
                  SEO &amp; Showcase Placements
                </h2>
                <p className="text-xs text-slate-400 font-light mt-0.5">Homepage badges and search engine indexing configurations</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-normal text-slate-700 mb-1.5">Product Status</label>
                <div className="flex gap-3">
                  {[
                    { id: 'active', label: 'Active (Live)' },
                    { id: 'draft', label: 'Draft' },
                    { id: 'archived', label: 'Archived' },
                  ].map((st) => (
                    <label
                      key={st.id}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        status === st.id
                          ? 'bg-[#89591C] text-white border-[#89591C]'
                          : 'bg-[#faf8f5] text-slate-700 border-[#e8e2d8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        checked={status === st.id}
                        onChange={() => setStatus(st.id as any)}
                        className="sr-only"
                      />
                      <span>{st.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Homepage Showcase Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Homepage Showcase Placement</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className={`p-3 rounded-lg border flex items-center gap-2.5 cursor-pointer ${isBestSeller ? 'bg-[#faf4ec] border-[#89591C]' : 'bg-[#faf8f5] border-[#e8e2d8]'}`}>
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="w-4 h-4 rounded text-[#89591C] focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">Best Sellers</span>
                      <span className="text-[10px] text-slate-500 font-medium">Shown in top seller strip</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-lg border flex items-center gap-2.5 cursor-pointer ${isTopSeller ? 'bg-[#f0f5ec] border-[#557244]' : 'bg-[#faf8f5] border-[#e8e2d8]'}`}>
                    <input
                      type="checkbox"
                      checked={isTopSeller}
                      onChange={(e) => setIsTopSeller(e.target.checked)}
                      className="w-4 h-4 rounded text-[#557244] focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">Top Selling</span>
                      <span className="text-[10px] text-slate-500 font-medium">Community favorites</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-lg border flex items-center gap-2.5 cursor-pointer ${isLatest ? 'bg-[#edf5fc] border-[#1d6fa4]' : 'bg-[#faf8f5] border-[#e8e2d8]'}`}>
                    <input
                      type="checkbox"
                      checked={isLatest}
                      onChange={(e) => setIsLatest(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1d6fa4] focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">Latest Arrivals</span>
                      <span className="text-[10px] text-slate-500 font-medium">New season collection</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-lg border flex items-center gap-2.5 cursor-pointer ${isFeatured ? 'bg-[#f7eefa] border-[#7c3d8f]' : 'bg-[#faf8f5] border-[#e8e2d8]'}`}>
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-[#7c3d8f] focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">Featured</span>
                      <span className="text-[10px] text-slate-500 font-medium">Curated artisan pick</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* SEO Meta Fields */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Custom URL Slug</label>
                  <input
                    type="text"
                    placeholder="pure-leather-casual-shoe"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Meta Title</label>
                  <input
                    type="text"
                    placeholder={name || 'Pure Leather Casual Shoe | GRAVOZ'}
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Meta Description</label>
                  <textarea
                    rows={2}
                    placeholder="Handcrafted genuine leather casual footwear with anatomical footbed comfort."
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Search Keywords</label>
                  <input
                    type="text"
                    value={keywordsStr}
                    onChange={(e) => setKeywordsStr(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stepper Bottom Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={activeTab <= 1}
              onClick={() => setActiveTab((t) => Math.max(1, t - 1))}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-40"
            >
              ← Previous Step
            </button>

            {activeTab < 8 ? (
              <button
                type="button"
                onClick={() => setActiveTab((t) => Math.min(8, t + 1))}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSave('active')}
                className="px-6 py-2 rounded-lg bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save &amp; Publish</span>
              </button>
            )}
          </div>
        </main>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* COLUMN 3: Right Live Product Summary Card (Exact Figma Card)  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <aside className="lg:col-span-3 xl:col-span-3 space-y-4 sticky top-20">
          <div className="bg-white rounded-lg border border-[#e8e2d8] p-4.5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 tracking-wider">Product Summary</h3>

            {/* Hero Image Preview Box */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#faf8f5] border border-[#e8e2d8] flex items-center justify-center">
              <Image
                src={heroImagePreview}
                alt="Product preview"
                fill
                sizes="300px"
                className="object-contain p-2"
              />
            </div>

            {/* Product Title + Status Badge */}
            <div className="flex items-start justify-between gap-2 pt-1 border-b border-[#f0eae1] pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight leading-snug">
                  {name || 'PRODUCT TITLE'}
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[#faf4ec] text-[#89591C] text-[10px] font-semibold border border-[#ebdcc9] capitalize flex-shrink-0">
                {status}
              </span>
            </div>

            {/* Metadata table */}
            <div className="space-y-2 text-xs text-slate-700 font-medium border-b border-[#f0eae1] pb-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">SKU:</span>
                <span className="font-mono font-semibold text-slate-900">{sku || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Brand:</span>
                <span className="font-semibold text-slate-900">{selectedBrandObj?.name || 'GRAVOZ'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="font-semibold text-slate-900">{selectedCategoryObj?.name || subCategory || 'Casual Shoes'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Base Price:</span>
                <span className="font-bold text-slate-900">₹{discountPrice || price || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Stock:</span>
                <span className="font-semibold text-slate-900">{stock || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="capitalize font-semibold text-slate-900">{status}</span>
              </div>
            </div>

            {/* Variants summary list */}
            <div className="space-y-2 border-b border-[#f0eae1] pb-3">
              <span className="text-xs font-bold text-slate-900 block">
                Variants ({colorVariants.length})
              </span>

              <div className="space-y-2">
                {colorVariants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-xs text-slate-700 font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/15 inline-block"
                        style={{ backgroundColor: v.colorCode || '#8B4513' }}
                      />
                      <span className="font-semibold text-slate-900">{v.name}</span>
                    </div>
                    <span className="text-slate-500 font-medium text-[11px]">
                      {selectedSizes.length} Sizes • Stock: {Math.round(Number(stock) / colorVariants.length) || 10}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sizes Badges */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-900 block">Sizes</span>
              <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-lg px-3 py-2 text-xs text-slate-800 font-medium">
                {selectedSizes.length > 0 ? selectedSizes.join(', ') : 'None selected'}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
