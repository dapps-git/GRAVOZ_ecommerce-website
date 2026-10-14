import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import BottomNav from '@/components/BottomNav';
import ScrollToTop from '@/components/ScrollToTop';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'GRAVOZ | Premium Footwear for Men, Women & Babies',
  description: 'Discover handcrafted luxury shoes for Men, Women, and Babies. Ergonomic arch support, breathable leather, and timeless elegance.',
  keywords: ['shoes', 'men shoes', 'women shoes', 'baby shoes', 'leather footwear', 'GRAVOZ'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}

