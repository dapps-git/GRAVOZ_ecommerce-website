'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  className?: string;
}

export function getVisiblePageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 1) return [1];
  const pages = new Set<number>([1, totalPages]);
  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  if (currentPage <= 3) {
    for (let p = 1; p <= Math.min(4, totalPages); p++) pages.add(p);
  }
  if (currentPage >= totalPages - 2) {
    for (let p = Math.max(1, totalPages - 3); p <= totalPages; p++) pages.add(p);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export default function PaginationBar({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  itemLabel = 'products',
  onPageChange,
  className = '',
}: PaginationBarProps) {
  if (totalCount <= 0) return null;

  const safeCurrent = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const startItem = (safeCurrent - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrent * itemsPerPage, totalCount);
  const visiblePages = getVisiblePageNumbers(safeCurrent, totalPages);

  return (
    <div
      className={`pt-5 pb-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E5E5E5] ${className}`}
    >
      <div className="text-xs text-slate-600 font-medium">
        Showing <span className="font-semibold text-slate-900">{startItem}</span> to{' '}
        <span className="font-semibold text-slate-900">{endItem}</span> of{' '}
        <span className="font-semibold text-[#F37021]">{totalCount}</span> {itemLabel}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1.5 flex-wrap justify-center">
          <button
            type="button"
            disabled={safeCurrent <= 1}
            onClick={() => onPageChange(Math.max(1, safeCurrent - 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-semibold text-slate-700 hover:border-[#F37021] hover:text-[#F37021] disabled:opacity-40 disabled:hover:border-[#E5E5E5] disabled:hover:text-slate-700 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          {visiblePages.map((pageNum, idx) => {
            const prevPage = visiblePages[idx - 1];
            const showEllipsis = prevPage && pageNum - prevPage > 1;
            const isActive = safeCurrent === pageNum;

            return (
              <React.Fragment key={pageNum}>
                {showEllipsis && (
                  <span className="px-1 text-xs text-slate-400 select-none">...</span>
                )}
                <button
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F37021] text-white shadow-xs'
                      : 'border border-[#E5E5E5] bg-white text-slate-700 hover:border-[#F37021] hover:text-[#F37021]'
                  }`}
                >
                  {pageNum}
                </button>
              </React.Fragment>
            );
          })}

          <button
            type="button"
            disabled={safeCurrent >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, safeCurrent + 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-semibold text-slate-700 hover:border-[#F37021] hover:text-[#F37021] disabled:opacity-40 disabled:hover:border-[#E5E5E5] disabled:hover:text-slate-700 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      )}
    </div>
  );
}

