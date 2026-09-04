'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
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
  GripVertical,
  Star,
  TrendingUp,
  Zap,
  Sparkles,
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

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);

  // Active Stepper Tab (1 to 8)
  const [activeTab, setActiveTab] = useState<number>(1);

  // 1. Basic Info
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [targetAudience, setTargetAudience] = useState<'Men' | 'Women' | 'Babies'>('Men');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [itemType, setItemType] = useState('Shoe');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');

  // 2. Pricing & Inventory
  const [price, setPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [gst, setGst] = useState('12');

  // 3. Variants (Color & Images)
  const [colorVariants, setColorVariants] = useState<ColorVariantItem[]>([]);
  const [collapsedVariants, setCollapsedVariants] = useState<Record<string, boolean>>({});

  // 4. Sizes
  const [selectedSizes, setSelectedSizes] = useState<string[]>(DEFAULT_SIZES_LIST);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // 5. Description
  const [description, setDescription] = useState('');

  // 6. Features
  const [features, setFeatures] = useState('');

  // 7. Specifications & Attributes
  const [material, setMaterial] = useState('');
  const [occasion, setOccasion] = useState('');
  const [strapType, setStrapType] = useState('No Strap');
  const [closureType, setClosureType] = useState('Slip-On');
  const [shoeType, setShoeType] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [packingLength, setPackingLength] = useState('');
  const [packingWidth, setPackingWidth] = useState('');
  const [packingHeight, setPackingHeight] = useState('');

  // 8. SEO & Showcase
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isTopSeller, setIsTopSeller] = useState(false);
  const [isLatest, setIsLatest] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywordsStr, setKeywordsStr] = useState('');
  const [slug, setSlug] = useState('');

  // Pricing calculations
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

  // Fetch initial data
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});

    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setBrands(data);
      })
      .catch(() => {});

    fetch(`/api/products/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((p) => {
        if (p._id) {
          setName(p.name || '');
          setSku(p.sku || '');
          setTargetAudience(p.targetAudience || 'Men');
          setCategoryId(p.category?._id || p.category || '');
          setBrandId(p.brand?._id || p.brand || '');
          setSubCategory(p.subCategory || '');
          setItemType(p.itemType || 'Shoe');
          setDescription(p.description || '');
          setFeatures(p.features || '');
          setPrice(p.price?.toString() || '');
          setDiscountPrice(p.discountPrice?.toString() || '');
          if (p.price && p.discountPrice && p.discountPrice < p.price) {
            setDiscountPercent(Math.round(((p.price - p.discountPrice) / p.price) * 100).toString());
          }
          setGst(p.gst?.toString() || '12');
          setStock(p.stock?.toString() || '0');
          setIsBestSeller(Boolean(p.isBestSeller));
          setIsTopSeller(Boolean(p.isTopSeller));
          setIsFeatured(Boolean(p.isFeatured));
          setIsLatest(Boolean(p.isLatest));
          setStatus(p.status || 'active');

          if (Array.isArray(p.sizes) && p.sizes.length > 0) {
            setSelectedSizes(p.sizes);
          }

          // Specs
          setMaterial(p.material || '');
          setOccasion(p.occasion || '');
          setStrapType(p.strapType || 'No Strap');
          setClosureType(p.closureType || 'Slip-On');
          setShoeType(p.shoeType || '');
          setAgeRange(p.ageRange || '');
          setManufacturer(p.manufacturer || '');
          setHsnCode(p.hsnCode || '');
          setPackingLength(p.packingLength?.toString() || '');
          setPackingWidth(p.packingWidth?.toString() || '');
          setPackingHeight(p.packingHeight?.toString() || '');

          if (p.seo) {
            setMetaTitle(p.seo.metaTitle || '');
            setMetaDescription(p.seo.metaDescription || '');
            setSlug(p.seo.slug || '');
            if (Array.isArray(p.seo.keywords)) {
              setKeywordsStr(p.seo.keywords.join(', '));
            }
          }

          // Variants
          if (Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
            setColorVariants(p.colorVariants);
          } else if (Array.isArray(p.colors) && p.colors.length > 0) {
            setColorVariants(
              p.colors.map((c: string, idx: number) => ({
                id: `var-${idx}`,
                name: c,
                colorCode: c.toLowerCase() === 'black' ? '#000000' : c.toLowerCase() === 'tan' ? '#D2B48C' : '#8B4513',
                images: p.images || [],
                sizes: (p.sizes || DEFAULT_SIZES_LIST).map((sz: string) => ({ size: sz, isAvailable: true, stock: 10 })),
                isAvailable: true,
              }))
            );
          } else {
            setColorVariants([
              {
                id: 'var-1',
                name: 'Default',
                colorCode: '#8B4513',
                images: p.images || [],
                sizes: DEFAULT_SIZES_LIST.map((sz) => ({ size: sz, isAvailable: true, stock: 10 })),
                isAvailable: true,
              },
            ]);
          }
        }
      })
      .catch((err) => setError('Failed to load product details'))
      .finally(() => setFetching(false));
  }, [resolvedParams.id]);

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

  const handleVariantImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    variantId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVariantId(variantId);
    try {
      const optimizedFile = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
      const formData = new FormData();
      formData.append('file', optimizedFile);
      formData.append('alt', `${name || 'Product'} photo`);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setColorVariants((prev) =>
          prev.map((v) => {
            if (v.id === variantId) {
              const currentImgs = v.images || [];
              if (currentImgs.length >= 5) {
                alert('Maximum 5 images allowed per variant.');
                return v;
              }
              return {
                ...v,
                images: [...currentImgs, { url: data.url, alt: `${v.name} photo` }],
              };
            }
            return v;
          })
        );
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch {
      alert('Upload failed. Check network or server.');
    } finally {
      setUploadingVariantId(null);
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

  const toggleSizeSelection = (size: string) => {
    const nextSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];

    setSelectedSizes(nextSizes);

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

  // Handle Save Update
  const handleSave = async (targetStatus: 'active' | 'draft' | 'archived' = status) => {
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

      const res = await fetch(`/api/products/${resolvedParams.id}`, {
        method: 'PUT',
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
      if (!res.ok) throw new Error(data.error || 'Failed to update product');

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

  if (fetching) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-xs font-medium text-slate-500">
        Loading Product Data...
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1550px] mx-auto space-y-6 pb-24 font-sans font-light" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      
      {/* ── Top Header Banner (Matches Figma Header) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-[#ece7de]">
        <div>
          <Link
            href="/admin/products"
            className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-1 font-normal transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
          </Link>
          <h1 className="text-2xl font-bold text-[#030303] tracking-tight">Edit Product</h1>
          <p className="text-xs text-slate-400 font-light mt-0.5">Update product details, variants, and pricing</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSave(status)}
            className="px-5 py-2 rounded-xl bg-[#89591C] hover:bg-[#724816] text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Main 3-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: Stepper Navigation */}
        <aside className="lg:col-span-3 xl:col-span-2 space-y-1 sticky top-20 bg-white p-3 rounded-2xl border border-[#e8e2d8] shadow-2xs">
          {tabsList.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#faf4ec] text-[#89591C] font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#faf8f5] font-light'
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

        {/* COLUMN 2: Center Content */}
        <main className="lg:col-span-6 xl:col-span-7 space-y-6">
          
          {/* TAB 1: Basic Information */}
          {activeTab === 1 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">1</span>
                  Basic Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-normal text-slate-700 mb-1">Product Title / Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">SKU ID *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Target Gender *</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Babies">Kids / Babies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1 flex items-center justify-between">
                    <span>Category *</span>
                    <Link href="/admin/categories" className="text-[10px] text-[#89591C] hover:underline">+ New Category</Link>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
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
                  <label className="block text-xs font-normal text-slate-700 mb-1 flex items-center justify-between">
                    <span>Brand *</span>
                    <Link href="/admin/brands" className="text-[10px] text-[#89591C] hover:underline">+ New Brand</Link>
                  </label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  >
                    <option value="">-- Select Brand --</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Sub Category / Style</label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Item Type</label>
                  <input
                    type="text"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Pricing & Inventory */}
          {activeTab === 2 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  Pricing &amp; Inventory
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Regular Price / MRP (₹) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => handleRegularPriceChange(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold text-[#89591C] focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Discount (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={discountPercent}
                      onChange={(e) => handlePercentChange(e.target.value)}
                      className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#89591C]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Final Sale Price (₹)</label>
                  <input
                    type="number"
                    value={discountPrice}
                    onChange={(e) => handleSalePriceChange(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-emerald-700 font-bold focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">GST (%)</label>
                  <select
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Total Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Variants */}
          {activeTab === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e8e2d8] shadow-2xs">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">3</span>
                    Variants (Color &amp; Images)
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={addColorVariant}
                  className="px-3.5 py-2 rounded-xl border border-[#e8e2d8] bg-[#faf8f5] hover:bg-white text-xs font-medium text-slate-800 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#89591C]" />
                  <span>Add Color Variant</span>
                </button>
              </div>

              {colorVariants.map((variant, index) => {
                const isCollapsed = Boolean(collapsedVariants[variant.id]);
                const isDefault = index === 0;

                return (
                  <div
                    key={variant.id || index}
                    className="bg-white rounded-2xl border border-[#e8e2d8] overflow-hidden shadow-2xs"
                  >
                    <div className="flex items-center justify-between p-3.5 bg-white border-b border-[#f0eae1]">
                      <div className="flex items-center gap-2.5">
                        <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                        <span
                          className="w-4 h-4 rounded-full border border-black/15 shadow-inner inline-block"
                          style={{ backgroundColor: variant.colorCode || '#8B4513' }}
                        />
                        <span className="text-xs font-semibold text-slate-900">{variant.name || `Color ${index + 1}`}</span>
                        {isDefault && (
                          <span className="px-2 py-0.5 rounded-md bg-[#faf4ec] text-[#89591C] text-[10px] font-medium border border-[#ebdcc9]">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleVariantCollapse(variant.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeColorVariant(variant.id)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-normal text-slate-600 mb-1">Color Name</label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => updateVariantField(variant.id, 'name', e.target.value)}
                              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-normal text-slate-600 mb-1">Color Code</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={variant.colorCode || '#8B4513'}
                                onChange={(e) => updateVariantField(variant.id, 'colorCode', e.target.value)}
                                className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                              />
                              <input
                                type="text"
                                value={variant.colorCode || '#8B4513'}
                                onChange={(e) => updateVariantField(variant.id, 'colorCode', e.target.value)}
                                className="flex-1 bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#89591C]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[11px] font-normal text-slate-600">
                            Product Images • <span className="text-slate-400">(Max 5 images)</span>
                          </label>

                          <div className="flex flex-wrap items-center gap-2.5">
                            {(variant.images || []).map((img, imgIdx) => (
                              <div
                                key={imgIdx}
                                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#faf8f5] border border-[#e8e2d8] group"
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

                            {(variant.images || []).length < 5 && (
                              <label className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#89591C] bg-[#faf8f5] hover:bg-[#faf4ec] flex flex-col items-center justify-center text-slate-500 hover:text-[#89591C] transition-all cursor-pointer">
                                <Plus className="w-4 h-4 mb-0.5" />
                                <span className="text-[10px] font-medium">
                                  {uploadingVariantId === variant.id ? 'Uploading...' : 'Add Image'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
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

          {/* TAB 4: Sizes */}
          {activeTab === 4 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">4</span>
                  Sizes &amp; Stock Availability
                </h2>
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

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Custom size (e.g. 13)"
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

          {/* TAB 5: Description */}
          {activeTab === 5 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">5</span>
                  Product Description
                </h2>
              </div>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C] leading-relaxed font-light"
              />
            </div>
          )}

          {/* TAB 6: Features */}
          {activeTab === 6 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">6</span>
                  Product Features
                </h2>
              </div>
              <textarea
                rows={6}
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C] leading-relaxed font-light"
              />
            </div>
          )}

          {/* TAB 7: Specifications */}
          {activeTab === 7 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-4 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">7</span>
                  Specifications &amp; Logistics Attributes
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Material</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Occasion</label>
                  <input
                    type="text"
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
                    value={shoeType}
                    onChange={(e) => setShoeType(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Age Range</label>
                  <input
                    type="text"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
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
                    value={packingHeight}
                    onChange={(e) => setPackingHeight(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SEO & Status */}
          {activeTab === 8 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e8e2d8] space-y-5 shadow-2xs">
              <div className="border-b border-[#f0eae1] pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#89591C] text-white text-[11px] flex items-center justify-center font-bold">8</span>
                  SEO &amp; Showcase Placements
                </h2>
              </div>

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

              <div className="space-y-2">
                <label className="block text-xs font-normal text-slate-700">Homepage Showcase Placement</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer ${isBestSeller ? 'bg-[#faf4ec] border-[#89591C]' : 'bg-[#faf8f5] border-[#e8e2d8]'}`}>
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="w-4 h-4 rounded text-[#89591C] focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-medium text-slate-900 block">Best Sellers</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer ${isTopSeller ? 'bg-[#f0f5ec] border-[#557244]' : 'bg-[#faf8f5] border-[#e8e2d8]'}`}>
                    <input
                      type="checkbox"
                      checked={isTopSeller}
                      onChange={(e) => setIsTopSeller(e.target.checked)}
                      className="w-4 h-4 rounded text-[#557244] focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-medium text-slate-900 block">Top Selling</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer ${isLatest ? 'bg-[#edf5fc] border-[#1d6fa4]' : 'bg-[#faf8f5] border-[#e8e2d8]'}`}>
                    <input
                      type="checkbox"
                      checked={isLatest}
                      onChange={(e) => setIsLatest(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1d6fa4] focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-medium text-slate-900 block">Latest Arrivals</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer ${isFeatured ? 'bg-[#f7eefa] border-[#7c3d8f]' : 'bg-[#faf8f5] border-[#e8e2d8]'}`}>
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-[#7c3d8f] focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-medium text-slate-900 block">Featured</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Custom URL Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Meta Description</label>
                  <textarea
                    rows={2}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-1">Search Keywords</label>
                  <input
                    type="text"
                    value={keywordsStr}
                    onChange={(e) => setKeywordsStr(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={activeTab <= 1}
              onClick={() => setActiveTab((t) => Math.max(1, t - 1))}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-40"
            >
              ← Previous Step
            </button>

            {activeTab < 8 ? (
              <button
                type="button"
                onClick={() => setActiveTab((t) => Math.min(8, t + 1))}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-2xs cursor-pointer"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSave(status)}
                className="px-6 py-2 rounded-xl bg-[#89591C] hover:bg-[#724816] text-white text-xs font-medium transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            )}
          </div>
        </main>

        {/* COLUMN 3: Right Live Product Summary Card */}
        <aside className="lg:col-span-3 xl:col-span-3 space-y-4 sticky top-20">
          <div className="bg-white rounded-2xl border border-[#e8e2d8] p-4.5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-semibold text-slate-900 tracking-wider">Product Summary</h3>

            {/* Hero Image Preview Box */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#faf8f5] border border-[#e8e2d8] flex items-center justify-center">
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
              <span className="px-2 py-0.5 rounded-md bg-[#faf4ec] text-[#89591C] text-[10px] font-medium border border-[#ebdcc9] capitalize flex-shrink-0">
                {status}
              </span>
            </div>

            {/* Metadata table */}
            <div className="space-y-1.5 text-xs text-slate-600 font-light border-b border-[#f0eae1] pb-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">SKU:</span>
                <span className="font-mono text-slate-900">{sku || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Brand:</span>
                <span className="text-slate-900">{selectedBrandObj?.name || 'GRAVOZ'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="text-slate-900">{selectedCategoryObj?.name || subCategory || 'Casual Shoes'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Base Price:</span>
                <span className="font-medium text-slate-900">₹{discountPrice || price || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Stock:</span>
                <span className="text-slate-900">{stock || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="capitalize text-slate-900">{status}</span>
              </div>
            </div>

            {/* Variants summary list */}
            <div className="space-y-2 border-b border-[#f0eae1] pb-3">
              <span className="text-xs font-medium text-slate-800 block">
                Variants ({colorVariants.length})
              </span>

              <div className="space-y-1.5">
                {colorVariants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/15 inline-block"
                        style={{ backgroundColor: v.colorCode || '#8B4513' }}
                      />
                      <span className="font-medium text-slate-900">{v.name}</span>
                    </div>
                    <span className="text-slate-400 font-light">
                      {selectedSizes.length} Sizes • Stock: {Math.round(Number(stock) / colorVariants.length) || 10}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sizes Badges */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-800 block">Sizes</span>
              <div className="bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-700 font-light">
                {selectedSizes.length > 0 ? selectedSizes.join(', ') : 'None selected'}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
