import {
  AdminHeaderSkeleton,
  KpiStatsSkeleton,
  TableRowSkeletons,
} from '@/components/admin/AdminSkeletons';

export default function AdminLoading() {
  return (
    <div className="space-y-5">
      <AdminHeaderSkeleton />
      <KpiStatsSkeleton count={4} gridClass="grid-cols-2 lg:grid-cols-4" />
      <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden shadow-2xs">
        <div className="p-3 border-b border-[#E5E5E5] bg-[#F7F7F7]">
          <div className="h-8 w-72 max-w-full rounded-lg bg-slate-200/80 animate-pulse" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-[#EEEEEE]">
              <TableRowSkeletons rows={7} cols={6} hasThumb />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

