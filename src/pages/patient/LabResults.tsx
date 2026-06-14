import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical, ChevronDown, ChevronUp, CheckCircle2, Clock,
  AlertTriangle, XCircle, Loader2, Zap,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { listLabOrders, listStaff } from '@/lib/services';
import type { LabOrder, LabTestStatus, ResultFlag, Staff } from '@/types';

const STATUS_CFG: Record<LabTestStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  ordered:    { label: 'Ordered',    bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-500',   icon: FlaskConical },
  collected:  { label: 'Collected',  bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-600',    icon: Clock },
  processing: { label: 'Processing', bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-600',   icon: Loader2 },
  completed:  { label: 'Completed',  bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',  bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-400',   icon: XCircle },
};

const FLAG_CFG: Record<ResultFlag, { label: string; bg: string; text: string; dot: string }> = {
  normal:   { label: 'Normal',   bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  abnormal: { label: 'Abnormal', bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-600',   dot: 'bg-amber-500' },
  critical: { label: 'Critical', bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-600',     dot: 'bg-red-500' },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

interface ResultCardProps {
  order: LabOrder;
  doctor: Staff | undefined;
  expanded: boolean;
  onToggle: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ order, doctor, expanded, onToggle }) => {
  const cfg = STATUS_CFG[order.status];
  const hasCritical = order.results?.some(t => t.fields?.some(f => f.flag === 'critical'));
  const hasAbnormal = order.results?.some(t => t.fields?.some(f => f.flag === 'abnormal'));

  return (
    <div className={cn('glass-card rounded-lg overflow-hidden', hasCritical && 'ring-2 ring-red-400/50')}>
      <button
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={cn('w-10 h-10 rounded-md flex items-center justify-center shrink-0', cfg.bg)}>
            <cfg.icon className={cn('w-5 h-5', cfg.text)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{order.labNumber}</p>
              <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase', cfg.bg, cfg.text)}>
                {cfg.label}
              </span>
              {order.priority !== 'routine' && (
                <span className={cn(
                  'px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase flex items-center gap-1',
                  order.priority === 'stat'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                )}>
                  {order.priority === 'stat' && <Zap className="w-2.5 h-2.5" />}
                  {order.priority}
                </span>
              )}
              {hasCritical && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" /> Critical
                </span>
              )}
              {!hasCritical && hasAbnormal && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                  Abnormal
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-bold truncate">
              {order.tests.length} test{order.tests.length !== 1 ? 's' : ''}
              {doctor && ` · Dr. ${doctor.firstName} ${doctor.lastName}`}
              {' · '}{fmtDateTime(order.orderedAt)}
            </p>
          </div>
        </div>
        <div className="shrink-0 ml-2">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">

              {/* Tests ordered */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Tests Ordered</p>
                <div className="flex flex-wrap gap-2">
                  {order.tests.map(t => (
                    <span key={t} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {order.notes && (
                <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-lg">
                  Doctor's note: {order.notes}
                </p>
              )}

              {/* Results */}
              {order.status === 'completed' && order.results && order.results.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Results</p>
                  {order.results.map((t, ti) => (
                    <div key={ti}>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t.testName}</p>
                      <div className="space-y-1.5">
                        {t.fields?.map((f, fi) => {
                          const fc = FLAG_CFG[f.flag];
                          return (
                            <div key={fi} className={cn('flex items-center justify-between p-3 rounded-md', fc.bg)}>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className={cn('w-2 h-2 rounded-full shrink-0', fc.dot)} />
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{f.name}</p>
                                </div>
                                {f.referenceRange && (
                                  <p className="text-xs text-slate-400 font-medium ml-4 mt-0.5">
                                    Ref: {f.referenceRange}{f.unit ? ` ${f.unit}` : ''}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {f.value}{f.unit && <span className="text-xs font-bold text-slate-400 ml-1">{f.unit}</span>}
                                </span>
                                <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase', fc.bg, fc.text)}>
                                  {fc.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {t.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-1.5 px-1">{t.notes}</p>
                      )}
                    </div>
                  ))}

                  {hasCritical && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        One or more values are critical. Please contact your doctor immediately.
                      </p>
                    </div>
                  )}

                  {order.completedAt && (
                    <p className="text-[10px] text-slate-400 font-bold">
                      Results available since {fmtDate(order.completedAt)}
                    </p>
                  )}
                </div>
              ) : order.status !== 'completed' && order.status !== 'cancelled' ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                  <p className="text-sm font-bold text-slate-500">
                    Your results are being processed. You will be notified when they are ready.
                  </p>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LabResults: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [statusFilter, setStatusFilter] = useState<LabTestStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      listLabOrders({ patient_id: user.id }),
      listStaff({ role: 'DOCTOR' }),
    ]).then(([labOrders, staff]) => {
      labOrders.sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));
      setOrders(labOrders);
      setDoctors(staff);
    }).catch(() => {});
  }, [user]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length,
    completed: orders.filter(o => o.status === 'completed').length,
    critical: orders.filter(o => o.results?.some(t => t.fields?.some(f => f.flag === 'critical'))).length,
  }), [orders]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Lab Results</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Your diagnostic test history and results</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Tests', value: stats.total, icon: FlaskConical, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Critical Alerts', value: stats.critical, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 rounded-md flex items-center gap-4">
            <div className={cn('w-11 h-11 rounded-md flex items-center justify-center shrink-0', s.bg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'ordered', 'collected', 'processing', 'completed', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all',
              statusFilter === s
                ? 'bg-blue-600 text-white '
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-300'
            )}
          >
            {s === 'all' ? 'All' : STATUS_CFG[s].label}
          </button>
        ))}
      </div>

      {/* Critical banner */}
      {stats.critical > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-bold text-red-700 dark:text-red-400">
            You have {stats.critical} test result{stats.critical !== 1 ? 's' : ''} with critical values. Please contact your doctor immediately.
          </p>
        </motion.div>
      )}

      {/* Results list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 rounded-lg text-center">
          <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">
            {orders.length === 0 ? 'No lab tests ordered yet' : 'No tests match this filter'}
          </p>
          {orders.length === 0 && (
            <p className="text-slate-400 text-xs mt-1">
              Lab tests ordered by your doctor will appear here.
            </p>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {filtered.map(order => (
            <ResultCard
              key={order.id}
              order={order}
              doctor={doctors.find(d => d.userId === order.doctorId || d.id === order.doctorId)}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default LabResults;
