'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Clock } from 'lucide-react';

interface HeaderProps {
  adminName?: string;
  adminEmail?: string;
  title?: string;
}

const routeTitleMap: Record<string, string> = {
  '/admin/dashboard': 'Executive Dashboard',
  '/admin/products': 'Shoe Product Catalog',
  '/admin/products/new': 'Add New Shoe Listing',
  '/admin/categories': 'Category Management',
  '/admin/brands': 'Brand Portfolio Management',
  '/admin/customers': 'Customer & Referral Profiles',
  '/admin/stock': 'Stock & Inventory Control',
  '/admin/best-sellers': 'Best Sellers Curator',
  '/admin/orders': 'Order Management',
  '/admin/returns': 'Return & Refund Requests',
  '/admin/invoices': 'Invoice Management',
  '/admin/testimonials': 'Customer Testimonials',
  '/admin/payments': 'Payment Logs',
  '/admin/settings': 'Store Configuration',
};

export default function Header({ adminName = 'Admin', adminEmail = 'admin@gravoz.com' }: HeaderProps) {
  const pathname = usePathname();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (routeTitleMap[pathname]) return routeTitleMap[pathname];
    if (pathname.startsWith('/admin/products/') && pathname.endsWith('/edit')) return 'Edit Shoe Listing';
    if (pathname.startsWith('/admin/orders/')) return 'Order Details';
    if (pathname.startsWith('/admin/invoices/')) return 'Invoice Details';
    return 'Admin Suite';
  };

  return (
    <header className="h-14 bg-white border-b border-[#e8e2d8] px-4 flex items-center justify-between sticky top-0 z-20 font-light">
      {/* Dynamic Page Heading in Left Navbar */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Live Real-Time Clock & Date Widget on Right Navbar */}
      <div className="flex items-center gap-2 bg-[#faf8f5] px-3 py-1.5 rounded-md border border-[#e8e2d8]">
        <Clock className="w-4 h-4 text-[#89591C]" />
        <div className="text-right">
          <span className="text-xs font-bold text-slate-900 leading-none block">{timeStr || '15:09:20'}</span>
          <span className="text-[10px] text-slate-500 font-normal block">{dateStr || 'Fri, Aug 21, 2026'}</span>
        </div>
      </div>
    </header>
  );
}
