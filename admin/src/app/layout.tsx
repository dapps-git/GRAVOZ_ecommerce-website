import type { Metadata } from 'next';
import { Montserrat, Poppins, Playfair_Display } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GRAVOZ Admin | Store Management',
  description: 'GRAVOZ Handcrafted Footwear Store Management Panel',
  keywords: ['shoes', 'men shoes', 'women shoes', 'baby shoes', 'leather footwear', 'GRAVOZ'],
};

import ScrollToTop from '@/components/admin/ScrollToTop';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${poppins.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="bg-[#faf8f5] text-[#1e293b] font-sans min-h-screen antialiased selection:bg-[#89591C] selection:text-white" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }} suppressHydrationWarning>
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
