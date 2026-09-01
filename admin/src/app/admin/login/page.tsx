'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        body: JSON.stringify({ email: email.trim(), password }),
      });

      let data: { error?: string; success?: boolean } = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // Server returned HTML (not found / compile error) — restart needed
        throw new Error(`Server error (${res.status}). Please restart the admin server.`);
      }

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
    <div className="min-h-screen w-full bg-[#faf8f5] flex items-center justify-center p-4 sm:p-6 md:p-8 font-light relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#89591C]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#89591C]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Split Container */}
      <div className="w-full max-w-5xl bg-white rounded-2xl border border-[#e8e2d8] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Side: 3D Admin Banner */}
        <div className="lg:col-span-6 relative min-h-[340px] sm:min-h-[420px] lg:min-h-[600px] bg-white flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-[#e8e2d8]">
          <Image
            src="/images/admin-login-banner.jpg"
            alt="GRAVOZ Admin Banner"
            fill
            priority
            unoptimized
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </div>

        {/* Right Side: Clean Login Form */}
        <div className="lg:col-span-6 p-8 sm:p-12 md:p-14 flex flex-col justify-center bg-white relative">
          <div className="w-full max-w-sm mx-auto space-y-7">
            
            {/* Centered GRAVOZ Logo */}
            <div className="flex justify-center pb-2">
              <Image
                src="/gravoz-logo.png"
                alt="GRAVOZ Official Logo"
                width={200}
                height={50}
                priority
                className="h-11 w-auto object-contain"
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-lg flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#89591C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="gravoxshopadmin@gmail.com"
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg pl-10 pr-4 py-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#89591C] focus:bg-white focus:ring-1 focus:ring-[#89591C] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
                    className="w-full bg-[#faf8f5] border border-[#e8e2d8] rounded-lg pl-10 pr-4 py-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#89591C] focus:bg-white focus:ring-1 focus:ring-[#89591C] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#89591C] hover:bg-[#724816] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer pt-3"
              >
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}
