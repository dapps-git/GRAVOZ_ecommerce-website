'use client';

import '@/app/globals.css';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If on login page, render clean full-screen layout without admin sidebar/header
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-[#faf8f5] text-slate-800 font-sans">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header adminName="Super Admin" adminEmail="admin@gravoz.com" />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
