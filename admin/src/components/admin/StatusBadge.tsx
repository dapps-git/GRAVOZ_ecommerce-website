interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    shipped: 'bg-[#faf4ec] text-[#89591C] border-[#e8e2d8]',
    processing: 'bg-amber-50 text-amber-700 border-amber-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    archived: 'bg-slate-100 text-slate-600 border-slate-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
    refund_initiated: 'bg-amber-50 text-amber-800 border-amber-300',
    refund_processing: 'bg-sky-50 text-sky-800 border-sky-300',
    refunded: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    refund_failed: 'bg-rose-50 text-rose-800 border-rose-300',
  };

  const style = statusStyles[normalized] || 'bg-slate-100 text-slate-600 border-slate-200';
  const label = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider border ${style}`}>
      ● {label}
    </span>
  );
}
