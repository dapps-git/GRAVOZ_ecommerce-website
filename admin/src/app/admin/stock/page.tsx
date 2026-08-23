'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Boxes, Plus, Minus } from 'lucide-react';

interface StockProduct {
  _id: string;
  name: string;
  sku: string;
  targetAudience: string;
  subCategory: string;
  price: number;
  stock: number;
}

export default function StockPage() {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=50&sort=stock-low');
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const handleStockAdjustment = async (productId: string, stockChange: number) => {
    setUpdatingId(productId);
    try {
      const res = await fetch('/api/stock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, stockChange }),
      });

      const data = await res.json();
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p._id === productId ? { ...p, stock: data.stock } : p))
        );
      }
    } catch (err) {
      console.error('Stock update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<StockProduct>[] = [
    {
      header: 'Shoe Model',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">{row.name}</span>
          <div className="text-[10px] text-slate-500 font-normal">
            SKU: {row.sku} • {row.targetAudience} ({row.subCategory})
          </div>
        </div>
      ),
    },
    {
      header: 'Unit Price',
      accessor: (row) => <span className="font-semibold text-slate-800 text-xs">${row.price.toFixed(2)}</span>,
    },
    {
      header: 'Current Stock Level',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-sm border ${
            row.stock <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' :
            row.stock <= 5 ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {row.stock} Pairs
          </span>
          <StatusBadge status={row.stock <= 0 ? 'out of stock' : row.stock <= 5 ? 'low stock' : 'in stock'} />
        </div>
      ),
    },
    {
      header: 'Quick Stock Adjustment (Atomic $inc)',
      accessor: (row) => {
        const isUpdating = updatingId === row._id;
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isUpdating || row.stock <= 0}
              onClick={() => handleStockAdjustment(row._id, -5)}
              className="px-2 py-1 bg-[#faf8f5] hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-md border border-[#e8e2d8] disabled:opacity-40"
            >
              -5
            </button>
            <button
              type="button"
              disabled={isUpdating || row.stock <= 0}
              onClick={() => handleStockAdjustment(row._id, -1)}
              className="p-1 bg-[#faf8f5] hover:bg-rose-50 text-rose-600 rounded-md border border-[#e8e2d8] disabled:opacity-40"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleStockAdjustment(row._id, 1)}
              className="p-1 bg-[#faf8f5] hover:bg-emerald-50 text-emerald-600 rounded-md border border-[#e8e2d8] disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleStockAdjustment(row._id, 10)}
              className="px-2 py-1 bg-[#faf8f5] hover:bg-emerald-50 text-emerald-600 text-xs font-bold rounded-md border border-[#e8e2d8] disabled:opacity-40"
            >
              +10
            </button>

            {isUpdating && <span className="text-[10px] text-[#89591C] animate-pulse font-medium">Updating...</span>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 font-light">
      <div className="flex items-center justify-between gap-4 border-b border-[#e8e2d8] pb-3">
        <p className="text-xs text-slate-500 font-normal">Atomic inventory updates using MongoDB $inc operators</p>
        <div className="bg-[#faf4ec] px-3 py-1 rounded-md border border-[#e8e2d8] text-xs font-semibold text-[#89591C] flex items-center gap-1.5">
          <Boxes className="w-3.5 h-3.5" /> Atomic Transactions Enabled
        </div>
      </div>

      <DataTable columns={columns} data={products} loading={loading} />
    </div>
  );
}
