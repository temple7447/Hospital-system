import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlaskConical, AlertTriangle, CheckCircle2, Activity, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { db, isImagingOrder } from '@/lib/db';

const PRIORITY_CFG = {
  routine: { color: 'text-slate-500 bg-slate-100 dark:bg-slate-800', label: 'Routine' },
  urgent:  { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', label: 'Urgent' },
  stat:    { color: 'text-red-600 bg-red-50 dark:bg-red-900/20',     label: 'STAT' },
} as const;

const LabTechDashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const stats = useMemo(() => db.stats.labTech(), []);
  const pending = useMemo(() => {
    return db.labOrders.getAll()
      .filter(o => !isImagingOrder(o))
      .filter(o => o.status !== 'completed' && o.status !== 'cancelled')
      .sort((a, b) => {
        const order = { stat: 0, urgent: 1, routine: 2 };
        return order[a.priority] - order[b.priority];
      })
      .slice(0, 6);
  }, []);

  const KPI = [
    { label: 'Pending Orders', value: stats.pendingOrders,    icon: FlaskConical,  color: 'blue' },
    { label: 'Processing',     value: stats.inProgress,       icon: Activity,      color: 'violet' },
    { label: 'Completed Today',value: stats.completedToday,   icon: CheckCircle2,  color: 'emerald' },
    { label: 'Urgent',         value: stats.urgentOrders,     icon: AlertTriangle, color: 'amber' },
  ];

  return (
    <div className="space-y-8 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Lab, {user.name.split(' ')[0]}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Pathology and diagnostics overview</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-5 rounded-3xl">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center mb-3',
              k.color === 'blue'    && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
              k.color === 'violet'  && 'bg-violet-50 dark:bg-violet-900/20 text-violet-600',
              k.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
              k.color === 'amber'   && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
            )}>
              <k.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{k.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white">Order Queue</h3>
            <p className="text-xs text-slate-400 font-bold">Sorted by priority</p>
          </div>
          <Link to="/lab/queue" className="text-xs font-black text-blue-600 hover:text-blue-700">View all →</Link>
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-sm">Queue is empty.</div>
        ) : (
          <div className="space-y-3">
            {pending.map(o => {
              const patient = db.patients.getById(o.patientId);
              const doctor  = db.staff.getById(o.doctorId);
              const pri = PRIORITY_CFG[o.priority];
              return (
                <Link key={o.id} to={`/lab/results?id=${o.id}`}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{o.labNumber} · {o.tests.join(', ')}</p>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'} · {doctor ? db.staff.getDisplayName(doctor) : '—'}
                    </p>
                  </div>
                  <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide shrink-0', pri.color)}>
                    {pri.label}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(o.orderedAt).toLocaleDateString()}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LabTechDashboard;
