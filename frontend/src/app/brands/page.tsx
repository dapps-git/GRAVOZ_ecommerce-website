import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowRight, ShieldCheck, Sparkles, Award } from 'lucide-react';

export const metadata = {
  title: 'Our Brands & Collections | SERCHER Handcrafted Footwear',
  description: 'Explore SERCHER premium handcrafted footwear collections and signature brand lines.',
};

export default function BrandsPage() {
  const brandHighlights = [
    {
      name: 'SERCHER Signature',
      tagline: 'Artisanal Genuine Leather Footwear',
      description: 'Handcrafted by master artisans with genuine leather, engineered for unmatched elegance and all-day comfort.',
      href: '/products?category=men',
      tag: 'FLAGSHIP',
    },
    {
      name: 'SERCHER Comfort Pro',
      tagline: 'Ergonomic Cushioning & Support',
      description: 'Daily comfort footbeds with anti-fatigue memory insoles designed for long hours on your feet.',
      href: '/products?category=footwear',
      tag: 'BESTSELLER',
    },
    {
      name: 'SERCHER Luxe Collection',
      tagline: 'Bespoke Evening & Formalwear',
      description: 'Hand-burnished leather oxfords, derbies, and monk straps designed for executive presence.',
      href: '/products',
      tag: 'PREMIUM',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111] flex flex-col justify-between font-poppins">
      <Header />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-16 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFF3EB] border border-[#FAD4BC] text-[#F37021] text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SERCHER ATELIER</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#111111]">
            Our Brands &amp; Signature Lines
          </h1>
          <p className="text-sm sm:text-base text-[#555555] font-normal leading-relaxed">
            Every pair is a testament to heritage craftsmanship, precision stitching, and premium materials designed to elevate your everyday style.
          </p>
        </div>

        {/* Brand Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {brandHighlights.map((brand, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E5E5E5] p-6 sm:p-8 flex flex-col justify-between hover:border-[#F37021] hover:shadow-lg transition-all group"
            >
              <div className="space-y-4">
                <span className="inline-block px-2.5 py-0.5 bg-[#F7F7F7] border border-[#E5E5E5] text-[#F37021] text-[10px] font-bold tracking-wider">
                  {brand.tag}
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#111111] group-hover:text-[#F37021] transition-colors">
                    {brand.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#F37021] mt-1">
                    {brand.tagline}
                  </p>
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  {brand.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#EEEEEE]">
                <Link
                  href={brand.href}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#F37021] hover:text-[#D95B10] transition-colors"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Craftsmanship Guarantee */}
        <div className="bg-white border border-[#E5E5E5] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F7F7F7] border border-[#FAD4BC] flex items-center justify-center text-[#F37021] flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#111111]">100% Genuine Handcrafted Guarantee</h4>
              <p className="text-xs text-[#555555]">Every product undergoes multi-point artisan inspection before shipping.</p>
            </div>
          </div>
          <Link
            href="/products"
            className="w-full sm:w-auto px-6 py-3 bg-[#F37021] hover:bg-[#D95B10] text-white text-xs font-bold uppercase tracking-wider text-center transition-colors flex-shrink-0"
          >
            Browse All Footwear
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
