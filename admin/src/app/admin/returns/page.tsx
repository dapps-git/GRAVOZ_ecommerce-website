'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface ReturnItem {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  refundAmount: number;
  status: string;
  createdAt: string;
}

export default function ReturnsPage() {
  const [returnsList, setReturnsList] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/returns');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setReturnsList(data);
      }
    } catch (err) {
      console.error('Failed to fetch return requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleUpdateReturnStatus = async (returnId: string, status: string) => {
    setUpdatingId(returnId);
    try {
      const res = await fetch('/api/returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnId, status }),
      });

      if (res.ok) {
        fetchReturns();
      }
    } catch (err) {
      console.error('Failed to update return status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<ReturnItem>[] = [
    {
      header: 'Order Reference',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">{row.orderNumber}</span>
          <div className="text-[10px] text-slate-400 font-normal">{new Date(row.createdAt).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.customerName}</div>
          <div className="text-[10px] text-slate-500 font-normal">{row.customerEmail}</div>
        </div>
      ),
    },
    {
      header: 'Reason for Return',
      accessor: (row) => <span className="text-xs text-slate-600 italic font-normal">"{row.reason}"</span>,
    },
    {
      header: 'Refund Amount',
      accessor: (row) => <span className="font-extrabold text-[#89591C] text-xs">${row.refundAmount.toFixed(2)}</span>,
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row) => {
        const isUpdating = updatingId === row._id;
        return (
          <div className="flex items-center gap-1.5">
            {row.status === 'requested' && (
              <>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateReturnStatus(row._id, 'approved')}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200 flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateReturnStatus(row._id, 'rejected')}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-md border border-rose-200 flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </>
            )}

            {row.status === 'approved' && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdateReturnStatus(row._id, 'processed')}
                className="px-3 py-1 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-md shadow-xs"
              >
                Process Refund Now
              </button>
            )}

            {row.status === 'processed' && (
              <span className="text-[10px] text-slate-500 font-semibold">Refund Issued</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 font-light">
      <div className="flex items-center justify-between gap-4 border-b border-[#e8e2d8] pb-3">
        <p className="text-xs text-slate-500 font-normal">Process customer shoe return claims and automated refund triggers</p>
        <div className="bg-[#faf4ec] text-[#89591C] border border-[#e8e2d8] px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Returns Control
        </div>
      </div>

      <DataTable columns={columns} data={returnsList} loading={loading} />
    </div>
  );
}
