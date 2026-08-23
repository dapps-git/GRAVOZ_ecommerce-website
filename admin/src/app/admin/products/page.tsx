'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Plus, Edit, Trash2, Star } from 'lucide-react';

interface ProductItem {
  _id: string;
  name: string;
  sku: string;
  targetAudience: 'Men' | 'Women' | 'Babies';
  subCategory: string;
  price: number;
  discountPrice?: number;
  stock: number;
  isBestSeller: boolean;
  images: Array<{ url: string; alt: string }>;
  status: string;
  category?: { name: string };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [targetAudience, setTargetAudience] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (targetAudience !== 'all') params.append('targetAudience', targetAudience);
      if (search) params.append('search', search);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setTotalCount(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, targetAudience, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shoe product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const columns: Column<ProductItem>[] = [
    {
      header: 'Product',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#faf8f5] overflow-hidden relative border border-[#e8e2d8] flex-shrink-0">
            {row.images && row.images[0]?.url ? (
              <Image
                src={row.images[0].url}
                alt={row.images[0].alt || row.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Image</div>
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              {row.name}
              {row.isBestSeller && (
                <span className="bg-[#89591C]/15 text-[#89591C] text-[10px] px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5 border border-[#89591C]/30">
                  <Star className="w-3 h-3 fill-[#89591C]" /> Best Seller
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-normal">SKU: {row.sku} • {row.subCategory}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Audience Group',
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold border ${
          row.targetAudience === 'Men' ? 'bg-[#faf4ec] text-[#89591C] border-[#e8e2d8]' :
          row.targetAudience === 'Women' ? 'bg-pink-50 text-pink-700 border-pink-200' :
          'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {row.targetAudience}
        </span>
      ),
    },
    {
      header: 'Price',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">${row.price.toFixed(2)}</span>
          {row.discountPrice && row.discountPrice > 0 && (
            <span className="text-[10px] text-rose-600 line-through ml-1.5">${row.discountPrice.toFixed(2)}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Stock',
      accessor: (row) => (
        <span className={`font-bold text-xs ${row.stock <= 5 ? 'text-rose-600 font-extrabold' : 'text-slate-800'}`}>
          {row.stock} pairs
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/admin/products/${row._id}/edit`}
            className="p-1 rounded-md bg-[#faf8f5] text-slate-700 hover:text-[#89591C] hover:bg-[#faf4ec] border border-[#e8e2d8] transition-colors"
            title="Edit product"
          >
            <Edit className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(row._id)}
            className="p-1 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
            title="Delete product"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 font-light">
      {/* Action Header without duplicate page title */}
      <div className="flex items-center justify-between gap-4 border-b border-[#e8e2d8] pb-3">
        {/* Target Audience Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'Men', 'Women', 'Babies'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setTargetAudience(tab);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                targetAudience === tab
                  ? 'bg-[#89591C] text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-700 hover:text-[#89591C] border border-[#e8e2d8]'
              }`}
            >
              {tab === 'all' ? 'All Catalog' : `${tab}'s Shoes`}
            </button>
          ))}
        </div>

        <Link
          href="/admin/products/new"
          className="px-3.5 py-1.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5 transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Shoe Product
        </Link>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={products}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => setCurrentPage(p)}
        onSearch={(term) => {
          setSearch(term);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search product by name, subcategory, or SKU..."
        loading={loading}
      />
    </div>
  );
}
