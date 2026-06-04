import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock,
  User, Calendar, FileText, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { listPrescriptions, listStaff } from '@/lib/services';
import type { Prescription, PrescriptionStatus, Staff } from '@/types';

const STATUS_CFG: Record<PrescriptionStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  active:    { label: 'Active',    bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', icon: CheckCircle2 },
  completed: { label: 'Completed', bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-500',   icon: Clock },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-500',     icon: XCircle },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isExpired(rx: Prescription) {
  return rx.status === 'active' && rx.expiresAt < new Date().toISOString().split('T')[0];
}

function daysLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

interface RxCardProps {
  rx: Prescription;
  doctor: Staff | undefined;
  expanded: boolean;
  onToggle: () => void;
}

const RxCard: React.FC<RxCardProps> = ({ rx, doctor, expanded, onToggle }) => {
  const expired = isExpired(rx);
  const effectiveStatus: PrescriptionStatus = expired ? 'completed' : rx.status;
  const cfg = STATUS_CFG[effectiveStatus];
  const days = rx.status === 'active' && !expired ? daysLeft(rx.expiresAt) : null;
  const expiringSoon = days !== null && days <= 7;

  return (
    <div className={cn(
      'glass-card rounded-3xl overflow-hidden',
      rx.status === 'active' && !expired ? 'ring-2 ring-emerald-400/30' : '',
      expiringSoon ? 'ring-2 ring-amber-400/40' : '',
    )}>
      <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all" onClick={onToggle}>
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
            rx.status === 'active' && !expired ? 'bg-emerald-50 dark:bg-emerald-900/20' : cfg.bg)}>
            <Pill className={cn('w-5 h-5', rx.status === 'active' && !expired ? 'text-emerald-600' : cfg.text)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-slate-900 dark:text-white">{rx.prescriptionNumber}</p>
              <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase', cfg.bg, cfg.text)}>
                {expired ? 'Expired' : cfg.label}
              </span>
              {expiringSoon && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" /> {days}d left
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-bold truncate mt-0.5">
              {rx.items.length} medicine{rx.items.length !== 1 ? 's' : ''}
              {doctor && ` · Dr. ${doctor.firstName} ${doctor.lastName}`}
              {' · '}{fmtDate(rx.createdAt)}
            </p>
          </div>
        </div>
        <div className="shrink-0 ml-2">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">

              {/* Diagnosis */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-start gap-2">
                <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Diagnosis</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{rx.diagnosis}</p>
                </div>
              </div>

              {/* Medicines */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicines</p>
                {rx.items.map((item, i) => (
                  <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                        <Pill className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <p className="font-black text-slate-900 dark:text-white text-sm">{item.medicine}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pl-9">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Dosage</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{item.dosage}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Frequency</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{item.frequency}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Duration</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{item.duration}</p>
                      </div>
                    </div>
                    {item.instructions && (
                      <p className="text-xs text-slate-400 italic pl-9">{item.instructions}</p>
                    )}
                  </div>
                ))}
              </div>

              {rx.notes && (
                <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl">{rx.notes}</p>
              )}

              {/* Footer info */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold pt-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown doctor'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Expires {fmtDate(rx.expiresAt)}
                </div>
              </div>

              {expiringSoon && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    This prescription expires in {days} day{days !== 1 ? 's' : ''}. Contact your doctor for a renewal if needed.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Prescriptions: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      listPrescriptions({ patient_id: user.id }),
      listStaff({ role: 'DOCTOR' }),
    ]).then(([rxs, staff]) => {
      rxs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setPrescriptions(rxs);
      setDoctors(staff);
    }).catch(() => {});
  }, [user]);

  const stats = useMemo(() => ({
    active: prescriptions.filter(rx => rx.status === 'active' && !isExpired(rx)).length,
    expiringSoon: prescriptions.filter(rx => rx.status === 'active' && !isExpired(rx) && daysLeft(rx.expiresAt) <= 7).length,
    total: prescriptions.length,
  }), [prescriptions]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return prescriptions;
    return prescriptions.filter(rx => rx.status === statusFilter);
  }, [prescriptions, statusFilter]);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Prescriptions</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {stats.active} active · {stats.total} total
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active',        value: stats.active,        icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Expiring Soon', value: stats.expiringSoon,  icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Total',         value: stats.total,         icon: Pill,          color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', s.bg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'completed', 'cancelled'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn('px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
              statusFilter === s
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-300')}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center">
          <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">
            {prescriptions.length === 0 ? 'No prescriptions yet' : 'No prescriptions match this filter'}
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-3">
          {filtered.map(rx => (
            <RxCard
              key={rx.id}
              rx={rx}
              doctor={doctors.find(d => d.id === rx.doctorId)}
              expanded={expandedId === rx.id}
              onToggle={() => setExpandedId(expandedId === rx.id ? null : rx.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Prescriptions;
