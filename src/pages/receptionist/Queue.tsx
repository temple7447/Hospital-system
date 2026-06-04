import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, ChevronRight, CheckCircle2, Bell,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { listQueue, updateQueueEntry, updateAppointment, listPatients, listStaff } from '@/lib/services';
import { toast } from 'sonner';
import type { QueueEntry, Patient, Staff } from '@/types';

type QueueStatus = 'waiting' | 'called' | 'in_progress' | 'completed' | 'no_show';

const STATUS_CFG: Record<QueueStatus, { label: string; bg: string; text: string; dot: string }> = {
  waiting:     { label: 'Waiting',     bg: 'bg-amber-50 dark:bg-amber-900/20',    text: 'text-amber-600',   dot: 'bg-amber-400' },
  called:      { label: 'Called',      bg: 'bg-blue-50 dark:bg-blue-900/20',      text: 'text-blue-600',    dot: 'bg-blue-400' },
  in_progress: { label: 'In Progress', bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-600', dot: 'bg-emerald-400' },
  completed:   { label: 'Completed',   bg: 'bg-slate-100 dark:bg-slate-800',      text: 'text-slate-500',   dot: 'bg-slate-400' },
  no_show:     { label: 'No Show',     bg: 'bg-red-50 dark:bg-red-900/20',        text: 'text-red-500',     dot: 'bg-red-400' },
};

const PRIORITY_CFG = {
  normal:    { cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500' },
  urgent:    { cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
  emergency: { cls: 'bg-red-50 dark:bg-red-900/20 text-red-600' },
};

function waitTime(checkedInAt: string) {
  const mins = Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const QueuePage: React.FC = () => {
  const { user } = useAuth();
  const [queue, setQueue]     = useState<QueueEntry[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors]  = useState<Staff[]>([]);
  const [statusFilter, setStatusFilter] = useState<QueueStatus | 'active'>('active');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [queueEntries, pts, staff] = await Promise.all([
        listQueue(),
        listPatients(),
        listStaff({ role: 'DOCTOR' }),
      ]);
      queueEntries.sort((a, b) => a.checkedInAt.localeCompare(b.checkedInAt));
      setQueue(queueEntries);
      setPatients(pts);
      setDoctors(staff);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    if (statusFilter === 'active')
      return queue.filter(q => q.status === 'waiting' || q.status === 'called' || q.status === 'in_progress');
    return queue.filter(q => q.status === statusFilter);
  }, [queue, statusFilter]);

  const stats = useMemo(() => ({
    waiting:    queue.filter(q => q.status === 'waiting').length,
    called:     queue.filter(q => q.status === 'called').length,
    inProgress: queue.filter(q => q.status === 'in_progress').length,
    completed:  queue.filter(q => q.status === 'completed').length,
  }), [queue]);

  const advance = async (entry: QueueEntry) => {
    setUpdating(entry.id);
    const next: QueueStatus | null =
      entry.status === 'waiting'     ? 'called' :
      entry.status === 'called'      ? 'in_progress' :
      entry.status === 'in_progress' ? 'completed' : null;
    if (!next) { setUpdating(null); return; }

    try {
      await updateQueueEntry(entry.id, { status: next as any });
      if (next === 'completed' && entry.appointmentId) {
        await updateAppointment(entry.appointmentId, { status: 'completed' }).catch(() => {});
      }
      const labels: Record<string, string> = { called: 'called', in_progress: 'started', completed: 'complete' };
      toast.success(`${entry.tokenNumber} marked ${labels[next] ?? next}`);
      load();
    } catch {
      toast.error('Failed to update queue entry');
    } finally {
      setUpdating(null);
    }
  };

  const markNoShow = async (entry: QueueEntry) => {
    setUpdating(entry.id);
    try {
      await updateQueueEntry(entry.id, { status: 'no_show' as any });
      if (entry.appointmentId) {
        await updateAppointment(entry.appointmentId, { status: 'no_show' }).catch(() => {});
      }
      toast.success(`${entry.tokenNumber} marked no-show`);
      load();
    } catch {
      toast.error('Failed to update queue entry');
    } finally {
      setUpdating(null);
    }
  };

  const nextAction = (status: QueueStatus) =>
    status === 'waiting'     ? { label: 'Call',     icon: Bell } :
    status === 'called'      ? { label: 'Start',    icon: ChevronRight } :
    status === 'in_progress' ? { label: 'Complete', icon: CheckCircle2 } : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Arrival Queue</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {stats.waiting} waiting · {stats.inProgress} in progress
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-2xl font-bold hover:bg-slate-50 transition-all self-start">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Waiting',     value: stats.waiting,    color: 'amber' },
          { label: 'Called',      value: stats.called,     color: 'blue' },
          { label: 'In Progress', value: stats.inProgress, color: 'emerald' },
          { label: 'Completed',   value: stats.completed,  color: 'slate' },
        ].map(s => (
          <div key={s.label} className={cn('p-5 rounded-2xl border',
            s.color === 'amber'   && 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
            s.color === 'blue'    && 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
            s.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
            s.color === 'slate'   && 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          )}>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
            <p className={cn('text-[10px] font-black uppercase tracking-wider mt-0.5',
              s.color === 'amber'   && 'text-amber-600',
              s.color === 'blue'    && 'text-blue-600',
              s.color === 'emerald' && 'text-emerald-600',
              s.color === 'slate'   && 'text-slate-500',
            )}>{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(['active', 'waiting', 'called', 'in_progress', 'completed', 'no_show'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn('px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
              statusFilter === s
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-300')}>
            {s === 'active' ? 'Active' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Queue list */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card p-16 rounded-3xl text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">Queue is empty</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <AnimatePresence>
            {filtered.map((entry, i) => {
              const patient = patients.find(p => p.id === entry.patientId);
              const doctor  = doctors.find(d => d.id === entry.doctorId);
              const cfg     = STATUS_CFG[entry.status];
              const priCfg  = PRIORITY_CFG[entry.priority];
              const action  = nextAction(entry.status);
              const busy    = updating === entry.id;

              return (
                <motion.div key={entry.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-2xl p-5 flex items-center gap-4">

                  {/* Token + status dot */}
                  <div className="flex flex-col items-center gap-1 shrink-0 w-14">
                    <span className="text-lg font-black text-slate-900 dark:text-white">{entry.tokenNumber}</span>
                    <div className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                  </div>

                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {patient ? `${patient.firstName} ${patient.lastName}` : '—'}
                      </p>
                      <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase', priCfg.cls)}>
                        {entry.priority}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase', cfg.bg, cfg.text)}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-bold flex-wrap">
                      {doctor && <span>Dr. {doctor.firstName} {doctor.lastName}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {waitTime(entry.checkedInAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.status === 'waiting' && (
                      <button onClick={() => markNoShow(entry)} disabled={busy}
                        className="p-2 rounded-xl text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all disabled:opacity-40"
                        title="Mark no-show">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    )}
                    {action && (
                      <button onClick={() => advance(entry)} disabled={busy}
                        className={cn('flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40',
                          entry.status === 'in_progress'
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20')}>
                        <action.icon className="w-3.5 h-3.5" />
                        {action.label}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default QueuePage;
