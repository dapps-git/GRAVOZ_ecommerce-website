'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (term: string) => void;
  searchPlaceholder?: string;
  loading?: boolean;
}

export default function DataTable<T extends { _id?: string | number; id?: string | number }>({
  columns,
  data,
  totalCount,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Search records...',
  loading = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, onSearch]);

  return (
    <div className="bg-white rounded-md border border-[#e8e2d8] shadow-xs overflow-hidden font-light">
      {/* Search Header */}
      {onSearch && (
        <div className="p-3 border-b border-[#e8e2d8] flex items-center justify-between gap-3 bg-[#faf8f5]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#89591C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#e8e2d8] rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#89591C]"
            />
          </div>
          {totalCount !== undefined && (
            <span className="text-[11px] text-slate-500 font-medium">Total: {totalCount} items</span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-[#faf8f5] text-slate-600 font-semibold uppercase tracking-wider border-b border-[#e8e2d8]">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-3.5 py-2.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ebd9]">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-3.5 py-8 text-center text-slate-500 animate-pulse font-normal">
                  Loading data...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3.5 py-8 text-center text-slate-400 font-normal">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row._id || row.id || rowIdx} className="hover:bg-[#faf4ec]/60 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-3.5 py-2.5 ${col.className || ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : col.accessor
                        ? (row[col.accessor] as React.ReactNode)
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {onPageChange && totalPages > 1 && (
        <div className="p-3 border-t border-[#e8e2d8] flex items-center justify-between bg-[#faf8f5]">
          <span className="text-[11px] text-slate-500 font-normal">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-1 rounded-md bg-white border border-[#e8e2d8] text-slate-600 hover:text-[#89591C] hover:border-[#89591C] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-1 rounded-md bg-white border border-[#e8e2d8] text-slate-600 hover:text-[#89591C] hover:border-[#89591C] disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
