import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface QuickStat {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

interface QuickStatsProps {
  stats: QuickStat[];
  className?: string;
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
  emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
  amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
  purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
  red: "bg-red-50 dark:bg-red-900/20 text-red-600",
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function QuickStats({ stats, className }: QuickStatsProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat, i) => (
        <motion.div 
          key={i}
          variants={item}
          className="glass-card p-6 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-2xl", colorMap[stat.color || 'blue'])}>
              <stat.icon className="w-6 h-6" />
            </div>
            <span className={cn(
              "text-[10px] font-black px-2 py-1 rounded-lg",
              stat.change.startsWith('+') || stat.change.includes('%') && !stat.change.includes('-')
                ? "bg-emerald-50 text-emerald-600" 
                : "bg-red-50 text-red-600"
            )}>
              {stat.change}
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

export default QuickStats;