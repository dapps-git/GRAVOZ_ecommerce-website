import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import BottomNav from '@/components/BottomNav';
import ScrollToTop from '@/components/ScrollToTop';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'SERCHER | Premium Handcrafted Footwear for Men, Women & Unisex',
  description: 'Discover SERCHER handcrafted luxury shoes. Ergonomic arch support, breathable leather, and timeless elegance.',
  keywords: ['shoes', 'men shoes', 'women shoes', 'unisex shoes', 'leather footwear', 'SERCHER', 'sercher shoes'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SERCHER',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#89591C',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#FAF7F3] text-[#111111] min-h-screen antialiased selection:bg-[#8A5B2A] selection:text-white font-poppins" suppressHydrationWarning>
        <Providers>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          {children}
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}

