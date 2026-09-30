'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  MoreVertical,
  Search,
  SlidersHorizontal,
  Package,
  CheckCircle2,
  FileText,
  AlertCircle,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  X,
  Loader2,
} from 'lucide-react';

interface ProductItem {
  _id: string;
  name: string;
  slug?: string;
  sku: string;
  targetAudience: 'Men' | 'Women' | 'Babies';
  subCategory: string;
  price: number;
  discountPrice?: number;
  stock: number;
  isBestSeller: boolean;
  noReturnRefundExchange?: boolean;
  images: Array<{ url: string; alt?: string }>;
  colors?: string[];
  colorVariants?: Array<{
    name: string;
    colorCode?: string;
    imageUrl?: string;
    images?: Array<{ url: string; alt?: string }>;
    sizes?: Array<{ size: string; isAvailable?: boolean; stock?: number }>;
    isAvailable?: boolean;
  }>;
  sizes?: string[];
  status: string;
  category?: { _id: string; name: string } | string;
  brand?: { _id: string; name: string } | string;
  createdAt: string;
}

interface StatsData {
  total: number;
  active: number;
  draft: number;
  outOfStock: number;
  lowStock: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    active: 0,
    draft: 0,
    outOfStock: 0,
    lowStock: 0,
  });

  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ _id: string; name: string }>>([]);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success?: boolean;
    message?: string;
    totalRows?: number;
    created?: number;
    updated?: number;
    errors?: Array<{ row: number; name?: string; message: string }>;
    error?: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Helper to safely parse API responses and avoid SyntaxError on HTML/Redirects
  const safeJson = async (res: Response) => {
    if (res.status === 401) {
      window.location.href = '/admin/login';
      return { error: 'Unauthorized. Redirecting to login...' };
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return await res.json();
      } catch (jsonErr: any) {
        return { error: jsonErr?.message || 'Invalid JSON response from server' };
      }
    }
    const text = await res.text().catch(() => '');
    return { error: text && text.length < 200 ? text : `Server error (HTTP ${res.status})` };
  };

  // Fetch Categories & Brands for dropdowns
  useEffect(() => {
    fetch('/api/categories')
      .then(safeJson)
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});

    fetch('/api/brands')
      .then(safeJson)
      .then((data) => {
        if (Array.isArray(data)) setBrands(data);
      })
      .catch(() => {});
  }, []);

  // Fetch Products with live filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory !== 'all') params.append('categoryId', selectedCategory);
      if (selectedBrand !== 'all') params.append('brandId', selectedBrand);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedStockStatus !== 'all') params.append('stockStatus', selectedStockStatus);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await safeJson(res);
      if (res.ok && data) {
        setProducts(data.products || []);
        if (data.stats) setStats(data.stats);
        setTotalCount(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', typeof err === 'object' && err?.message ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, search, selectedCategory, selectedBrand, selectedStatus, selectedStockStatus]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedStatus('all');
    setSelectedStockStatus('all');
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p._id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err: any) {
      console.error('Delete error:', typeof err === 'object' && err?.message ? err.message : String(err));
    }
  };

  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  const handleDeleteAll = async () => {
    const confirmation = prompt('⚠️ WARNING: This will permanently DELETE ALL PRODUCTS from your database!\n\nType "DELETE ALL" to confirm:');
    if (confirmation !== 'DELETE ALL') {
      if (confirmation !== null) alert('Deletion cancelled: Confirmation text did not match "DELETE ALL".');
      return;
    }

    setIsDeletingAll(true);
    try {
      const res = await fetch('/api/products?all=true', { method: 'DELETE' });
      const data = await safeJson(res);
      if (res.ok) {
        alert(data.message || 'All products have been deleted successfully.');
        setSelectedProductIds([]);
        fetchProducts();
      } else {
        alert(data.error || 'Failed to delete all products.');
      }
    } catch (err: any) {
      alert(typeof err === 'object' && err?.message ? err.message : 'An error occurred while deleting products.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedProductIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.length} selected products?`)) return;

    setIsDeletingSelected(true);
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProductIds }),
      });
      const data = await safeJson(res);
      if (res.ok) {
        setSelectedProductIds([]);
        fetchProducts();
      } else {
        alert(data.error || 'Failed to delete selected products.');
      }
    } catch (err: any) {
      alert(typeof err === 'object' && err?.message ? err.message : 'An error occurred while deleting selected products.');
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const data = await safeJson(res);
      if (!res.ok) {
        setImportResult({ error: data.error || 'Failed to import products.' });
      } else {
        setImportResult(data);
        fetchProducts(); // Refresh list immediately
      }
    } catch (err: any) {
      setImportResult({ error: typeof err === 'object' && err?.message ? err.message : 'An unexpected error occurred during import.' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="w-full space-y-5 pb-20 font-sans" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      
      {/* ── Top Header Section (Matches Figma Breadcrumb + Title) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-normal mb-1">
            <Link href="/admin" className="hover:text-slate-700 transition-colors">Dashboard</Link>
            <span>&gt;</span>
            <span className="text-slate-800 font-medium">Products</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#030303] tracking-tight">Products</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Manage your store products, variants and inventory.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Delete Selected Button (shown when items are selected) */}
          {selectedProductIds.length > 0 && (
            <button
              type="button"
              disabled={isDeletingSelected}
              onClick={handleDeleteSelected}
              className="h-9 px-3.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedProductIds.length})</span>
            </button>
          )}

          {/* Delete All Products Button */}
          <button
            type="button"
            disabled={isDeletingAll || (stats.total === 0 && products.length === 0)}
            onClick={handleDeleteAll}
            className="h-9 px-3.5 rounded-md bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Delete all products in database"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>{isDeletingAll ? 'Deleting All...' : 'Delete All'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setImportFile(null);
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            className="h-9 px-3.5 rounded-md bg-white border border-[#d6cfc5] hover:bg-[#faf8f5] text-slate-800 text-xs font-semibold flex items-center gap-2 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#89591C]" />
            <span>Import Excel / CSV</span>
          </button>

          <Link
            href="/admin/products/new"
            className="h-9 px-4 rounded-md bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* ── KPI Metric Cards (5 Horizontal Cards from Figma) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Products */}
        <div className="bg-white rounded-xl border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Total Products</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.total || products.length}</span>
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">All time products</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#f4f2ee] text-slate-600 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Active Products */}
        <div className="bg-white rounded-xl border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Active Products</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.active || products.filter((p) => p.status === 'active').length}</span>
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Published products</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#edf7ee] text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Draft Products */}
        <div className="bg-white rounded-xl border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Draft Products</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.draft || 0}</span>
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Not published</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#fcf4e8] text-amber-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Out of Stock */}
        <div className="bg-white rounded-xl border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Out of Stock</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.outOfStock || 0}</span>
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Products out of stock</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#fcedec] text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* 5. Low Stock */}
        <div className="bg-white rounded-xl border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Low Stock</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.lowStock || 0}</span>
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Running low</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#fef6eb] text-orange-600 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Bar Container (Matches Figma) ── */}
      <div className="bg-white rounded-xl border border-[#e8e2d8] p-3 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, SKU or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-[#faf8f5] border border-[#e8e2d8] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#89591C]"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Categories Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#faf8f5] border border-[#e8e2d8] text-xs text-slate-700 font-medium focus:outline-none focus:border-[#89591C] cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Brands Dropdown */}
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#faf8f5] border border-[#e8e2d8] text-xs text-slate-700 font-medium focus:outline-none focus:border-[#89591C] cursor-pointer"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#faf8f5] border border-[#e8e2d8] text-xs text-slate-700 font-medium focus:outline-none focus:border-[#89591C] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {/* Stock Status Dropdown */}
          <select
            value={selectedStockStatus}
            onChange={(e) => {
              setSelectedStockStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#faf8f5] border border-[#e8e2d8] text-xs text-slate-700 font-medium focus:outline-none focus:border-[#89591C] cursor-pointer"
          >
            <option value="all">Stock Status</option>
            <option value="in_stock">In Stock (&gt;10)</option>
            <option value="low_stock">Low Stock (1-10)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {/* Reset Link */}
          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-[#89591C] hover:bg-[#faf4ec] transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Data Table (Matches Figma Columns & Layout) ── */}
      <div className="bg-white rounded-xl border border-[#e8e2d8] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ece7de] bg-[#faf8f5] text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 pl-4 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedProductIds.length === products.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded text-[#89591C] focus:ring-0 border-slate-300 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3">Product</th>
                <th className="py-3.5 px-3">SKU ID</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Variants</th>
                <th className="py-3.5 px-3 text-right sm:text-left">Price (₹)<br /><span className="text-[9px] text-slate-400 font-normal">MRP / Selling</span></th>
                <th className="py-3.5 px-3">Stock</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 pl-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f0eae1] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Loading Products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center space-y-2">
                    <p className="font-semibold text-slate-700">No products found</p>
                    <p className="text-xs text-slate-400">Try changing your search keywords or active filters.</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isSelected = selectedProductIds.includes(p._id);

                  // Extract valid image prioritizing color variants
                  const validImg =
                    p.colorVariants?.find((cv: any) => cv?.images && cv.images.length > 0 && !cv.images[0]?.url?.includes('photo-1542291026-7eec264c27ff'))?.images?.[0]?.url ||
                    p.colorVariants?.find((cv: any) => cv?.imageUrl && !cv.imageUrl.includes('photo-1542291026-7eec264c27ff'))?.imageUrl ||
                    p.images?.find((img) => img?.url && !img.url.includes('placeholder.svg') && !img.url.includes('photo-1542291026-7eec264c27ff'))?.url ||
                    (p.images && p.images[0]?.url) ||
                    '/products/placeholder.svg';

                  // Category Name
                  const categoryName =
                    typeof p.category === 'object' && p.category !== null
                      ? p.category.name
                      : p.subCategory || 'Casual Shoes';

                  // Color variants summary
                  const colorNames =
                    Array.isArray(p.colorVariants) && p.colorVariants.length > 0
                      ? p.colorVariants.map((cv) => cv.name).join(', ')
                      : Array.isArray(p.colors) && p.colors.length > 0
                      ? p.colors.join(', ')
                      : 'Brown, Black';

                  const colorsCount =
                    Array.isArray(p.colorVariants) && p.colorVariants.length > 0
                      ? p.colorVariants.length
                      : (p.colors || ['Brown']).length;

                  const sizesCount = (p.sizes || ['6', '7', '8', '9', '10']).length;

                  // Price
                  const mrpPrice = p.price || 1999;
                  const sellPrice = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : mrpPrice;

                  // Stock Status
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= 10;
                  const isInStock = p.stock > 10;

                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-[#faf8f5]/80 transition-colors ${
                        isSelected ? 'bg-[#faf4ec]/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(p._id)}
                          className="w-3.5 h-3.5 rounded text-[#89591C] focus:ring-0 border-slate-300 cursor-pointer"
                        />
                      </td>

                      {/* Product Thumbnail & Name */}
                      <td className="py-3.5 px-3 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[#faf8f5] border border-[#e8e2d8] overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                            <Image
                              src={validImg}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-cover object-center"
                            />
                          </div>
                          <div className="space-y-0.5 truncate">
                            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-tight truncate hover:text-[#89591C] transition-colors">
                              <Link href={`/admin/products/${p._id}/edit`}>{p.name}</Link>
                            </h4>
                            {p.noReturnRefundExchange && (
                              <div className="pt-0.5">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
                                  No Return / Refund
                                </span>
                              </div>
                            )}
                            <p className="text-[11px] text-slate-400 font-normal truncate">
                              {colorNames}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SKU ID */}
                      <td className="py-3.5 px-3 font-mono font-medium text-slate-700 text-xs whitespace-nowrap">
                        {p.sku || `JS${p._id.slice(-4).toUpperCase()}`}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {categoryName}
                      </td>

                      {/* Variants */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-slate-800 font-medium text-xs">{colorsCount} Colors</div>
                        <div className="text-slate-400 font-normal text-[11px]">{sizesCount} Sizes</div>
                      </td>

                      {/* Price (MRP / Selling) */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-right sm:text-left">
                        {p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price ? (
                          <>
                            <div className="text-[11px] text-slate-400 line-through">₹{mrpPrice.toLocaleString('en-IN')}</div>
                            <div className="font-bold text-slate-900 text-xs">₹{sellPrice.toLocaleString('en-IN')}</div>
                          </>
                        ) : (
                          <div className="font-bold text-slate-900 text-xs">₹{mrpPrice.toLocaleString('en-IN')}</div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">{p.stock || 0}</div>
                        {isInStock && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
                          </span>
                        )}
                        {isLowStock && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-orange-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Low Stock
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {p.status === 'active' ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#edf7ee] text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#f4f2ee] text-slate-600">
                            {p.status === 'draft' ? 'Draft' : 'Inactive'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-4 pl-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Live on Storefront */}
                          <Link
                            href={`${process.env.NEXT_PUBLIC_STORE_URL || ''}/products/${p.slug || p._id}`}
                            target="_blank"
                            title="Preview on Store"
                            className="w-8 h-8 rounded-lg border border-slate-200 hover:border-[#89591C] hover:bg-[#faf4ec] text-slate-600 hover:text-[#89591C] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Edit Product */}
                          <Link
                            href={`/admin/products/${p._id}/edit`}
                            title="Edit Product"
                            className="w-8 h-8 rounded-lg border border-slate-200 hover:border-[#89591C] hover:bg-[#faf4ec] text-slate-600 hover:text-[#89591C] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>

                          {/* Delete Product */}
                          <button
                            type="button"
                            onClick={() => handleDelete(p._id)}
                            title="Delete Product"
                            className="w-8 h-8 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
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

        {/* ── Pagination Footer (Matches Figma) ── */}
        <div className="p-3.5 border-t border-[#ece7de] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing {products.length > 0 ? (currentPage - 1) * limit + 1 : 0} to{' '}
            {Math.min(currentPage * limit, totalCount)} of {totalCount} results
          </div>

          <div className="flex items-center gap-3">
            {/* Limit Selector */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#faf8f5] border border-[#e8e2d8] text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
            </select>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                const isCurrent = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#89591C] text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && (
                <>
                  <span className="text-slate-400 px-1">...</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer`}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bulk Import Excel/CSV Modal ── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f4f2ee] text-[#89591C] flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bulk Import Products</h3>
                  <p className="text-xs text-slate-500">Upload up to 1,000+ products via Excel or CSV</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Download Templates */}
            <div className="mt-5 p-4 rounded-xl bg-[#faf8f5] border border-[#e8e2d8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Need the standard format?</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Includes sample shoes, sizes, color variants & 5 image slots.</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/gravoz_product_import_template.xlsx"
                  download="gravoz_product_import_template.xlsx"
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-[#d6cfc5] hover:bg-slate-50 text-[11px] font-semibold text-[#89591C] flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </a>
                <a
                  href="/gravoz_product_import_template.csv"
                  download="gravoz_product_import_template.csv"
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-[#d6cfc5] hover:bg-slate-50 text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </a>
              </div>
            </div>

            {/* Step 2: Upload Area Form */}
            <form onSubmit={handleImportSubmit} className="mt-5 space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setImportFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  isDragOver
                    ? 'border-[#89591C] bg-[#faf8f5]'
                    : importFile
                    ? 'border-emerald-500 bg-emerald-50/30'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  id="excelImportInput"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImportFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {importFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                      <Check className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">{importFile.name}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      {(importFile.size / 1024).toFixed(1)} KB &bull; Ready to upload
                    </span>
                    <button
                      type="button"
                      onClick={() => setImportFile(null)}
                      className="mt-2 text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <label htmlFor="excelImportInput" className="cursor-pointer block">
                    <div className="w-12 h-12 rounded-full bg-[#f4f2ee] text-[#89591C] flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Click to browse or drag and drop Excel / CSV file
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Supports .xlsx, .xls, and .csv files
                    </span>
                  </label>
                )}
              </div>

              {/* Status & Error Feedback */}
              {importResult && (
                <div
                  className={`p-4 rounded-xl text-xs space-y-2 ${
                    importResult.error
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  {importResult.error ? (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span>{importResult.error}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>{importResult.message}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-emerald-700">
                        Total Rows: {importResult.totalRows} | Created: {importResult.created} | Updated: {importResult.updated}
                      </div>

                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-emerald-200/60 text-slate-700">
                          <span className="font-semibold text-amber-800 text-[11px] block">
                            Skipped {importResult.errors.length} invalid rows:
                          </span>
                          <div className="max-h-24 overflow-y-auto mt-1 space-y-1 text-[10px]">
                            {importResult.errors.map((err, idx) => (
                              <div key={idx} className="text-slate-600">
                                &bull; Row {err.row} ({err.name || 'Product'}): {err.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="h-9 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!importFile || isImporting}
                  className="h-9 px-5 rounded-lg bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importing Products...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Start Bulk Import</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

