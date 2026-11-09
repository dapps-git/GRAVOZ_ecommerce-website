'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  // 1. Force instant scroll to top on every route / page change safely across Safari and all browsers
  useEffect(() => {
    const resetScroll = () => {
      try {
        window.scrollTo(0, 0);
      } catch {
        // fallback
      }
      try {
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      } catch {}
    };

    resetScroll();
    const timer = setTimeout(resetScroll, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  // 2. Track scroll position for floating back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 320) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#171717] hover:bg-[#8B4A12] text-white flex items-center justify-center shadow-2xl border border-white/20 transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer animate-in fade-in slide-in-from-bottom-3"
      title="Back to Top"
    >
      <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />
    </button>
  );
}
