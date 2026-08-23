'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { Star, Plus, CheckCircle, XCircle } from 'lucide-react';

interface TestimonialItem {
  _id: string;
  customerName: string;
  roleOrLocation: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [roleOrLocation, setRoleOrLocation] = useState('Verified Buyer');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/testimonials');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTestimonials(data);
      }
    } catch (err) {
      console.error('Failed to fetch testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const toggleApproval = async (id: string, current: boolean) => {
    try {
      const res = await fetch('/api/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved: !current }),
      });

      if (res.ok) {
        setTestimonials((prev) =>
          prev.map((t) => (t._id === id ? { ...t, isApproved: !current } : t))
        );
      }
    } catch (err) {
      console.error('Failed to toggle approval:', err);
    }
  };

  const handleCreateTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          roleOrLocation,
          rating: Number(rating),
          comment,
          isApproved: true,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setCustomerName('');
        setComment('');
        fetchTestimonials();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<TestimonialItem>[] = [
    {
      header: 'Customer',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">{row.customerName}</span>
          <div className="text-[10px] text-slate-500 font-normal">{row.roleOrLocation}</div>
        </div>
      ),
    },
    {
      header: 'Rating',
      accessor: (row) => (
        <div className="flex items-center gap-1 text-[#89591C]">
          {Array.from({ length: row.rating }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-[#89591C]" />
          ))}
        </div>
      ),
    },
    {
      header: 'Review Comment',
      accessor: (row) => <p className="text-xs text-slate-700 italic max-w-sm font-normal">"{row.comment}"</p>,
    },
    {
      header: 'Homepage Display',
      accessor: (row) => (
        <button
          type="button"
          onClick={() => toggleApproval(row._id, row.isApproved)}
          className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all flex items-center gap-1 border ${
            row.isApproved
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {row.isApproved ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {row.isApproved ? 'Approved & Visible' : 'Hidden from Site'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4 font-light">
      <div className="flex items-center justify-between gap-4 border-b border-[#e8e2d8] pb-3">
        <p className="text-xs text-slate-500 font-normal">Moderate customer ratings and review highlights</p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      <DataTable columns={columns} data={testimonials} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Customer Testimonial">
        <form onSubmit={handleCreateTestimonial} className="space-y-3 font-light">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Customer Name</label>
            <input
              type="text"
              required
              placeholder="e.g. David Miller"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Location / Role</label>
            <input
              type="text"
              placeholder="e.g. Verified Runner"
              value={roleOrLocation}
              onChange={(e) => setRoleOrLocation(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Star Rating (1 to 5)</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            >
              <option value="5">5 Stars (Excellent)</option>
              <option value="4">4 Stars (Very Good)</option>
              <option value="3">3 Stars (Average)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Testimonial Comment</label>
            <textarea
              rows={3}
              required
              placeholder="GRAVOZ shoes are extremely comfortable and stylish!"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#89591C] hover:bg-[#724816] text-white font-bold text-xs rounded-md shadow-xs"
          >
            {submitting ? 'Saving...' : 'Add Testimonial'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
