'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { Users, Award, Share2, Plus } from 'lucide-react';

interface CustomerItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  rewardPoints: number;
  referralCode: string;
  referredBy?: string;
  totalOrders: number;
  totalSpent: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referredBy, setReferredBy] = useState('');

  const [pointsInput, setPointsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, referredBy }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePoints = async (id: string, newPoints: number) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rewardPoints: newPoints }),
      });
      if (res.ok) {
        setSelectedCustomer(null);
        fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<CustomerItem>[] = [
    {
      header: 'Customer',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#89591C] text-white font-bold text-xs flex items-center justify-center border border-amber-600/20">
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs">{row.name}</span>
            <div className="text-[10px] text-slate-500 font-normal">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Referral Code',
      accessor: (row) => (
        <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#89591C]">
          <Share2 className="w-3.5 h-3.5" />
          <span>{row.referralCode}</span>
        </div>
      ),
    },
    {
      header: 'Reward Points',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-[#89591C] text-xs">{row.rewardPoints} Pts</span>
          <button
            type="button"
            onClick={() => {
              setSelectedCustomer(row);
              setPointsInput(row.rewardPoints.toString());
            }}
            className="text-[10px] font-semibold text-slate-600 hover:text-[#89591C] underline"
          >
            Adjust
          </button>
        </div>
      ),
    },
    {
      header: 'Tier Level',
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${
          row.tier === 'Platinum' ? 'bg-purple-50 text-purple-700 border-purple-200' :
          row.tier === 'Gold' ? 'bg-amber-50 text-amber-800 border-amber-200' :
          'bg-slate-100 text-slate-700 border-slate-200'
        }`}>
          {row.tier}
        </span>
      ),
    },
    {
      header: 'Lifetime Spend',
      accessor: (row) => <span className="font-bold text-slate-900 text-xs">${row.totalSpent.toFixed(2)}</span>,
    },
  ];

  return (
    <div className="space-y-4 font-light">
      <div className="flex items-center justify-between gap-4 border-b border-[#e8e2d8] pb-3">
        <p className="text-xs text-slate-500 font-normal">Customer account profiles, unique referral links, and loyalty reward points</p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <DataTable columns={columns} data={customers} loading={loading} />

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Customer Account">
        <form onSubmit={handleCreateCustomer} className="space-y-3 font-light">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Jenkins"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="sarah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Referred By (Optional Code)</label>
            <input
              type="text"
              placeholder="GRAV-X92A1"
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#89591C] hover:bg-[#724816] text-white font-bold text-xs rounded-md shadow-xs"
          >
            {submitting ? 'Registering...' : 'Save Customer'}
          </button>
        </form>
      </Modal>

      {/* Adjust Points Modal */}
      {selectedCustomer && (
        <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title={`Adjust Reward Points (${selectedCustomer.name})`}>
          <div className="space-y-3 font-light">
            <p className="text-xs text-slate-600">Enter new total reward points balance:</p>
            <input
              type="number"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
            <button
              type="button"
              onClick={() => handleUpdatePoints(selectedCustomer._id, Number(pointsInput))}
              className="w-full py-2 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-md"
            >
              Update Reward Points
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
