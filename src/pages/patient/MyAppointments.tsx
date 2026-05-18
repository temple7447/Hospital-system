import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, Building2, CheckCircle2, XCircle,
  AlertCircle, Loader2, X, ChevronDown, ChevronUp, Plus,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import type { Appointment, AppointmentStatus, Staff, Department } from '@/types';
import { toast } from 'sonner';

const STATUS_CFG: Record<AppointmentStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  scheduled:   { label: 'Scheduled',   bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-600',    icon: Calendar },
  confirmed:   { label: 'Confirmed',   bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-600', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-600',   icon: Clock },
  completed:   { label: 'Completed',   bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-500',   icon: CheckCircle2 },
  cancelled:   { label: 'Cancelled',   bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-500',     icon: XCircle },
  no_show:     { label: 'No Show',     bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-400',   icon: AlertCircle },
};

const TYPE_LABELS: Record<string, string> = {
  consultation: 'Consultation', check_up: 'Check-up', follow_up: 'Follow-up',
  emergency: 'Emergency', procedure: 'Procedure',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────

interface CancelModalProps {
  apt: Appointment | null;
  onClose: () => void;
  onCancelled: () => void;
  userId: string;
}

const CancelModal: React.FC<CancelModalProps> = ({ apt, onClose, onCancelled, userId }) => {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (apt) setReason(''); }, [apt]);

  if (!apt) return null;

  const handleCancel = () => {
    setSaving(true);
    db.appointments.cancel(apt.id, reason || 'Cancelled by patient');
    db.notifications.create({
      userId,
      title: 'Appointment Cancelled',
      message: `Your appointment on ${fmtDate(apt.date)} at ${apt.time} has been cancelled.`,
      type: 'appointment',
      relatedId: apt.id,
    });
    setTimeout(() => {
      setSaving(false); onCancelled(); onClose();
      toast.success('Appointment cancelled');
    }, 400);
  };

  return (
    <AnimatePresence>
      {apt && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !saving && onClose()}>
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white">Cancel Appointment</h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{apt.appointmentNumber}</p>
                <p className="font-black text-slate-900 dark:text-white mt-1">{fmtDate(apt.date)} · {apt.time}</p>
                <p className="text-xs text-slate-400 font-bold mt-0.5">{TYPE_LABELS[apt.type] ?? apt.type}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason (optional)</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                  placeholder="Let us know why you're cancelling…"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none resize-none font-medium" />
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} disabled={saving}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Keep It
                </button>
                <button onClick={handleCancel} disabled={saving}
                  className="flex-2 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelling…</> : 'Cancel Appointment'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Appointment Card ─────────────────────────────────────────────────────────

interface AptCardProps {
  apt: Appointment;
  doctor: Staff | undefined;
  dept: Department | undefined;
  onCancel: (apt: Appointment) => void;
  expanded: boolean;
  onToggle: () => void;
}

const AptCard: React.FC<AptCardProps> = ({ apt, doctor, dept, onCancel, expanded, onToggle }) => {
  const cfg = STATUS_CFG[apt.status];
  const isCancellable = apt.status === 'scheduled' || apt.status === 'confirmed';
  const isPast = apt.date < new Date().toISOString().split('T')[0];

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all" onClick={onToggle}>
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', cfg.bg)}>
            <cfg.icon className={cn('w-5 h-5', cfg.text)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-slate-900 dark:text-white">{fmtDate(apt.date)}</span>
              <span className="text-xs font-bold text-slate-400">{apt.time}</span>
              <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase', cfg.bg, cfg.text)}>
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-bold truncate mt-0.5">
              {TYPE_LABELS[apt.type] ?? apt.type}
              {doctor && ` · Dr. ${doctor.firstName} ${doctor.lastName}`}
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
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-0.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" /> Doctor
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : '—'}
                  </p>
                  {doctor?.specialization && <p className="text-[10px] text-slate-400 font-medium">{doctor.specialization}</p>}
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-0.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Department
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{dept?.name ?? '—'}</p>
                </div>
              </div>

              {apt.notes && (
                <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl">{apt.notes}</p>
              )}
              {apt.cancelledReason && (
                <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
                  Cancelled: {apt.cancelledReason}
                </p>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span>{apt.appointmentNumber}</span>
                {isPast && apt.status === 'completed' && (
                  <span className="text-emerald-600">Visit completed</span>
                )}
              </div>

              {isCancellable && (
                <button onClick={() => onCancel(apt)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                  <XCircle className="w-4 h-4" /> Cancel Appointment
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const MyAppointments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    if (user) {
      setAppointments(db.appointments.getByPatient(user.id).sort((a, b) => b.date.localeCompare(a.date)));
      setDoctors(db.staff.getDoctors());
      setDepts(db.departments.getAll());
    }
  };

  useEffect(() => { load(); }, [user]);

  const today = new Date().toISOString().split('T')[0];

  const upcoming = useMemo(() =>
    appointments.filter(a => a.date >= today && a.status !== 'cancelled' && a.status !== 'no_show')
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [appointments, today]);

  const past = useMemo(() =>
    appointments.filter(a => a.date < today || a.status === 'cancelled' || a.status === 'no_show' || a.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date)),
    [appointments, today]);

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-8">
      <CancelModal apt={cancelTarget} onClose={() => setCancelTarget(null)} onCancelled={load} userId={user!.id} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Appointments</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <button onClick={() => navigate('/patient/book')}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 self-start">
          <Plus className="w-4 h-4" /> Book New
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1 w-fit">
        {(['upcoming', 'past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
              tab === t ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500')}>
            {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">
            {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </p>
          {tab === 'upcoming' && (
            <button onClick={() => navigate('/patient/book')}
              className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
              Book an Appointment
            </button>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {list.map(apt => (
            <AptCard
              key={apt.id}
              apt={apt}
              doctor={doctors.find(d => d.id === apt.doctorId)}
              dept={depts.find(d => d.id === apt.departmentId)}
              onCancel={setCancelTarget}
              expanded={expandedId === apt.id}
              onToggle={() => setExpandedId(expandedId === apt.id ? null : apt.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default MyAppointments;
