'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('admin@gravoz.com');
  const [password, setPassword] = useState('admin123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#faf8f5] flex items-center justify-center p-4 font-light">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#89591C]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-md p-8 border border-[#e8e2d8] shadow-xl relative z-10 space-y-6">
        {/* Official GRAVOZ Logo Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Image
              src="/gravoz-logo.png"
              alt="GRAVOZ Official Logo"
              width={180}
              height={45}
              priority
              className="h-10 w-auto object-contain"
            />
          </div>
          <p className="text-xs text-[#89591C] font-semibold tracking-wide">
            Shoe eCommerce Management Suite (Men, Women, Babies)
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-md flex items-center justify-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#89591C] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gravoz.com"
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md pl-10 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#89591C] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#89591C] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-md pl-10 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#89591C] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Admin Dashboard'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#e8e2d8] text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-normal">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Protected by HttpOnly JWT & Password Hash
          </p>
        </div>
      </div>
    </div>
  );
}
