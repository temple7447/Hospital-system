import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ScanLine, Search, Clock, ChevronRight, Activity } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { db, isImagingOrder } from '@/lib/db';
import type { LabOrder, LabTestStatus } from '@/types';

const PRIORITY_CFG = {
  routine: { color: 'text-slate-500 bg-slate-100 dark:bg-slate-800', label: 'Routine' },
  urgent:  { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', label: 'Urgent' },
  stat:    { color: 'text-red-600 bg-red-50 dark:bg-red-900/20',     label: 'STAT' },
} as const;

const STATUS_CFG = {
  ordered:    { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',       label: 'Ordered' },
  collected:  { color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20', label: 'Scheduled' },
  processing: { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',    label: 'In Progress' },
  completed:  { color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', label: 'Completed' },
  cancelled:  { color: 'text-slate-500 bg-slate-100 dark:bg-slate-800',       label: 'Cancelled' },
} as const;

const ImagingQueue: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<LabOrder[]>(() =>
    db.labOrders.getAll().filter(o => isImagingOrder(o)));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LabTestStatus | 'all'>('all');

  const refresh = () => setOrders(db.labOrders.getAll().filter(o => isImagingOrder(o)));

  const filtered = useMemo(() => {
    let list = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);
    if (search) {
      const t = search.toLowerCase();
      list = list.filter(o => {
        const p = db.patients.getById(o.patientId);
        return (
          o.labNumber.toLowerCase().includes(t) ||
          o.tests.some(test => test.toLowerCase().includes(t)) ||
          (p && `${p.firstName} ${p.lastName}`.toLowerCase().includes(t))
        );
      });
    }
    return list.sort((a, b) => {
      const order = { stat: 0, urgent: 1, routine: 2 };
      return order[a.priority] - order[b.priority];
    });
  }, [orders, search, statusFilter]);

  const advance = (o: LabOrder) => {
    if (!user) return;
    const nextStatus: LabTestStatus =
      o.status === 'ordered'    ? 'collected'  :
      o.status === 'collected'  ? 'processing' : 'processing';
    db.labOrders.update(o.id, { status: nextStatus });
    db.auditLogs.create({
      userId: user.id, userRole: user.role,
      action: 'UPDATE_IMAGING_STATUS', resource: 'LabOrder', resourceId: o.id,
      details: `${o.labNumber} → ${nextStatus}`,
    });
    toast.success(`Status updated to ${nextStatus}`);
    refresh();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Imaging Queue</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{filtered.length} pending studies</p>
      </div>

      <div className="glass-card rounded-3xl p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by lab number, study, or patient…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-10 py-2.5 text-sm w-full" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as LabTestStatus | 'all')}
          className="input-field py-2.5 text-sm">
          <option value="all">All Statuses</option>
          <option value="ordered">Ordered</option>
          <option value="collected">Scheduled</option>
          <option value="processing">In Progress</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center text-slate-400 font-medium">No imaging studies match filter.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const patient = db.patients.getById(o.patientId);
            const doctor  = db.staff.getById(o.doctorId);
            const pri = PRIORITY_CFG[o.priority];
            const st  = STATUS_CFG[o.status];

            return (
              <motion.div key={o.id} layout className="glass-card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shrink-0">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 dark:text-white truncate">{o.labNumber}</p>
                  <p className="text-xs text-slate-500 font-medium truncate">{o.tests.join(', ')}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                    {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'} · ordered by {doctor ? db.staff.getDisplayName(doctor) : '—'}
                  </p>
                </div>
                <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide shrink-0', pri.color)}>
                  {pri.label}
                </span>
                <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide shrink-0', st.color)}>
                  {st.label}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(o.orderedAt).toLocaleDateString()}
                </div>
                {o.status !== 'processing' && (
                  <button onClick={() => advance(o)}
                    className="px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-lg text-xs font-black hover:bg-violet-100 transition-colors flex items-center gap-1 shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                    {o.status === 'ordered' ? 'Schedule' : 'Start'}
                  </button>
                )}
                <Link to={`/radiology/report?id=${o.id}`}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg text-xs font-black hover:bg-indigo-100 transition-colors flex items-center gap-1 shrink-0">
                  Write Report <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ImagingQueue;
