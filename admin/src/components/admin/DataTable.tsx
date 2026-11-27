'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { TableRowSkeletons } from '@/components/admin/AdminSkeletons';
import PaginationFooter from '@/components/admin/PaginationFooter';

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
  limit?: number;
  itemLabel?: string;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
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
  limit = 20,
  itemLabel = 'results',
  onPageChange,
  onLimitChange,
  onSearch,
  searchPlaceholder = 'Search records...',
  loading = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const onSearchRef = useRef(onSearch);
  const lastSubmittedRef = useRef('');

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onSearchRef.current && searchTerm !== lastSubmittedRef.current) {
        lastSubmittedRef.current = searchTerm;
        onSearchRef.current(searchTerm);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  return (
    <div className="bg-white rounded-md border border-[#E5E5E5] shadow-xs overflow-hidden font-light">
      {/* Search Header */}
      {onSearch && (
        <div className="p-3 border-b border-[#E5E5E5] flex items-center justify-between gap-3 bg-[#F7F7F7]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#F37021] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E5E5E5] rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F37021]"
            />
          </div>
          {totalCount !== undefined && (
            <span className="text-[11px] text-slate-500 font-medium">Total: {totalCount} {itemLabel}</span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-[#F7F7F7] text-slate-600 font-semibold uppercase tracking-wider border-b border-[#E5E5E5]">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-3.5 py-2.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEEEEE]">
            {loading ? (
              <TableRowSkeletons rows={7} cols={columns.length} hasThumb />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3.5 py-8 text-center text-slate-400 font-normal">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row._id || row.id || rowIdx} className="hover:bg-[#FFF3EB]/60 transition-colors">
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
      {onPageChange && (
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount ?? data.length}
          limit={limit}
          itemCount={data.length}
          itemLabel={itemLabel}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}
