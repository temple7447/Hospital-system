import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Activity,
  PlayCircle,
  CheckCheck,
  Building2,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import type { Appointment, AppointmentStatus, Patient, Department } from '../../types';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_START = 8;
const HOUR_END = 18;
const SLOT_HEIGHT = 56; // px per 30-min slot

const DAYS: { key: string; short: string; label: string }[] = [
  { key: 'sunday',    short: 'Sun', label: 'Sunday' },
  { key: 'monday',    short: 'Mon', label: 'Monday' },
  { key: 'tuesday',   short: 'Tue', label: 'Tuesday' },
  { key: 'wednesday', short: 'Wed', label: 'Wednesday' },
  { key: 'thursday',  short: 'Thu', label: 'Thursday' },
  { key: 'friday',    short: 'Fri', label: 'Friday' },
  { key: 'saturday',  short: 'Sat', label: 'Saturday' },
];

const STATUS_CFG: Record<AppointmentStatus, { label: string; border: string; bg: string; text: string }> = {
  scheduled:   { label: 'Scheduled',   border: 'border-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-300' },
  confirmed:   { label: 'Confirmed',   border: 'border-emerald-400',bg: 'bg-emerald-50 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-300' },
  in_progress: { label: 'In Progress', border: 'border-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
  completed:   { label: 'Completed',   border: 'border-slate-300',  bg: 'bg-slate-100 dark:bg-slate-800',    text: 'text-slate-500' },
  cancelled:   { label: 'Cancelled',   border: 'border-red-300',    bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-500' },
  no_show:     { label: 'No Show',     border: 'border-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-700 dark:text-amber-300' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekDates(anchor: Date): Date[] {
  const d = new Date(anchor);
  const day = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(sunday);
    dd.setDate(sunday.getDate() + i);
    return dd;
  });
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ap}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function topOffset(time: string): number {
  const mins = timeToMinutes(time) - HOUR_START * 60;
  return (mins / 30) * SLOT_HEIGHT;
}

function aptHeight(duration: number): number {
  return (duration / 30) * SLOT_HEIGHT;
}

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

// ─── Appointment Block ────────────────────────────────────────────────────────

interface AptBlockProps {
  apt: Appointment;
  patient: Patient | undefined;
  onClick: () => void;
}

const AptBlock: React.FC<AptBlockProps> = ({ apt, patient, onClick }) => {
  const cfg = STATUS_CFG[apt.status];
  const top = topOffset(apt.time);
  const height = Math.max(aptHeight(apt.duration), SLOT_HEIGHT * 0.8);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={cn(
        'absolute left-1 right-1 rounded-xl border-l-4 px-2 py-1 text-left overflow-hidden transition-all hover:brightness-95 hover:scale-[1.01] active:scale-[0.99] z-10',
        cfg.bg, cfg.border,
        apt.status === 'cancelled' && 'opacity-50'
      )}
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      <p className={cn('text-[10px] font-black uppercase tracking-wider leading-none', cfg.text)}>
        {formatTime(apt.time)}
      </p>
      <p className={cn('text-xs font-bold mt-0.5 truncate', cfg.text)}>
        {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'}
      </p>
      {height > 40 && (
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
          {apt.type.replace('_', ' ')}
        </p>
      )}
    </motion.button>
  );
};

// ─── Detail Panel ─────────────────────────────────────────────────────────────

interface DetailPanelProps {
  apt: Appointment | null;
  patients: Patient[];
  departments: { id: string; name: string }[];
  onClose: () => void;
  onStatusChange: (apt: Appointment, status: AppointmentStatus) => void;
  doctorId: string;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ apt, patients, departments, onClose, onStatusChange, doctorId }) => {
  const patient = apt ? patients.find(p => p.id === apt.patientId) : null;
  const dept = apt ? departments.find(d => d.id === apt.departmentId) : null;

  return (
    <AnimatePresence>
      {apt && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-2xl lg:static lg:shadow-none lg:border lg:rounded-3xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white">Appointment Details</h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Patient */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20">
                  {patient ? getInitials(patient.firstName, patient.lastName) : '?'}
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white">
                    {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'}
                  </p>
                  {patient && (
                    <p className="text-xs text-slate-400 font-bold mt-0.5">{patient.patientNumber} · {patient.phone}</p>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className={cn('px-4 py-2 rounded-2xl border-l-4 flex items-center gap-2', STATUS_CFG[apt.status].bg, STATUS_CFG[apt.status].border)}>
                <span className={cn('text-xs font-black uppercase tracking-wider', STATUS_CFG[apt.status].text)}>
                  {STATUS_CFG[apt.status].label}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Date', value: apt.date, icon: Calendar },
                  { label: 'Time', value: formatTime(apt.time), icon: Clock },
                  { label: 'Duration', value: `${apt.duration} min`, icon: Activity },
                  { label: 'Department', value: dept?.name || '—', icon: Building2 },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Icon className="w-3 h-3" /> {label}
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Reason
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{apt.reason}</p>
              </div>

              {apt.cancelledReason && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-1">Cancellation Reason</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{apt.cancelledReason}</p>
                </div>
              )}

              {/* Patient medical info */}
              {patient && (patient.allergies.length > 0 || patient.chronicConditions.length > 0) && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl space-y-2">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Medical Flags</p>
                  {patient.allergies.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold mb-1">Allergies</p>
                      <div className="flex flex-wrap gap-1">
                        {patient.allergies.map(a => (
                          <span key={a} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg text-[10px] font-bold">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {patient.chronicConditions.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold mb-1">Conditions</p>
                      <div className="flex flex-wrap gap-1">
                        {patient.chronicConditions.map(c => (
                          <span key={c} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 rounded-lg text-[10px] font-bold">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status actions */}
            {apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'no_show' && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Update Status</p>
                {apt.status === 'scheduled' && (
                  <button
                    onClick={() => onStatusChange(apt, 'confirmed')}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-black hover:bg-emerald-100 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm Appointment
                  </button>
                )}
                {apt.status === 'confirmed' && (
                  <button
                    onClick={() => onStatusChange(apt, 'in_progress')}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-2xl text-xs font-black hover:bg-violet-100 transition-all"
                  >
                    <PlayCircle className="w-4 h-4" /> Start Consultation
                  </button>
                )}
                {apt.status === 'in_progress' && (
                  <button
                    onClick={() => onStatusChange(apt, 'completed')}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all"
                  >
                    <CheckCheck className="w-4 h-4" /> Complete
                  </button>
                )}
                <button
                  onClick={() => onStatusChange(apt, 'no_show')}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-2xl text-xs font-black hover:bg-amber-100 transition-all"
                >
                  <AlertCircle className="w-4 h-4" /> Mark No Show
                </button>
                <button
                  onClick={() => onStatusChange(apt, 'cancelled')}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl text-xs font-black hover:bg-red-100 transition-all"
                >
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Schedule: React.FC = () => {
  const { user } = useAuth();
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [doctor, setDoctor] = useState<{ workingDays: string[]; workingHours: { start: string; end: string } } | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);
  const today = toDateStr(new Date());

  const loadData = () => {
    if (!user) return;
    const apts = db.appointments.getByDoctor(user.id);
    setAppointments(apts);
    setPatients(db.patients.getAll());
    setDepartments(db.departments.getAll().map(d => ({ id: d.id, name: d.name })));
    const doc = db.staff.getById(user.id);
    if (doc) setDoctor({ workingDays: doc.workingDays, workingHours: doc.workingHours });
  };

  useEffect(() => { loadData(); }, []);

  const weekApts = useMemo(() => {
    const dateSet = new Set(weekDates.map(toDateStr));
    return appointments.filter(a => dateSet.has(a.date));
  }, [appointments, weekDates]);

  const aptsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    weekApts.forEach(a => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [weekApts]);

  // Stats
  const stats = useMemo(() => {
    const todayApts = appointments.filter(a => a.date === today);
    return {
      weekTotal: weekApts.filter(a => a.status !== 'cancelled').length,
      weekCompleted: weekApts.filter(a => a.status === 'completed').length,
      todayTotal: todayApts.filter(a => a.status !== 'cancelled').length,
      todayDone: todayApts.filter(a => a.status === 'completed').length,
    };
  }, [appointments, weekApts, today]);

  const handleStatusChange = (apt: Appointment, newStatus: AppointmentStatus) => {
    db.appointments.update(apt.id, { status: newStatus });
    db.auditLogs.create({
      userId: user!.id,
      action: 'UPDATE',
      resource: 'appointment',
      resourceId: apt.id,
      details: `Status changed to ${newStatus}`,
    });
    loadData();
    if (selectedApt?.id === apt.id) {
      setSelectedApt({ ...apt, status: newStatus });
    }
    toast.success(`Marked as ${STATUS_CFG[newStatus].label}`);
  };

  const hourSlots = Array.from({ length: (HOUR_END - HOUR_START) * 2 }, (_, i) => {
    const totalMins = HOUR_START * 60 + i * 30;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  });

  const totalHeight = hourSlots.length * SLOT_HEIGHT;

  const prevWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  };
  const nextWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  };
  const goToday = () => setWeekAnchor(new Date());

  const weekLabel = (() => {
    const first = weekDates[0];
    const last = weekDates[6];
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (first.getFullYear() !== last.getFullYear()) {
      return `${first.toLocaleDateString('en-US', { ...opts, year: 'numeric' })} – ${last.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
    }
    if (first.getMonth() !== last.getMonth()) {
      return `${first.toLocaleDateString('en-US', opts)} – ${last.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
    }
    return `${first.toLocaleDateString('en-US', opts)} – ${last.getDate()}, ${last.getFullYear()}`;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Schedule</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Weekly appointment calendar</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goToday}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
          >
            Today
          </button>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1">
            <button onClick={prevWeek} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="px-3 text-sm font-black text-slate-900 dark:text-white min-w-[180px] text-center">{weekLabel}</span>
            <button onClick={nextWeek} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'This Week', value: stats.weekTotal, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Calendar },
          { label: 'Completed', value: stats.weekCompleted, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCheck },
          { label: "Today's", value: stats.todayTotal, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', icon: Clock },
          { label: "Today Done", value: stats.todayDone, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.bg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className={cn('flex gap-6', selectedApt ? 'lg:pr-[340px]' : '')}>
        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 glass-card rounded-3xl overflow-hidden"
        >
          {/* Day headers */}
          <div className="grid border-b border-slate-200 dark:border-slate-800" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
            <div className="h-14 border-r border-slate-200 dark:border-slate-800" />
            {weekDates.map((date, i) => {
              const dateStr = toDateStr(date);
              const isToday = dateStr === today;
              const dayApts = (aptsByDate[dateStr] || []).filter(a => a.status !== 'cancelled');
              const isWorking = doctor?.workingDays.includes(DAYS[i].key);
              return (
                <div
                  key={i}
                  className={cn(
                    'h-14 flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-800 last:border-r-0',
                    isToday ? 'bg-blue-600' : isWorking ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'
                  )}
                >
                  <p className={cn('text-[10px] font-black uppercase tracking-wider', isToday ? 'text-blue-200' : 'text-slate-400')}>
                    {DAYS[i].short}
                  </p>
                  <p className={cn('text-lg font-black', isToday ? 'text-white' : 'text-slate-900 dark:text-white')}>
                    {date.getDate()}
                  </p>
                  {dayApts.length > 0 && (
                    <div className={cn('w-1.5 h-1.5 rounded-full mt-0.5', isToday ? 'bg-blue-200' : 'bg-blue-600')} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
            <div className="relative" style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', minHeight: `${totalHeight}px` }}>
              {/* Time labels */}
              <div className="border-r border-slate-200 dark:border-slate-800">
                {hourSlots.map((slot, i) => (
                  i % 2 === 0 && (
                    <div key={slot} className="absolute flex items-start pt-1 pr-2 w-14" style={{ top: `${i * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT * 2}px` }}>
                      <span className="text-[10px] font-black text-slate-400 ml-auto">{formatTime(slot)}</span>
                    </div>
                  )
                ))}
              </div>

              {/* Day columns */}
              {weekDates.map((date, colIdx) => {
                const dateStr = toDateStr(date);
                const dayApts = aptsByDate[dateStr] || [];
                const isToday = dateStr === today;
                const isWorking = doctor?.workingDays.includes(DAYS[colIdx].key);
                const workStart = doctor ? timeToMinutes(doctor.workingHours.start) - HOUR_START * 60 : 0;
                const workEnd = doctor ? timeToMinutes(doctor.workingHours.end) - HOUR_START * 60 : 0;

                return (
                  <div
                    key={colIdx}
                    className={cn(
                      'relative border-r border-slate-200 dark:border-slate-800 last:border-r-0',
                      !isWorking && 'bg-slate-50/50 dark:bg-slate-800/20'
                    )}
                    style={{ height: `${totalHeight}px` }}
                  >
                    {/* Working hours highlight */}
                    {isWorking && doctor && (
                      <div
                        className="absolute left-0 right-0 bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-blue-200 dark:border-blue-800"
                        style={{
                          top: `${(workStart / 30) * SLOT_HEIGHT}px`,
                          height: `${((workEnd - workStart) / 30) * SLOT_HEIGHT}px`,
                        }}
                      />
                    )}

                    {/* Hour lines */}
                    {hourSlots.map((_, i) => (
                      <div
                        key={i}
                        className={cn('absolute left-0 right-0 border-t', i % 2 === 0 ? 'border-slate-200 dark:border-slate-800' : 'border-slate-100 dark:border-slate-800/50')}
                        style={{ top: `${i * SLOT_HEIGHT}px` }}
                      />
                    ))}

                    {/* Today line */}
                    {isToday && (() => {
                      const now = new Date();
                      const nowMins = now.getHours() * 60 + now.getMinutes() - HOUR_START * 60;
                      if (nowMins < 0 || nowMins > (HOUR_END - HOUR_START) * 60) return null;
                      return (
                        <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: `${(nowMins / 30) * SLOT_HEIGHT}px` }}>
                          <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                          <div className="flex-1 h-px bg-red-500" />
                        </div>
                      );
                    })()}

                    {/* Appointment blocks */}
                    {dayApts.map(apt => (
                      <AptBlock
                        key={apt.id}
                        apt={apt}
                        patient={patients.find(p => p.id === apt.patientId)}
                        onClick={() => setSelectedApt(apt)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Detail Panel */}
        <DetailPanel
          apt={selectedApt}
          patients={patients}
          departments={departments}
          onClose={() => setSelectedApt(null)}
          onStatusChange={handleStatusChange}
          doctorId={user?.id || ''}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {(Object.entries(STATUS_CFG) as [AppointmentStatus, typeof STATUS_CFG[AppointmentStatus]][])
          .filter(([, cfg]) => cfg.label !== 'No Show')
          .map(([status, cfg]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full border-2', cfg.border.replace('border-', 'border-'))} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{cfg.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Current Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Working Hours</span>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
