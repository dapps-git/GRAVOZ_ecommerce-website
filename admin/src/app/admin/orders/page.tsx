'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import Link from 'next/link';
import { Eye, FileText, ShoppingCart } from 'lucide-react';

interface OrderItem {
  _id: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  customer?: { name?: string; email?: string; phone?: string };
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        setTotalCount(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns: Column<OrderItem>[] = [
    {
      header: 'Order Reference',
      accessor: (row: OrderItem) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#faf4ec] text-[#89591C] border border-[#e8e2d8]">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <Link href={`/admin/orders/${row._id}`} className="font-bold text-[#89591C] text-xs hover:underline">
              {row.orderNumber}
            </Link>
            <div className="text-[10px] text-slate-400 font-normal">{new Date(row.createdAt).toLocaleDateString('en-IN')}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer Details',
      accessor: (row: OrderItem) => {
        const name = row.customerName || row.customer?.name || 'Customer';
        const email = row.customerEmail || row.customer?.email || '';
        return (
          <div>
            <div className="font-bold text-slate-900 text-xs">{name}</div>
            <div className="text-[10px] text-slate-500 font-normal">{email}</div>
          </div>
        );
      },
    },
    {
      header: 'Total Amount',
      accessor: (row: OrderItem) => <span className="font-extrabold text-slate-900 text-xs">₹{(row.totalAmount || 0).toLocaleString('en-IN')}</span>,
    },
    {
      header: 'Payment Status',
      accessor: (row: OrderItem) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      header: 'Fulfillment Status',
      accessor: (row: OrderItem) => <StatusBadge status={row.orderStatus} />,
    },
    {
      header: 'Actions',
      accessor: (row: OrderItem) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/admin/orders/${row._id}`}
            className="px-2.5 py-1 bg-[#faf8f5] hover:bg-[#faf4ec] text-xs font-semibold text-slate-700 rounded-md flex items-center gap-1 border border-[#e8e2d8]"
          >
            <Eye className="w-3.5 h-3.5" /> Details
          </Link>
          <Link
            href={`/admin/invoices/${row._id}`}
            className="px-2.5 py-1 bg-[#89591C] hover:bg-[#724816] text-xs font-semibold text-white rounded-md flex items-center gap-1 shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" /> Invoice
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 font-light">
      {/* Filter Tabs Header */}
      <div className="flex items-center gap-1.5 border-b border-[#e8e2d8] pb-3 overflow-x-auto">
        {['all', 'ordered', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setStatusFilter(tab);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
              statusFilter === tab
                ? 'bg-[#89591C] text-white shadow-xs font-semibold'
                : 'bg-white text-slate-600 hover:text-[#89591C] border border-[#e8e2d8]'
            }`}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={orders}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p: number) => setCurrentPage(p)}
        onSearch={(term: string) => {
          setSearch(term);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search order number or customer email..."
        loading={loading}
      />
    </div>
  );
}
