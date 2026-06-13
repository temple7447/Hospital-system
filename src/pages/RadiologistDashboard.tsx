import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScanLine, AlertTriangle, CheckCircle2, Activity, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import {
  getRadiologistStats,
  listLabOrders,
  listPatients,
  listStaff,
} from '@/lib/services';
import type { LabOrder, Patient, Staff } from '@/types';

const IMAGING_KEYWORDS = ['mri', 'x-ray', 'xray', 'ct ', 'ct scan', 'ultrasound', 'echo', 'scan', 'mammogram', 'fluoroscopy'];

const isImagingOrder = (order: LabOrder): boolean => {
  if (order.category === 'radiology') return true;
  if (order.category === 'lab') return false;
  return order.tests.some(t => IMAGING_KEYWORDS.some(k => t.toLowerCase().includes(k)));
};

const PRIORITY_CFG = {
  routine: { color: 'text-slate-500 bg-slate-100 dark:bg-slate-800', label: 'Routine' },
  urgent:  { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', label: 'Urgent' },
  stat:    { color: 'text-red-600 bg-red-50 dark:bg-red-900/20',     label: 'STAT' },
} as const;

const RadiologistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pending, setPending] = useState<LabOrder[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const { data: stats } = useApi(getRadiologistStats);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      listLabOrders({ category: 'radiology' }),
      listPatients({ limit: 500 }),
      listStaff({ limit: 500 }),
    ]).then(([orders, patientList, staffList]) => {
      const priorityOrder = { stat: 0, urgent: 1, routine: 2 } as const;
      const filtered = orders
        .filter(o => isImagingOrder(o))
        .filter(o => o.status !== 'completed' && o.status !== 'cancelled')
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .slice(0, 6);
      setPending(filtered);
      setPatients(patientList);
      setStaff(staffList);
    });
  }, [user]);

  if (!user) return null;

  const getPatient = (id: string) => patients.find(p => p.id === id);
  const getDoctor  = (id: string) => staff.find(s => s.id === id || s.userId === id);
  const getDisplayName = (s: Staff) =>
    s.role === 'DOCTOR' ? `Dr. ${s.firstName} ${s.lastName}` : `${s.firstName} ${s.lastName}`;

  const KPI = [
    { label: 'Pending Imaging', value: stats?.pendingImaging ?? '—',  icon: ScanLine,      color: 'blue' },
    { label: 'In Progress',     value: stats?.inProgress ?? '—',      icon: Activity,      color: 'violet' },
    { label: 'Completed Today', value: stats?.completedToday ?? '—',  icon: CheckCircle2,  color: 'emerald' },
    { label: 'Urgent',          value: stats?.urgentImaging ?? '—',   icon: AlertTriangle, color: 'amber' },
  ];

  return (
    <div className="space-y-8 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Radiology, {user.name.split(' ')[0]}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Imaging studies overview</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-5 rounded-lg">
            <div className={cn('w-10 h-10 rounded-md flex items-center justify-center mb-3',
              k.color === 'blue'    && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
              k.color === 'violet'  && 'bg-violet-50 dark:bg-violet-900/20 text-violet-600',
              k.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
              k.color === 'amber'   && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
            )}>
              <k.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{k.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Imaging Queue</h3>
            <p className="text-xs text-slate-400 font-bold">Sorted by priority</p>
          </div>
          <Link to="/radiology/queue" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</Link>
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-sm">No pending imaging.</div>
        ) : (
          <div className="space-y-3">
            {pending.map(o => {
              const patient = getPatient(o.patientId);
              const doctor  = getDoctor(o.doctorId);
              const pri = PRIORITY_CFG[o.priority];
              return (
                <Link key={o.id} to={`/radiology/report?id=${o.id}`}
                  className="flex items-center gap-4 p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shrink-0">
                    <ScanLine className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{o.labNumber} · {o.tests.join(', ')}</p>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'} · {doctor ? getDisplayName(doctor) : '—'}
                    </p>
                  </div>
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg uppercase tracking-wide shrink-0', pri.color)}>
                    {pri.label}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(o.orderedAt).toLocaleDateString()}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RadiologistDashboard;
