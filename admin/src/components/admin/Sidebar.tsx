'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  Tag,
  Users,
  Boxes,
  ShoppingCart,
  RotateCcw,
  FileText,
  MessageSquareQuote,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: ShoppingBag },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Brands', href: '/admin/brands', icon: Tag },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Stock Control', href: '/admin/stock', icon: Boxes },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Returns & Refunds', href: '/admin/returns', icon: RotateCcw },
  { name: 'Invoices', href: '/admin/invoices', icon: FileText },
  { name: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <aside className="w-60 bg-white border-r border-[#e8e2d8] flex flex-col justify-between h-screen sticky top-0 flex-shrink-0 z-30 font-light">
      <div className="p-4 space-y-4">
        {/* Brand Header with Official GRAVOZ Logo */}
        <div className="px-2 py-2 border-b border-[#e8e2d8] flex flex-col items-start gap-1">
          <Link href="/admin/dashboard" className="block py-1">
            <Image
              src="/gravoz-logo.png"
              alt="GRAVOZ Brand Logo"
              width={140}
              height={34}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>
          <span className="text-[10px] text-[#89591C] font-semibold tracking-wider uppercase block">
            Shoe Admin Suite
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                  isActive
                    ? 'bg-[#89591C] text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-[#faf4ec] hover:text-[#89591C] font-normal'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#89591C]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: #89591C Brown Logout Button */}
      <div className="p-3 border-t border-[#e8e2d8] bg-[#faf8f5]">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#89591C] hover:bg-[#724816] text-white rounded-md text-xs font-bold transition-all shadow-xs"
        >
          <LogOut className="w-4 h-4 text-white" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
