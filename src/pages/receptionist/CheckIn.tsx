import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UserPlus, CheckCircle2, Loader2, X, Clock,
  User, Calendar, AlertCircle, Printer, Users,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import type { Patient, Appointment, Staff, QueueEntry } from '@/types';

type Priority = 'normal' | 'urgent' | 'emergency';

const PRIORITY_CFG: Record<Priority, { label: string; cls: string }> = {
  normal:    { label: 'Normal',    cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600' },
  urgent:    { label: 'Urgent',    cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
  emergency: { label: 'Emergency', cls: 'bg-red-50 dark:bg-red-900/20 text-red-600' },
};

const TokenCard: React.FC<{ entry: QueueEntry; patient: Patient | undefined; onClose: () => void }> = ({ entry, patient, onClose }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
    className="glass-card rounded-3xl p-8 text-center border-2 border-blue-200 dark:border-blue-800 relative">
    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
      <X className="w-4 h-4 text-slate-400" />
    </button>
    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">Token Issued</h3>
    <p className="text-6xl font-black text-blue-600 my-3">{entry.tokenNumber}</p>
    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
      {patient ? `${patient.firstName} ${patient.lastName}` : '—'}
    </p>
    <p className="text-xs text-slate-400 font-bold">
      Est. wait: ~{entry.estimatedWait} min · Priority: {entry.priority}
    </p>
    <button onClick={() => window.print()}
      className="mt-5 flex items-center gap-2 mx-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">
      <Printer className="w-3.5 h-3.5" /> Print Token
    </button>
  </motion.div>
);

const CheckIn: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients]     = useState<Patient[]>([]);
  const [doctors, setDoctors]       = useState<Staff[]>([]);
  const [todayApts, setTodayApts]   = useState<Appointment[]>([]);
  const [queue, setQueue]           = useState<QueueEntry[]>([]);

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedApt, setSelectedApt]     = useState<string>('walkin');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [priority, setPriority]     = useState<Priority>('normal');
  const [estWait, setEstWait]       = useState(15);
  const [submitting, setSubmitting] = useState(false);
  const [issuedEntry, setIssuedEntry] = useState<QueueEntry | null>(null);

  const load = () => {
    setPatients(db.patients.getAll());
    setDoctors(db.staff.getDoctors());
    setTodayApts(db.appointments.getToday());
    setQueue(db.queue.getAll().filter(q =>
      q.status === 'waiting' || q.status === 'called' || q.status === 'in_progress'));
  };

  useEffect(() => { load(); }, []);

  const searchResults = useMemo(() => {
    if (!patientSearch.trim() || selectedPatient) return [];
    const t = patientSearch.toLowerCase();
    return patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(t) ||
      p.patientNumber.toLowerCase().includes(t) ||
      p.phone.includes(t),
    ).slice(0, 6);
  }, [patients, patientSearch, selectedPatient]);

  const patientApts = useMemo(() =>
    selectedPatient
      ? todayApts.filter(a => a.patientId === selectedPatient.id && (a.status === 'scheduled' || a.status === 'confirmed'))
      : [],
    [selectedPatient, todayApts]);

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setPatientSearch(`${p.firstName} ${p.lastName}`);
    setSelectedApt('walkin');
  };

  const handleSubmit = () => {
    if (!selectedPatient) { toast.error('Select a patient first'); return; }
    const doctorId = selectedApt !== 'walkin'
      ? (todayApts.find(a => a.id === selectedApt)?.doctorId ?? selectedDoctor)
      : selectedDoctor;
    if (!doctorId) { toast.error('Select a doctor'); return; }

    setSubmitting(true);
    setTimeout(() => {
      const entry = db.queue.add({
        patientId:     selectedPatient.id,
        doctorId,
        appointmentId: selectedApt !== 'walkin' ? selectedApt : undefined,
        priority,
        estimatedWait: estWait,
      });

      db.notifications.create({
        userId:    selectedPatient.id,
        title:     'Check-In Confirmed',
        message:   `Your token is ${entry.tokenNumber}. Estimated wait: ~${estWait} minutes.`,
        type:      'appointment',
        relatedId: entry.id,
      });

      if (selectedApt !== 'walkin') {
        db.appointments.update(selectedApt, { status: 'in_progress' });
      }

      db.auditLogs.create({
        userId: user!.id, userRole: user!.role,
        action: 'CREATE', resource: 'queue_entry', resourceId: entry.id,
        details: `Checked in ${selectedPatient.firstName} ${selectedPatient.lastName} — token ${entry.tokenNumber}`,
      });

      setIssuedEntry(entry);
      setSubmitting(false);
      setSelectedPatient(null);
      setPatientSearch('');
      setSelectedApt('walkin');
      setSelectedDoctor('');
      setPriority('normal');
      setEstWait(15);
      load();
      toast.success(`Token ${entry.tokenNumber} issued`);
    }, 400);
  };

  const activeQueue = [...queue].sort((a, b) => a.checkedInAt.localeCompare(b.checkedInAt));

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Patient Check-In</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Register arrivals and issue queue tokens
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {issuedEntry && (
              <TokenCard
                entry={issuedEntry}
                patient={patients.find(p => p.id === issuedEntry.patientId)}
                onClose={() => setIssuedEntry(null)}
              />
            )}
          </AnimatePresence>

          {/* Patient Search */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Patient
            </h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={patientSearch}
                onChange={e => { setPatientSearch(e.target.value); if (!e.target.value) setSelectedPatient(null); }}
                placeholder="Search by name, number, or phone…"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>

            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  {searchResults.map(p => (
                    <button key={p.id} onClick={() => handleSelectPatient(p)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-slate-400 font-bold">{p.patientNumber} · {p.phone}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {selectedPatient && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-blue-700 dark:text-blue-300">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                  <p className="text-xs text-blue-500 font-bold">{selectedPatient.patientNumber}</p>
                </div>
                <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all">
                  <X className="w-3.5 h-3.5 text-blue-500" />
                </button>
              </div>
            )}
          </motion.div>

          {/* Appointment / Walk-in */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Visit Type
            </h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appointment</label>
              <select value={selectedApt} onChange={e => setSelectedApt(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none cursor-pointer">
                <option value="walkin">Walk-in (no appointment)</option>
                {patientApts.map(a => (
                  <option key={a.id} value={a.id}>{a.time} — {a.type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            {selectedApt === 'walkin' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Doctor</label>
                <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none cursor-pointer">
                  <option value="">Select doctor…</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName}{d.specialization ? ` — ${d.specialization}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </motion.div>

          {/* Priority + Wait */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card p-6 rounded-3xl space-y-5">
            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" /> Priority & Wait
            </h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Level</label>
              <div className="flex gap-2">
                {(Object.keys(PRIORITY_CFG) as Priority[]).map(p => (
                  <button key={p} onClick={() => setPriority(p)}
                    className={cn('flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                      priority === p
                        ? PRIORITY_CFG[p].cls + ' ring-2 ring-offset-1 ring-current'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200')}>
                    {PRIORITY_CFG[p].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Wait</label>
                <span className="text-sm font-black text-slate-900 dark:text-white">~{estWait} min</span>
              </div>
              <input type="range" min={5} max={120} step={5} value={estWait}
                onChange={e => setEstWait(Number(e.target.value))}
                className="w-full accent-blue-600" />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>5 min</span><span>1 hour</span><span>2 hours</span>
              </div>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <button onClick={handleSubmit} disabled={submitting || !selectedPatient}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                : <><UserPlus className="w-4 h-4" /> Issue Queue Token</>}
            </button>
          </motion.div>
        </div>

        {/* Active Queue Sidebar */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Active Queue</h3>
            <span className="ml-auto px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-black">
              {activeQueue.length}
            </span>
          </div>
          {activeQueue.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center">
              <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-bold">Queue is empty</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
              {activeQueue.map(entry => {
                const p = patients.find(pt => pt.id === entry.patientId);
                return (
                  <div key={entry.id} className="glass-card rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-lg font-black text-slate-900 dark:text-white w-12 shrink-0">
                      {entry.tokenNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {p ? `${p.firstName} ${p.lastName}` : '—'}
                      </p>
                      <p className={cn('text-[10px] font-black uppercase',
                        entry.priority === 'emergency' ? 'text-red-500' :
                        entry.priority === 'urgent'    ? 'text-amber-500' : 'text-slate-400')}>
                        {entry.priority}
                      </p>
                    </div>
                    <span className={cn('text-[10px] font-black uppercase px-2 py-0.5 rounded-lg',
                      entry.status === 'waiting'     ? 'bg-amber-50 text-amber-600' :
                      entry.status === 'called'      ? 'bg-blue-50 text-blue-600' :
                      'bg-emerald-50 text-emerald-600')}>
                      {entry.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CheckIn;
