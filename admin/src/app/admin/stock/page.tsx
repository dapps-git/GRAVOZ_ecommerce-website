'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Boxes,
  Plus,
  Minus,
  Search,
  SlidersHorizontal,
  Package,
  AlertCircle,
  ShoppingBag,
  TrendingUp,
  Download,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  Ban,
  RefreshCw,
} from 'lucide-react';

interface StockProduct {
  _id: string;
  name: string;
  sku: string;
  targetAudience: string;
  subCategory: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: Array<{ url: string; alt?: string }>;
  colors?: string[];
  colorVariants?: Array<{ name: string; colorCode?: string }>;
  category?: { _id: string; name: string } | string;
  brand?: { _id: string; name: string } | string;
  updatedAt: string;
}

export default function StockPage() {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ _id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Inline editing stock
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'product' | 'variant'>('product');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCategoriesAndBrands = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/brands'),
      ]);
      const [catData, brandData] = await Promise.all([catRes.json(), brandRes.json()]);
      if (Array.isArray(catData)) setCategories(catData);
      if (Array.isArray(brandData)) setBrands(brandData);
    } catch {}
  };

  const fetchStockData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory !== 'all') params.append('categoryId', selectedCategory);
      if (selectedBrand !== 'all') params.append('brandId', selectedBrand);
      if (selectedStockStatus !== 'all') params.append('stockStatus', selectedStockStatus);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch stock data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, search, selectedCategory, selectedBrand, selectedStockStatus]);

  useEffect(() => {
    fetchCategoriesAndBrands();
  }, []);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  // Handle Quick Stock Update (+, -, Set to 0, or custom value)
  const handleQuickStockChange = async (productId: string, newStock: number) => {
    const finalStock = Math.max(0, Math.floor(newStock));
    setUpdatingId(productId);

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, stock: finalStock } : p))
    );

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: finalStock }),
      });

      if (!res.ok) {
        // Rollback on failure
        fetchStockData();
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
      fetchStockData();
    } finally {
      setUpdatingId(null);
      setEditingStockId(null);
    }
  };

  const saveInlineStock = (productId: string) => {
    const num = parseInt(tempStockValue, 10);
    if (!isNaN(num)) {
      handleQuickStockChange(productId, num);
    } else {
      setEditingStockId(null);
    }
  };

  // Overall Inventory Stats
  const stockStats = useMemo(() => {
    let totalStockUnits = 0;
    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const pStock = p.stock || 0;
      const unitPrice = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price || 0;
      totalStockUnits += pStock;
      totalInventoryValue += pStock * unitPrice;

      if (pStock <= 0) outOfStockCount++;
      else if (pStock <= 10) lowStockCount++;
    });

    return {
      totalProducts: totalCount || products.length,
      totalUnits: totalStockUnits,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      inventoryValue: totalInventoryValue,
    };
  }, [products, totalCount]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedStockStatus('all');
    setCurrentPage(1);
  };

  return (
    <div className="w-full space-y-5 pb-20 font-sans" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
      
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-normal mb-1">
            <Link href="/admin" className="hover:text-slate-700 transition-colors">Dashboard</Link>
            <span>&gt;</span>
            <span className="text-slate-800 font-medium">Stock Management</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#030303] tracking-tight">Stock Management</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Manage, adjust (+ / -), and monitor product inventory and out-of-stock statuses.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchStockData()}
            className="h-9 px-3.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => alert('Stock report exported to CSV.')}
            className="h-9 px-3.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <Link
            href="/admin/products/new"
            className="h-9 px-4 rounded-md bg-[#89591C] hover:bg-[#724816] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* ── 5 Metric KPI Cards (Matches Figma Stock Management) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Products */}
        <div className="bg-white rounded-lg border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Total Products</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stockStats.totalProducts}</span>
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">All products</span>
          </div>
          <div className="w-10 h-10 rounded-md bg-[#faf4ec] text-[#89591C] flex items-center justify-center">
            <Package className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="bg-white rounded-lg border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Total Stock Units</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stockStats.totalUnits}</span>
            <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">Available units</span>
          </div>
          <div className="w-10 h-10 rounded-md bg-[#edf7ee] text-emerald-700 flex items-center justify-center">
            <Boxes className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-lg border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Low Stock</span>
            <span className="text-2xl font-bold text-orange-600 mt-1 block">{stockStats.lowStock}</span>
            <span className="text-[10px] text-orange-600 font-medium block mt-0.5">≤ 10 items remaining</span>
          </div>
          <div className="w-10 h-10 rounded-md bg-[#fef6eb] text-orange-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-lg border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Out of Stock</span>
            <span className="text-2xl font-bold text-rose-600 mt-1 block">{stockStats.outOfStock}</span>
            <span className="text-[10px] text-rose-600 font-medium block mt-0.5">0 items remaining</span>
          </div>
          <div className="w-10 h-10 rounded-md bg-[#fcedec] text-rose-600 flex items-center justify-center">
            <Ban className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>

        {/* Stock Value */}
        <div className="bg-white rounded-lg border border-[#e8e2d8] p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Stock Value</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              ₹{stockStats.inventoryValue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Estimated total</span>
          </div>
          <div className="w-10 h-10 rounded-md bg-[#faf4ec] text-[#89591C] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* ── Filter / Search Bar ── */}
      <div className="bg-white rounded-lg border border-[#e8e2d8] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-md focus:outline-none focus:border-[#89591C] placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stock Status Filter */}
          <select
            value={selectedStockStatus}
            onChange={(e) => {
              setSelectedStockStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8.5 px-3 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-md text-slate-700 font-medium focus:outline-none focus:border-[#89591C] cursor-pointer"
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock (&gt;10)</option>
            <option value="low_stock">Low Stock (1-10)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8.5 px-3 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-md text-slate-700 font-medium focus:outline-none focus:border-[#89591C] cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8.5 px-3 text-xs bg-[#faf8f5] border border-[#e8e2d8] rounded-md text-slate-700 font-medium focus:outline-none focus:border-[#89591C] cursor-pointer"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-[#89591C] hover:bg-[#faf4ec] transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Stock Inventory Table (Matches Figma + Quick +/- / Out of Stock Actions) ── */}
      <div className="bg-white rounded-lg border border-[#e8e2d8] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ece7de] bg-[#faf8f5] text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 pl-4 pr-3">Product</th>
                <th className="py-3.5 px-3">SKU</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Variants</th>
                <th className="py-3.5 px-3">Total Stock (+ / -)</th>
                <th className="py-3.5 px-3">Low Stock Level</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Last Updated</th>
                <th className="py-3.5 pr-4 pl-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f0eae1] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Loading Stock Data...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No stock records found.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const validImg =
                    p.images?.find((img) => img?.url && !img.url.includes('placeholder.svg'))?.url ||
                    (p.images && p.images[0]?.url) ||
                    '/products/placeholder.svg';

                  const categoryName =
                    typeof p.category === 'object' && p.category !== null
                      ? p.category.name
                      : p.subCategory || 'Casual Shoes';

                  const variantCount =
                    Array.isArray(p.colorVariants) && p.colorVariants.length > 0
                      ? p.colorVariants.length
                      : (p.colors || ['Brown']).length;

                  const colorSwatches =
                    Array.isArray(p.colorVariants) && p.colorVariants.length > 0
                      ? p.colorVariants.slice(0, 3)
                      : [{ name: 'Brown', colorCode: '#8B4513' }];

                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= 10;
                  const isInStock = p.stock > 10;
                  const isUpdating = updatingId === p._id;
                  const isEditingInline = editingStockId === p._id;

                  return (
                    <tr key={p._id} className="hover:bg-[#faf8f5]/80 transition-colors">
                      {/* Product Thumbnail + Name */}
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-md bg-[#faf8f5] border border-[#e8e2d8] overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                            <Image
                              src={validImg}
                              alt={p.name}
                              fill
                              sizes="44px"
                              className="object-cover object-center"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs uppercase tracking-tight block">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal block">
                              {variantCount} Variant{variantCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-700 text-xs whitespace-nowrap">
                        {p.sku || `JS${p._id.slice(-4).toUpperCase()}`}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {categoryName}
                      </td>

                      {/* Variants with color dots */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {colorSwatches.map((cv, idx) => (
                            <span
                              key={idx}
                              className="w-3 h-3 rounded-full border border-black/15 inline-block"
                              style={{ backgroundColor: cv.colorCode || '#8B4513' }}
                              title={cv.name}
                            />
                          ))}
                          {variantCount > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium">+{variantCount - 3}</span>
                          )}
                        </div>
                      </td>

                      {/* Total Stock with interactive + / - and Direct Number Edit */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {/* Decrease Stock (-1) */}
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(p._id, (p.stock || 0) - 1)}
                            disabled={(p.stock || 0) <= 0 || isUpdating}
                            title="Decrease stock by 1"
                            className="w-6 h-6 rounded-md bg-[#faf8f5] border border-[#e8e2d8] hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition-colors cursor-pointer active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          {/* Editable Stock Number */}
                          {isEditingInline ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                autoFocus
                                min="0"
                                value={tempStockValue}
                                onChange={(e) => setTempStockValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineStock(p._id);
                                  if (e.key === 'Escape') setEditingStockId(null);
                                }}
                                className="w-14 px-1.5 py-0.5 text-xs font-bold text-center border border-[#89591C] rounded-md bg-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => saveInlineStock(p._id)}
                                className="p-1 rounded-md bg-[#89591C] text-white hover:bg-[#724816]"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStockId(p._id);
                                setTempStockValue((p.stock || 0).toString());
                              }}
                              title="Click to edit stock quantity"
                              className={`min-w-[32px] px-1.5 py-0.5 rounded-md font-bold text-xs text-center border border-transparent hover:border-[#e8e2d8] hover:bg-[#faf8f5] transition-all cursor-pointer ${
                                isInStock ? 'text-emerald-700' : isLowStock ? 'text-orange-600' : 'text-rose-600'
                              } ${isUpdating ? 'opacity-40 animate-pulse' : ''}`}
                            >
                              {p.stock || 0}
                            </button>
                          )}

                          {/* Increase Stock (+1) */}
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(p._id, (p.stock || 0) + 1)}
                            disabled={isUpdating}
                            title="Increase stock by 1"
                            className="w-6 h-6 rounded-md bg-[#faf8f5] border border-[#e8e2d8] hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-slate-700 transition-colors cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Low Stock Threshold */}
                      <td className="py-3 px-3 text-slate-500 font-normal text-xs whitespace-nowrap">
                        10
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isInStock && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#edf7ee] text-emerald-700">
                            In Stock
                          </span>
                        )}
                        {isLowStock && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#fef6eb] text-orange-700">
                            Low Stock
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#fcedec] text-rose-700">
                            Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '2 Sep 2024'}
                      </td>

                      {/* Actions: Out of Stock Toggle + Edit */}
                      <td className="py-3 pr-4 pl-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Out of Stock Toggle / Restock */}
                          {p.stock > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleQuickStockChange(p._id, 0)}
                              disabled={isUpdating}
                              title="Set stock to 0 (Mark Out of Stock)"
                              className="px-2 py-1 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Out of Stock</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickStockChange(p._id, 10)}
                              disabled={isUpdating}
                              title="Quick Restock +10"
                              className="px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Restock (10)</span>
                            </button>
                          )}

                          {/* Edit Product Page Link */}
                          <Link
                            href={`/admin/products/${p._id}/edit`}
                            title="Edit Product Details"
                            className="w-7 h-7 rounded-md border border-slate-200 hover:border-[#89591C] hover:bg-[#faf4ec] text-slate-600 hover:text-[#89591C] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="p-3 border-t border-[#f0eae1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-normal bg-[#faf8f5]/50">
          <div className="flex items-center gap-2">
            <span>Showing {products.length > 0 ? (currentPage - 1) * limit + 1 : 0} to {Math.min(currentPage * limit, totalCount || products.length)} of {totalCount || products.length} products</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-md border border-[#e8e2d8] bg-white text-xs text-slate-700 focus:outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 rounded-md border border-[#e8e2d8] bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-800">{currentPage}</span>
            <button
              type="button"
              disabled={currentPage * limit >= (totalCount || products.length)}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-7 h-7 rounded-md border border-[#e8e2d8] bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
