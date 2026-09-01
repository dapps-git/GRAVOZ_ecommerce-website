'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/admin/Modal';
import {
  UserCheck,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Smartphone,
  Mail,
  Calendar,
  Clock,
  Shield,
  Filter,
} from 'lucide-react';

interface ActivityLog {
  action: string;
  details?: string;
  timestamp: string;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  authProvider?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  activityLogs?: ActivityLog[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [authFilter, setAuthFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.customers)) {
        let filtered = data.customers;
        if (authFilter) {
          filtered = filtered.filter((u: any) => u.authProvider === authFilter);
        }
        setUsers(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, statusFilter, authFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setIsCreateOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
        );
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete user account "${name}"?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  // Quick stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive !== false).length;
  const googleUsers = users.filter((u) => u.authProvider === 'google').length;
  const emailUsers = users.filter((u) => u.authProvider !== 'google').length;

  return (
    <div className="space-y-5 font-sansation">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e2d8] pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#89591C]" /> Registered Users
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            All registered login accounts, authentication methods, last login timestamps, and account status
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="h-10 px-4 rounded-xl bg-[#89591C] hover:bg-[#724a17] text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add User Account
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-[#e8e2d8] shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Registered Users</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalUsers}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#e8e2d8] shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Active Accounts</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{activeUsers}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#e8e2d8] shadow-2xs">
          <span className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider block">Google OAuth Logins</span>
          <span className="text-2xl font-bold text-sky-700 mt-1 block">{googleUsers}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#e8e2d8] shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Email & Password Users</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{emailUsers}</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="flex-1 w-full flex items-center gap-2 bg-white border border-[#e8e2d8] rounded-xl px-3 py-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by user name, email, or mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 bg-transparent focus:outline-none placeholder-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-xl bg-white border border-[#e8e2d8] text-xs font-semibold text-slate-700 shadow-2xs"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Accounts</option>
          <option value="inactive">Deactivated Accounts</option>
        </select>

        <select
          value={authFilter}
          onChange={(e) => setAuthFilter(e.target.value)}
          className="h-10 px-3 rounded-xl bg-white border border-[#e8e2d8] text-xs font-semibold text-slate-700 shadow-2xs"
        >
          <option value="">All Auth Methods</option>
          <option value="google">Google Login</option>
          <option value="local">Email / Password</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#e8e2d8] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8f5] border-b border-[#e8e2d8] text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Auth Method</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eae1] text-xs text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading registered users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No registered users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-[#faf8f5]/80 transition-colors">
                    {/* Name & Initials */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-2xs flex-shrink-0">
                          {u.name ? u.name.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{u.name}</span>
                          <span className="text-[10px] text-slate-400">User ID: {u._id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone ? (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No phone provided</span>
                      )}
                    </td>

                    {/* Auth Method */}
                    <td className="py-3 px-4">
                      {u.authProvider === 'google' ? (
                        <span className="px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold rounded-md">
                          Google Login
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-md">
                          Email & Password
                        </span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-4 text-slate-600">
                      {u.lastLogin ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(u.lastLogin).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Never</span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          u.isActive !== false
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        {u.isActive !== false ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Deactivated
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-[#faf8f5] hover:text-[#89591C] transition-colors"
                          title="View User Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Registered User">
        <form onSubmit={handleCreateUser} className="space-y-3 font-sansation">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="john@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (Optional)</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#89591C]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#89591C] hover:bg-[#724a17] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer mt-2"
          >
            {submitting ? 'Creating User...' : 'Create Account'}
          </button>
        </form>
      </Modal>

      {/* Modal: View User Details */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`User Profile: ${selectedUser.name}`}
        >
          <div className="space-y-4 font-sansation text-xs text-slate-800">
            {/* Summary */}
            <div className="p-3.5 bg-[#faf8f5] rounded-xl border border-[#e8e2d8] grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Email</span>
                <span className="font-bold text-slate-900">{selectedUser.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mobile</span>
                <span className="font-bold text-slate-900">{selectedUser.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Auth Type</span>
                <span className="font-semibold">{selectedUser.authProvider === 'google' ? 'Google OAuth' : 'Email/Password'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Joined Date</span>
                <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Activity History */}
            <div>
              <span className="font-bold text-slate-900 block mb-2">Account Activity Logs:</span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[#e8e2d8] rounded-xl p-2.5 bg-[#faf8f5]">
                {selectedUser.activityLogs && selectedUser.activityLogs.length > 0 ? (
                  selectedUser.activityLogs.map((act, i) => (
                    <div key={i} className="flex items-start justify-between text-[11px] py-1 border-b border-[#f0eae1] last:border-none">
                      <div>
                        <span className="font-semibold text-slate-800">{act.action}</span>
                        {act.details && <span className="text-slate-500 block">{act.details}</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(act.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic">No activity recorded.</span>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
