import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface Doctor {
  name: string;
  department: string;
  status: 'Available' | 'In Session' | 'On Break';
  room: string;
}

interface DoctorAvailabilityProps {
  doctors: Doctor[];
  className?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  'Available': { bg: 'bg-emerald-500', text: 'text-emerald-600' },
  'In Session': { bg: 'bg-blue-500', text: 'text-blue-600' },
  'On Break': { bg: 'bg-amber-500', text: 'text-amber-600' },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function DoctorAvailability({ doctors, className }: DoctorAvailabilityProps) {
  return (
    <div className={className}>
      <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-6">Doctor Availability</h3>
      <div className="space-y-4">
        {doctors.map((doc, i) => (
          <motion.div 
            key={i}
            variants={item}
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[doc.status].bg.replace('bg-', '#') }} />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{doc.name}</p>
                <p className="text-[10px] text-slate-500">{doc.department} • {doc.room}</p>
              </div>
            </div>
            <span className={cn("text-[10px] font-black uppercase tracking-wider", statusColors[doc.status].text)}>
              {doc.status}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default DoctorAvailability;