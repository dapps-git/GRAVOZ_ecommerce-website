import type { Metadata, Viewport } from 'next';
import './globals.css';
import ScrollToTop from '@/components/admin/ScrollToTop';

export const metadata: Metadata = {
  title: 'SERCHER Admin | Store Management',
  description: 'SERCHER Handcrafted Footwear Store Management Panel',
  keywords: ['shoes', 'men shoes', 'women shoes', 'unisex shoes', 'leather footwear', 'SERCHER'],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
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
      <body
        className="bg-[#faf8f5] text-[#1e293b] font-sans min-h-screen antialiased selection:bg-[#89591C] selection:text-white"
        style={{ fontFamily: "'Montserrat', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        suppressHydrationWarning
      >
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}

