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
  images: Array<{ url: string; alt?: string }>;
  colors?: string[];
  colorVariants?: Array<{ name: string; colorCode?: string }>;
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

  // Fetch Categories & Brands for dropdowns
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
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        if (data.stats) setStats(data.stats);
        setTotalCount(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
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
    } catch (err) {
      console.error('Delete error:', err);
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

        <div>
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

                  // Extract valid image
                  const validImg =
                    p.images?.find((img) => img?.url && !img.url.includes('placeholder.svg'))?.url ||
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
                            href={`http://localhost:3000/products/${p.slug || p._id}`}
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
    </div>
  );
}
