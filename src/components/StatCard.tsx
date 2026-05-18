import React from 'react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'red';
  className?: string;
}

const colorMap = {
  blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
  emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
  amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
  purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
  red: "bg-red-50 dark:bg-red-900/20 text-red-600",
};

export function StatCard({ label, value, change, icon: Icon, color = 'blue', className }: StatCardProps) {
  return (
    <div className={cn("glass-card p-6 rounded-3xl", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl", colorMap[color])}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <span className={cn(
            "text-[10px] font-black px-2 py-1 rounded-lg",
            change.startsWith('+') || change === '65%' || change === 'Good' || change === 'Available'
              ? "bg-emerald-50 text-emerald-600" 
              : "bg-red-50 text-red-600"
          )}>
            {change}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{value}</h3>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

export default StatCard;