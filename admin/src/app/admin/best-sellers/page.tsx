'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import Image from 'next/image';
import { Award, Star } from 'lucide-react';

interface BestSellerProduct {
  _id: string;
  name: string;
  sku: string;
  targetAudience: string;
  price: number;
  isBestSeller: boolean;
  images: Array<{ url: string; alt: string }>;
}

export default function BestSellersPage() {
  const [products, setProducts] = useState<BestSellerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=50');
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleBestSeller = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBestSeller: !currentStatus }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? { ...p, isBestSeller: !currentStatus } : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle best seller:', err);
    }
  };

  const columns: Column<BestSellerProduct>[] = [
    {
      header: 'Product',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#faf8f5] overflow-hidden relative border border-[#e8e2d8] flex-shrink-0">
            {row.images && row.images[0]?.url ? (
              <Image src={row.images[0].url} alt={row.name} fill sizes="40px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 font-normal">No photo</div>
            )}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs">{row.name}</span>
            <div className="text-[10px] text-slate-500 font-normal">SKU: {row.sku} • {row.targetAudience}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Price',
      accessor: (row) => <span className="font-bold text-slate-900 text-xs">${row.price.toFixed(2)}</span>,
    },
    {
      header: 'Best Seller Status',
      accessor: (row) => (
        <button
          type="button"
          onClick={() => toggleBestSeller(row._id, row.isBestSeller)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 border ${
            row.isBestSeller
              ? 'bg-[#89591C] text-white border-[#89591C] shadow-xs'
              : 'bg-white text-slate-600 border-[#e8e2d8] hover:text-[#89591C]'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${row.isBestSeller ? 'fill-white text-white' : 'text-slate-400'}`} />
          {row.isBestSeller ? 'Best Seller Pinned' : 'Normal Catalog'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4 font-light">
      <div className="flex items-center justify-between gap-4 border-b border-[#e8e2d8] pb-3">
        <p className="text-xs text-slate-500 font-normal">Pin top performing shoes for homepage featured highlights</p>
        <div className="bg-[#faf4ec] text-[#89591C] border border-[#e8e2d8] px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" /> Top Tier Curator
        </div>
      </div>

      <DataTable columns={columns} data={products} loading={loading} />
    </div>
  );
}
