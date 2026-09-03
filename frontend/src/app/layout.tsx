import type { Metadata } from 'next';
import { Poppins, Playfair_Display, Montserrat } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GRAVOZ | Premium Footwear for Men, Women & Babies',
  description: 'Discover handcrafted luxury shoes for Men, Women, and Babies. Ergonomic arch support, breathable leather, and timeless elegance.',
  keywords: ['shoes', 'men shoes', 'women shoes', 'baby shoes', 'leather footwear', 'GRAVOZ'],
};

import Providers from '@/components/Providers';
import BottomNav from '@/components/BottomNav';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${montserrat.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="bg-[#FAF7F3] text-[#111111] min-h-screen antialiased selection:bg-[#8A5B2A] selection:text-white" suppressHydrationWarning>
        <Providers>
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
