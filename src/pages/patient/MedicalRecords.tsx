import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill,
  Activity,
  FileText,
  Calendar,
  Heart,
  Thermometer,
  Droplets,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import type { Prescription, ConsultationNote, VitalRecord, Appointment, Staff, Department } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const TABS = [
  { id: 'overview',      label: 'Overview',     icon: Activity },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'visits',        label: 'Visit History', icon: Calendar },
  { id: 'notes',         label: 'Doctor Notes',  icon: FileText },
];

const RX_STATUS_CFG = {
  active:    { label: 'Active',    bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
  completed: { label: 'Completed', bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-500' },
};

const APT_STATUS_CFG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  completed:   { label: 'Completed',   icon: CheckCircle2, color: 'text-emerald-600' },
  cancelled:   { label: 'Cancelled',   icon: XCircle,      color: 'text-red-500' },
  scheduled:   { label: 'Scheduled',   icon: Clock,        color: 'text-blue-600' },
  confirmed:   { label: 'Confirmed',   icon: CheckCircle2, color: 'text-emerald-600' },
  in_progress: { label: 'In Progress', icon: Activity,     color: 'text-violet-600' },
  no_show:     { label: 'No Show',     icon: XCircle,      color: 'text-amber-500' },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const MedicalRecords: React.FC = () => {
  const { user } = useAuth();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [notes, setNotes] = useState<ConsultationNote[]>([]);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [activeTab, setActiveTab] = useState('overview');
  const [expandedRxId, setExpandedRxId] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const rxs = db.prescriptions.getByPatient(user.id);
    rxs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setPrescriptions(rxs);

    const ns = db.consultationNotes.getByPatient(user.id);
    setNotes(ns);

    const vs = db.vitals.getByPatient(user.id);
    setVitals(vs);

    const apts = db.appointments.getByPatient(user.id);
    apts.sort((a, b) => b.date.localeCompare(a.date));
    setAppointments(apts);

    setStaff(db.staff.getAll());
    setDepartments(db.departments.getAll());
  }, [user]);

  const latestVitals = vitals[0] ?? null;

  const chartData = useMemo(() =>
    [...vitals].reverse().slice(-8).map(v => ({
      date: new Date(v.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      systolic:  v.bloodPressureSystolic,
      diastolic: v.bloodPressureDiastolic,
      heartRate: v.heartRate,
    })),
    [vitals]
  );

  const stats = useMemo(() => ({
    totalVisits:      appointments.filter(a => a.status === 'completed').length,
    activeRx:         prescriptions.filter(p => p.status === 'active').length,
    totalPrescriptions: prescriptions.length,
    totalNotes:       notes.length,
  }), [appointments, prescriptions, notes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Medical Records</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Your complete health history</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Visits', value: stats.totalVisits, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Active Rx', value: stats.activeRx, icon: Pill, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'All Prescriptions', value: stats.totalPrescriptions, icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
          { label: 'Doctor Notes', value: stats.totalNotes, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl flex items-center gap-4">
            <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', s.bg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap',
              activeTab === t.id ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Latest vitals */}
            {latestVitals ? (
              <div className="glass-card p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Latest Vitals</h3>
                  <p className="text-xs text-slate-400 font-bold">{fmtDate(latestVitals.recordedAt)}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: Heart, label: 'Blood Pressure', value: `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}`, unit: 'mmHg', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
                    { icon: Activity, label: 'Heart Rate', value: latestVitals.heartRate, unit: 'bpm', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { icon: Thermometer, label: 'Temperature', value: latestVitals.temperature, unit: '°C', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { icon: Droplets, label: 'O₂ Saturation', value: `${latestVitals.oxygenSaturation}%`, unit: '', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
                  ].map(v => (
                    <div key={v.label} className={cn('p-4 rounded-2xl text-center', v.bg)}>
                      <v.icon className={cn('w-5 h-5 mx-auto mb-2', v.color)} />
                      <p className={cn('text-lg font-black', v.color)}>{v.value}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{v.label}</p>
                      {v.unit && <p className="text-[9px] text-slate-300 dark:text-slate-600 font-bold">{v.unit}</p>}
                    </div>
                  ))}
                </div>

                {vitals.length >= 2 && (
                  <div className="mt-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">BP & Heart Rate Trend</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700 }} />
                        <YAxis tick={{ fontSize: 9, fontWeight: 700 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 11 }} />
                        <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="heartRate" name="Heart Rate" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card p-8 rounded-3xl text-center">
                <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">No vitals recorded yet</p>
                <p className="text-xs text-slate-400 mt-1">Your doctor will record these during your visit</p>
              </div>
            )}

            {/* Active prescriptions */}
            {prescriptions.filter(p => p.status === 'active').length > 0 && (
              <div className="glass-card p-6 rounded-3xl">
                <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4">Active Prescriptions</h3>
                <div className="space-y-3">
                  {prescriptions.filter(p => p.status === 'active').map(rx => {
                    const doc = staff.find(s => s.id === rx.doctorId);
                    return (
                      <div key={rx.id} className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{rx.prescriptionNumber}</p>
                          <p className="text-[10px] text-slate-400 font-bold">Expires {fmtDate(rx.expiresAt)}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{rx.diagnosis}</p>
                        <p className="text-xs text-slate-500 mt-1">{rx.items.map(i => i.medicine).join(', ')}</p>
                        {doc && <p className="text-[10px] text-slate-400 mt-1">Dr. {doc.firstName} {doc.lastName}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming appointments */}
            {appointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length > 0 && (
              <div className="glass-card p-6 rounded-3xl">
                <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4">Upcoming Appointments</h3>
                <div className="space-y-3">
                  {appointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).slice(0, 3).map(apt => {
                    const doc = staff.find(s => s.id === apt.doctorId);
                    const dept = departments.find(d => d.id === apt.departmentId);
                    return (
                      <div key={apt.id} className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex flex-col items-center justify-center text-white shrink-0">
                          <p className="text-[10px] font-black leading-none">{new Date(apt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</p>
                          <p className="text-lg font-black leading-none">{new Date(apt.date + 'T00:00:00').getDate()}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{doc ? `Dr. ${doc.firstName} ${doc.lastName}` : '—'}</p>
                          <p className="text-xs text-slate-400 font-bold">{dept?.name} · {fmtTime(apt.time)} · {apt.type.replace('_', ' ')}</p>
                        </div>
                        <span className={cn('px-2 py-1 rounded-lg text-[10px] font-black uppercase', apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20')}>
                          {apt.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── PRESCRIPTIONS ────────────────────────────────────────────────── */}
        {activeTab === 'prescriptions' && (
          <motion.div key="prescriptions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {prescriptions.length === 0 ? (
              <div className="glass-card p-16 rounded-3xl text-center">
                <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">No prescriptions yet</p>
              </div>
            ) : (
              prescriptions.map(rx => {
                const doc = staff.find(s => s.id === rx.doctorId);
                const cfg = RX_STATUS_CFG[rx.status];
                const expanded = expandedRxId === rx.id;
                return (
                  <div key={rx.id} className="glass-card rounded-3xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all"
                      onClick={() => setExpandedRxId(expanded ? null : rx.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider', cfg.bg, cfg.text)}>
                          {cfg.label}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{rx.prescriptionNumber} — {rx.diagnosis}</p>
                          <p className="text-xs text-slate-400 font-bold">
                            {fmtDate(rx.createdAt)} · {rx.items.length} medicine{rx.items.length !== 1 ? 's' : ''}
                            {doc ? ` · Dr. ${doc.firstName} ${doc.lastName}` : ''}
                          </p>
                        </div>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                    </button>

                    <AnimatePresence>
                      {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Issued</p>
                                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{fmtDate(rx.createdAt)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Expires</p>
                                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{fmtDate(rx.expiresAt)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Doctor</p>
                                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{doc ? `Dr. ${doc.firstName} ${doc.lastName}` : '—'}</p>
                              </div>
                            </div>

                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Medicines</p>
                              <div className="space-y-2">
                                {rx.items.map((item, i) => (
                                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <p className="text-sm font-black text-slate-900 dark:text-white">{item.medicine} — {item.dosage}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{item.frequency} for {item.duration}</p>
                                    {item.instructions && (
                                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium italic">{item.instructions}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {rx.notes && (
                              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Notes</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{rx.notes}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ─── VISITS ───────────────────────────────────────────────────────── */}
        {activeTab === 'visits' && (
          <motion.div key="visits" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {appointments.length === 0 ? (
              <div className="glass-card p-16 rounded-3xl text-center">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">No visits yet</p>
              </div>
            ) : (
              appointments.map((apt, idx) => {
                const doc = staff.find(s => s.id === apt.doctorId);
                const dept = departments.find(d => d.id === apt.departmentId);
                const cfg = APT_STATUS_CFG[apt.status] ?? APT_STATUS_CFG.scheduled;
                return (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={cn('glass-card p-5 rounded-3xl flex items-start gap-4', apt.status === 'cancelled' && 'opacity-60')}
                  >
                    <div className={cn('w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 shadow-md', apt.status === 'completed' ? 'bg-emerald-500' : apt.status === 'cancelled' ? 'bg-slate-400' : 'bg-blue-600')}>
                      <p className="text-[9px] font-black leading-none">{new Date(apt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</p>
                      <p className="text-lg font-black leading-none">{new Date(apt.date + 'T00:00:00').getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-slate-900 dark:text-white text-sm">{apt.type.replace('_', ' ')}</p>
                        <span className={cn('flex items-center gap-1 text-[10px] font-black uppercase tracking-wider', cfg.color)}>
                          <cfg.icon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {doc && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                            <User className="w-3 h-3" /> Dr. {doc.firstName} {doc.lastName}
                          </span>
                        )}
                        {dept && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                            <Building2 className="w-3 h-3" /> {dept.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                          <Clock className="w-3 h-3" /> {fmtTime(apt.time)}
                        </span>
                      </div>
                      {apt.reason && <p className="text-xs text-slate-500 mt-1.5 italic">{apt.reason}</p>}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ─── NOTES ────────────────────────────────────────────────────────── */}
        {activeTab === 'notes' && (
          <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {notes.length === 0 ? (
              <div className="glass-card p-16 rounded-3xl text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">No doctor notes yet</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    These are clinical notes recorded by your doctor. They are provided for your reference.
                  </p>
                </div>

                {notes.map(note => {
                  const doc = staff.find(s => s.id === note.doctorId);
                  const expanded = expandedNoteId === note.id;
                  return (
                    <div key={note.id} className="glass-card rounded-3xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all"
                        onClick={() => setExpandedNoteId(expanded ? null : note.id)}
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{fmtDate(note.createdAt)}</p>
                            <p className="text-xs text-slate-400 font-bold">
                              {doc ? `Dr. ${doc.firstName} ${doc.lastName}` : '—'}
                            </p>
                          </div>
                        </div>
                        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      <AnimatePresence>
                        {expanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                              {[
                                { label: 'Assessment', value: note.assessment, color: 'border-amber-400' },
                                { label: 'Plan', value: note.plan, color: 'border-violet-400' },
                              ].filter(s => s.value).map(({ label, value, color }) => (
                                <div key={label} className={cn('p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4', color)}>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">{value}</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicalRecords;
