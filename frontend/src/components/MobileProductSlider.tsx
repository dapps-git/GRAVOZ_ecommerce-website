'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileProductSliderProps {
  children: React.ReactNode[];
  className?: string;
  autoPlayInterval?: number;
}

export default function MobileProductSlider({
  children,
  className = '',
  autoPlayInterval,
}: MobileProductSliderProps) {
  const items = React.Children.toArray(children);
  const count = items.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [cardWidth, setCardWidth] = useState(280);

  const containerRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const hasMovedRef = useRef(false);

  // Measure card width + gap on mount & resize
  const updateMeasurements = useCallback(() => {
    if (firstCardRef.current) {
      setCardWidth(firstCardRef.current.offsetWidth);
    } else if (containerRef.current) {
      setCardWidth(containerRef.current.offsetWidth * 0.82);
    }
  }, []);

  useEffect(() => {
    updateMeasurements();
    window.addEventListener('resize', updateMeasurements);
    return () => window.removeEventListener('resize', updateMeasurements);
  }, [updateMeasurements]);

  const gap = 12; // 12px gap between cards

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
  }, [count]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
  }, [count]);

  // Optional autoplay
  useEffect(() => {
    if (!autoPlayInterval || count <= 1 || isDragging) return;
    const timer = setInterval(() => {
      goToNext();
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlayInterval, count, isDragging, goToNext]);

  if (count === 0) return null;

  // ── TOUCH GESTURE HANDLERS ──
  const handleTouchStart = (e: React.TouchEvent) => {
    if (count <= 1) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentXRef.current = touch.clientX;
    isHorizontalRef.current = null;
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || count <= 1) return;
    const touch = e.touches[0];
    currentXRef.current = touch.clientX;
    const deltaX = currentXRef.current - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;

    // Detect gesture axis on first significant movement
    if (isHorizontalRef.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        isHorizontalRef.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (isHorizontalRef.current) {
      hasMovedRef.current = true;
      // Spring resistance at boundaries
      let effectiveDelta = deltaX;
      if (
        (currentIndex === 0 && deltaX > 0) ||
        (currentIndex === count - 1 && deltaX < 0)
      ) {
        effectiveDelta = deltaX * 0.32;
      }
      setDragOffset(effectiveDelta);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaX = currentXRef.current - startXRef.current;
    const threshold = 40; // min px to trigger slide

    if (isHorizontalRef.current && Math.abs(deltaX) > threshold) {
      if (deltaX < 0 && currentIndex < count - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (deltaX > 0 && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    }

    setDragOffset(0);
    isHorizontalRef.current = null;
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 60);
  };

  // Prevent link navigation if user was swiping/dragging
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const slideStep = cardWidth + gap;
  const currentTranslate = -(currentIndex * slideStep) + dragOffset;

  return (
    <div className={`sm:hidden w-full select-none ${className}`}>
      {/* ── Slide Track Container ── */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden py-1 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClickCapture={handleClickCapture}
      >
        <div
          className="flex will-change-transform"
          style={{
            transform: `translate3d(${currentTranslate}px, 0, 0)`,
            transition: isDragging
              ? 'none'
              : 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
            gap: `${gap}px`,
          }}
        >
          {items.map((item, idx) => (
            <div
              key={idx}
              ref={idx === 0 ? firstCardRef : undefined}
              className="w-[78vw] max-w-[300px] flex-shrink-0"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile Controls: Swipe/Slide Navigation & Dots ── */}
      {count > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          {/* Previous Product Button */}
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Previous Product"
            className="w-8 h-8 rounded-full bg-white border border-[#E8E1D9] shadow-2xs flex items-center justify-center text-[#171717] hover:text-[#89591C] hover:border-[#89591C] active:scale-90 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>

          {/* Dots & Counter */}
          <div className="flex items-center gap-1.5">
            {items.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to product ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-5 h-2 bg-[#89591C]'
                    : 'w-2 h-2 bg-[#E0D7CC] hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          {/* Next Product Button */}
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next Product"
            className="w-8 h-8 rounded-full bg-white border border-[#E8E1D9] shadow-2xs flex items-center justify-center text-[#171717] hover:text-[#89591C] hover:border-[#89591C] active:scale-90 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
