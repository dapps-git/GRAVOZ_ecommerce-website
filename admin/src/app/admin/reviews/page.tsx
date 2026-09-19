'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { Star, Plus, Trash2, CheckCircle, Clock, XCircle, ShoppingBag } from 'lucide-react';

interface ReviewProduct {
  _id: string;
  name: string;
  sku: string;
  primaryImage?: string;
  thumbnail?: string;
}

interface ReviewItem {
  _id: string;
  product: ReviewProduct;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface ProductOption {
  _id: string;
  name: string;
  sku: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProductId, setFilterProductId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'approved' | 'pending'>('approved');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=200');
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to fetch products for reviews:', err);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const url = filterProductId ? `/api/reviews?productId=${filterProductId}` : '/api/reviews';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setReviews(data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [filterProductId]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: newStatus as any } : r))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer review?')) return;
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Please select a product');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          customerName,
          customerEmail,
          rating: Number(rating),
          comment,
          status,
          isVerifiedPurchase: true,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setCustomerName('');
        setCustomerEmail('');
        setComment('');
        setSelectedProductId('');
        fetchReviews();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add review');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating review');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<ReviewItem>[] = [
    {
      header: 'Product',
      accessor: (row) => (
        <div className="flex items-center gap-2.5 max-w-xs">
          <div className="w-8 h-8 rounded-md bg-[#faf8f5] border border-[#e8e2d8] flex items-center justify-center flex-shrink-0 text-slate-400">
            <ShoppingBag className="w-4 h-4 text-[#89591C]" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-xs truncate">
              {row.product?.name || 'Unknown Product'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">{row.product?.sku || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{row.customerName}</span>
          <span className="text-[11px] text-slate-500">{row.customerEmail}</span>
        </div>
      ),
    },
    {
      header: 'Rating',
      accessor: (row) => (
        <div className="flex items-center gap-1 text-[#89591C]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < row.rating ? 'fill-[#89591C] text-[#89591C]' : 'text-slate-200'
              }`}
            />
          ))}
          <span className="text-xs font-bold text-slate-700 ml-1">({row.rating}/5)</span>
        </div>
      ),
    },
    {
      header: 'Feedback / Comment',
      accessor: (row) => (
        <p className="text-xs text-slate-700 italic max-w-xs font-normal line-clamp-2">
          &ldquo;{row.comment || 'No comment provided'}&rdquo;
        </p>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row._id, e.target.value)}
          className={`px-2 py-1 rounded text-xs font-semibold border cursor-pointer ${
            row.status === 'approved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : row.status === 'pending'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      ),
    },
    {
      header: 'Date',
      accessor: (row) => (
        <span className="text-[11px] text-slate-500">
          {new Date(row.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: (row) => (
        <button
          type="button"
          onClick={() => handleDeleteReview(row._id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
          title="Delete Review"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4 font-light">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e2d8] pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Product Reviews Management</h1>
          <p className="text-xs text-slate-500 font-normal">
            Moderate, approve, and dynamically add real customer reviews for all products
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Product Filter */}
          <select
            value={filterProductId}
            onChange={(e) => setFilterProductId(e.target.value)}
            className="bg-white border border-[#e8e2d8] rounded-md px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#89591C]"
          >
            <option value="">All Products ({reviews.length})</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Review
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={reviews} loading={loading} />

      {/* Add Review Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Product Review">
        <form onSubmit={handleCreateReview} className="space-y-3 font-light">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Product *</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            >
              <option value="">-- Choose a Product --</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Customer Email *</label>
              <input
                type="email"
                required
                placeholder="e.g. rahul@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Star Rating (1 to 5) *</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              >
                <option value="5">5 Stars (Excellent)</option>
                <option value="4">4 Stars (Very Good)</option>
                <option value="3">3 Stars (Average)</option>
                <option value="2">2 Stars (Below Average)</option>
                <option value="1">1 Star (Poor)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
              >
                <option value="approved">Approved (Visible immediately)</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Review Comment / Feedback *</label>
            <textarea
              rows={3}
              required
              placeholder="The shoes are extremely comfortable and the craftsmanship is top-notch."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#89591C] hover:bg-[#724816] text-white font-bold text-xs rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Saving Review...' : 'Add Review'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
