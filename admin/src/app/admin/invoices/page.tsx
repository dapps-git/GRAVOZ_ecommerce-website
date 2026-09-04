'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import Link from 'next/link';
import { FileText, Printer } from 'lucide-react';

interface InvoiceOrder {
  _id: string;
  orderNumber: string;
  customer: { name: string; email: string };
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders?limit=30')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setInvoices(data.orders);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<InvoiceOrder>[] = [
    {
      header: 'Invoice #',
      accessor: (row: InvoiceOrder) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#faf4ec] text-[#89591C] border border-[#e8e2d8]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs">INV-{row.orderNumber}</span>
            <div className="text-[10px] text-slate-400 font-normal">{new Date(row.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Billed To',
      accessor: (row: InvoiceOrder) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.customer?.name}</div>
          <div className="text-[10px] text-slate-500 font-normal">{row.customer?.email}</div>
        </div>
      ),
    },
    {
      header: 'Total Amount',
      accessor: (row: InvoiceOrder) => <span className="font-extrabold text-slate-900 text-xs">₹{(row.totalAmount || 0).toLocaleString('en-IN')}</span>,
    },
    {
      header: 'Payment Status',
      accessor: (row: InvoiceOrder) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      header: 'Actions',
      accessor: (row: InvoiceOrder) => (
        <Link
          href={`/admin/invoices/${row._id}`}
          className="px-3 py-1 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-md flex items-center gap-1.5 shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" /> View / Print PDF
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4 font-light">
      <div className="border-b border-[#e8e2d8] pb-3">
        <p className="text-xs text-slate-500 font-normal">Generate, view, and print official GRAVOZ store invoices</p>
      </div>

      <DataTable columns={columns} data={invoices} loading={loading} />
    </div>
  );
}
