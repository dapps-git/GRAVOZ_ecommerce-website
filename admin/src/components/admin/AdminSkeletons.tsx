'use client';

import React from 'react';

export function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} />;
}

export function AdminHeaderSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <SkeletonBox className="h-6 w-48" />
        <SkeletonBox className="h-3.5 w-72 max-w-full" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-9 w-28 rounded-lg" />
        <SkeletonBox className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  );
}

export function KpiStatsSkeleton({
  count = 5,
  gridClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
}: {
  count?: number;
  gridClass?: string;
}) {
  return (
    <div className={`grid ${gridClass} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-[#E5E5E5] p-4 flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-2 flex-1 pr-3">
            <SkeletonBox className="h-3 w-20" />
            <SkeletonBox className="h-7 w-14" />
            <SkeletonBox className="h-2.5 w-24" />
          </div>
          <SkeletonBox className="w-10 h-10 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeletons({
  rows = 7,
  cols = 6,
  hasCheckbox = false,
  hasThumb = false,
}: {
  rows?: number;
  cols?: number;
  hasCheckbox?: boolean;
  hasThumb?: boolean;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="animate-pulse">
          {Array.from({ length: cols }).map((__, colIdx) => {
            if (hasCheckbox && colIdx === 0) {
              return (
                <td key={colIdx} className="py-3.5 pl-4 pr-2 w-10">
                  <div className="w-3.5 h-3.5 rounded bg-slate-200/80" />
                </td>
              );
            }
            const isPrimaryCol = (hasCheckbox && colIdx === 1) || (!hasCheckbox && colIdx === 0);
            if (isPrimaryCol && hasThumb) {
              return (
                <td key={colIdx} className="py-3 px-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-200/80 flex-shrink-0" />
                    <div className="space-y-1.5 min-w-[120px]">
                      <div className="h-3.5 w-32 rounded bg-slate-200/80" />
                      <div className="h-2.5 w-20 rounded bg-slate-100" />
                    </div>
                  </div>
                </td>
              );
            }
            const widths = ['w-24', 'w-20', 'w-16', 'w-28', 'w-14', 'w-20'];
            const wClass = colIdx === cols - 1 ? 'w-16 ml-auto' : widths[(rowIdx + colIdx) % widths.length];
            return (
              <td key={colIdx} className="py-3.5 px-3.5">
                <div className={`h-3.5 rounded bg-slate-200/80 ${wClass}`} />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

export function CardGridSkeleton({
  count = 6,
  gridClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  imageHeight = 'h-40',
}: {
  count?: number;
  gridClass?: string;
  imageHeight?: string;
}) {
  return (
    <div className={`grid ${gridClass} gap-4`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-[#E5E5E5] p-4 space-y-3 shadow-2xs animate-pulse"
        >
          <div className={`w-full ${imageHeight} rounded-lg bg-slate-200/80`} />
          <div className="space-y-2">
            <div className="h-4 w-2/3 rounded bg-slate-200/80" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#EEEEEE]">
            <div className="h-6 w-20 rounded-md bg-slate-200/80" />
            <div className="h-7 w-16 rounded-md bg-slate-200/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailPageSkeleton({ showCards = 2 }: { showCards?: number }) {
  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-pulse">
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-slate-200/80" />
          <div className="h-3 w-32 rounded bg-slate-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg bg-slate-200/80" />
          <div className="h-9 w-28 rounded-lg bg-slate-200/80" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: showCards }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-4">
              <div className="h-4 w-40 rounded bg-slate-200/80" />
              <div className="space-y-3">
                {[0, 1, 2].map((r) => (
                  <div key={r} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-none">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-200/80" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-36 rounded bg-slate-200/80" />
                        <div className="h-3 w-20 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="h-4 w-16 rounded bg-slate-200/80" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-3">
            <div className="h-4 w-32 rounded bg-slate-200/80" />
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
            <div className="h-9 w-full rounded-lg bg-slate-200/80 mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormEditorSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-pulse">
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-44 rounded bg-slate-200/80" />
          <div className="h-3 w-64 rounded bg-slate-100" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-slate-200/80" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-28 rounded bg-slate-200/80" />
              <div className="h-10 w-full rounded-lg bg-slate-100" />
            </div>
          ))}
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-slate-200/80" />
            <div className="h-24 w-full rounded-lg bg-slate-100" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-3">
            <div className="h-4 w-32 rounded bg-slate-200/80" />
            <div className="h-36 w-full rounded-lg bg-slate-100" />
            <div className="h-9 w-full rounded-lg bg-slate-200/80" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-md p-3.5 border border-[#E5E5E5] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-slate-200/80" />
              <div className="w-8 h-8 rounded-md bg-slate-200/80" />
            </div>
            <div className="h-6 w-20 rounded bg-slate-200/80" />
            <div className="h-2.5 w-24 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#E5E5E5] space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-44 rounded bg-slate-200/80" />
              <div className="h-3 w-56 rounded bg-slate-100" />
            </div>
            <div className="h-6 w-24 rounded bg-slate-200/80" />
          </div>
          <div className="h-48 flex items-end gap-3 pt-4 border-b border-[#E5E5E5] pb-2">
            {[45, 70, 55, 90, 62, 80, 50].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div style={{ height: `${h}%` }} className="w-full max-w-[28px] rounded-t-md bg-slate-200/80" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E5E5] space-y-4">
          <div className="space-y-1.5">
            <div className="h-4 w-36 rounded bg-slate-200/80" />
            <div className="h-3 w-40 rounded bg-slate-100" />
          </div>
          <div className="flex justify-center py-4">
            <div className="w-[150px] h-[150px] rounded-full border-[16px] border-slate-200/80" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-7 rounded-md bg-slate-100" />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E5]">
          <div className="h-4 w-40 rounded bg-slate-200/80" />
        </div>
        <table className="w-full">
          <tbody className="divide-y divide-[#EEEEEE]">
            <TableRowSkeletons rows={5} cols={6} hasThumb />
          </tbody>
        </table>
      </div>
    </div>
  );
}

