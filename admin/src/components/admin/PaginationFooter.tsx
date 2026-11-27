'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationFooterProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  itemCount: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
}

function getAdminVisiblePages(currentPage: number, totalPages: number): number[] {
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

export default function PaginationFooter({
  currentPage,
  totalPages,
  totalCount,
  limit,
  itemCount,
  itemLabel = 'results',
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
}: PaginationFooterProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrent = Math.min(Math.max(1, currentPage), safeTotalPages);
  const startItem = itemCount > 0 && totalCount > 0 ? (safeCurrent - 1) * limit + 1 : 0;
  const endItem = itemCount > 0 && totalCount > 0 ? Math.min(safeCurrent * limit, totalCount) : 0;
  const visiblePages = getAdminVisiblePages(safeCurrent, safeTotalPages);

  return (
    <div className="p-3.5 border-t border-[#E5E5E5] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
      <div className="font-medium">
        Showing <span className="font-semibold text-slate-900">{startItem}</span> to{' '}
        <span className="font-semibold text-slate-900">{endItem}</span> of{' '}
        <span className="font-semibold text-[#F37021]">{totalCount}</span> {itemLabel}
        <span className="text-slate-400 font-normal ml-2">
          (Page {safeCurrent} of {safeTotalPages})
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        {onLimitChange && (
          <select
            aria-label="Rows per page"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-slate-700 font-medium focus:outline-none focus:border-[#F37021] cursor-pointer"
          >
            {limitOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} per page
              </option>
            ))}
          </select>
        )}

        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button
            type="button"
            disabled={safeCurrent <= 1}
            onClick={() => onPageChange(Math.max(1, safeCurrent - 1))}
            aria-label="Previous page"
            className="px-2.5 h-7 rounded-lg border border-slate-200 bg-white flex items-center gap-1 text-slate-600 font-medium hover:border-[#F37021] hover:text-[#F37021] disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {visiblePages.map((pageNum, idx) => {
            const prevPage = visiblePages[idx - 1];
            const showEllipsis = prevPage && pageNum - prevPage > 1;
            const isCurrent = safeCurrent === pageNum;

            return (
              <React.Fragment key={pageNum}>
                {showEllipsis && (
                  <span className="px-1 text-slate-400 select-none">...</span>
                )}
                <button
                  type="button"
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#F37021] text-white shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-[#F37021] hover:text-[#F37021]'
                  }`}
                >
                  {pageNum}
                </button>
              </React.Fragment>
            );
          })}

          <button
            type="button"
            disabled={safeCurrent >= safeTotalPages}
            onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrent + 1))}
            aria-label="Next page"
            className="px-2.5 h-7 rounded-lg border border-slate-200 bg-white flex items-center gap-1 text-slate-600 font-medium hover:border-[#F37021] hover:text-[#F37021] disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      </div>
    </div>
  );
}

