import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'bronze';
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  color = 'bronze',
}: MetricCardProps) {
  const colorMap = {
    bronze: 'bg-[#faf4ec] text-[#89591C] border-[#e8e2d8]',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  };

  return (
    <div className="bg-white rounded-md p-3.5 border border-[#e8e2d8] shadow-xs hover:border-[#89591C] transition-all flex flex-col justify-between space-y-2 font-light">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-md border ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {subtitle && <p className="text-[11px] text-slate-500 font-normal mt-0.5">{subtitle}</p>}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium pt-1.5 border-t border-[#f0ebd9]">
          <span className={trendPositive ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
          <span className="text-slate-400 text-[10px]">vs last period</span>
        </div>
      )}
    </div>
  );
}
