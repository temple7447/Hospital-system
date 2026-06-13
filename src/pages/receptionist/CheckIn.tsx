import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, UserPlus, CheckCircle2, Loader2, X, Clock,
  User, AlertCircle, Printer, Users, Calendar,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  listPatients, listStaff, listAppointments,
  listQueue, createQueueEntry, updateAppointment,
} from '@/lib/services';
import { ROLE_MAP } from '@/lib/mappers';
import { toast } from 'sonner';
import type { Patient, Appointment, Staff, QueueEntry } from '@/types';

type Priority = 'normal' | 'urgent' | 'emergency';

const PRIORITY_CFG: Record<Priority, { label: string; active: string; idle: string }> = {
  normal:    { label: 'Normal',    active: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200',  idle: 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700' },
  urgent:    { label: 'Urgent',    active: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700',                  idle: 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700' },
  emergency: { label: 'Emergency', active: 'bg-red-100 dark:bg-red-900/30 text-red-700',                        idle: 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700' },
};

const STATUS_DOT: Record<string, string> = {
  waiting:     'bg-amber-400',
  called:      'bg-blue-400',
  in_progress: 'bg-emerald-400',
};
const STATUS_LABEL: Record<string, string> = {
  waiting:     'Waiting',
  called:      'Called',
  in_progress: 'In progress',
};

const CheckIn: React.FC = () => {
  const [patients, setPatients]   = useState<Patient[]>([]);
  const [doctors, setDoctors]     = useState<Staff[]>([]);
  const [todayApts, setTodayApts] = useState<Appointment[]>([]);
  const [queue, setQueue]         = useState<QueueEntry[]>([]);

  const [patientSearch, setPSearch]       = useState('');
  const [selectedPatient, setSelPatient]  = useState<Patient | null>(null);
  const [selectedApt, setSelApt]          = useState<string>('walkin');
  const [selectedDoctor, setSelDoctor]    = useState<string>('');
  const [priority, setPriority]           = useState<Priority>('normal');
  const [estWait, setEstWait]             = useState(15);
  const [submitting, setSubmitting]       = useState(false);
  const [issuedEntry, setIssuedEntry]     = useState<QueueEntry | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    try {
      const [pts, allStaff, apts, queueEntries] = await Promise.all([
        listPatients(),
        listStaff({ status: 'active' }),
        listAppointments({ date: today }),
        listQueue(),
      ]);
      setPatients(pts);
      setDoctors(allStaff.filter(s => ROLE_MAP[s.role.toLowerCase()] === 'DOCTOR'));
      setTodayApts(apts);
      setQueue(queueEntries.filter(q => q.status === 'waiting' || q.status === 'called' || q.status === 'in_progress'));
    } catch { /* silently ignore */ }
  }, [today]);

  useEffect(() => { load(); }, [load]);

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
    setSelPatient(p);
    setPSearch(`${p.firstName} ${p.lastName}`);
    setSelApt('walkin');
  };

  const handleSubmit = async () => {
    if (!selectedPatient) { toast.error('Select a patient first'); return; }
    const walkinDoctor = doctors.find(d => d.id === selectedDoctor);
    const doctorId = selectedApt !== 'walkin'
      ? (todayApts.find(a => a.id === selectedApt)?.doctorId ?? walkinDoctor?.userId)
      : walkinDoctor?.userId;
    if (!doctorId) { toast.error('Select a valid doctor'); return; }

    setSubmitting(true);
    try {
      const result = await createQueueEntry({
        patientId:     selectedPatient.id,
        doctorId,
        appointmentId: selectedApt !== 'walkin' ? selectedApt : undefined,
        priority,
        estimatedWait: estWait,
      });

      if (selectedApt !== 'walkin') {
        await updateAppointment(selectedApt, { status: 'in_progress' }).catch(() => {});
      }

      const newEntry: QueueEntry = {
        id: result.id,
        tokenNumber: result.tokenNumber,
        patientId: selectedPatient.id,
        doctorId,
        appointmentId: selectedApt !== 'walkin' ? selectedApt : undefined,
        priority,
        estimatedWait: estWait,
        status: 'waiting',
        checkedInAt: new Date().toISOString(),
      };

      setIssuedEntry(newEntry);
      setSelPatient(null); setPSearch(''); setSelApt('walkin');
      setSelDoctor(''); setPriority('normal'); setEstWait(15);
      load();
      toast.success(`Token ${result.tokenNumber} issued`);
    } catch {
      toast.error('Failed to issue token');
    } finally {
      setSubmitting(false);
    }
  };

  const activeQueue = [...queue].sort((a, b) => a.checkedInAt.localeCompare(b.checkedInAt));

  const fieldCls    = 'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200';
  const labelCls    = 'block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1';
  const sectionTitle = 'text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">Patient Check-In</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Register arrivals and issue queue tokens</p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          {activeQueue.length} in queue
        </div>
      </div>

      {/* Token issued banner */}
      <AnimatePresence>
        {issuedEntry && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-4 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-emerald-600 flex items-center justify-center text-white font-semibold shrink-0">
              {issuedEntry.tokenNumber}
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">Token Issued</p>
              <p className="text-[12px] text-emerald-600 dark:text-emerald-400">
                {patients.find(p => p.id === issuedEntry.patientId)?.firstName ?? ''} · Est. {issuedEntry.estimatedWait} min wait · {issuedEntry.priority}
              </p>
            </div>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded text-[12px] text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={() => setIssuedEntry(null)}
              className="p-1.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
              <X className="w-4 h-4 text-emerald-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-column body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0">

        {/* ── Left: check-in form ──────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Patient search */}
              <div>
                <p className={sectionTitle}>Patient</p>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    value={patientSearch}
                    onChange={e => { setPSearch(e.target.value); if (!e.target.value) setSelPatient(null); }}
                    placeholder="Search by name, number, or phone…"
                    className={`${fieldCls} pl-8`}
                  />
                </div>

                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded overflow-hidden mb-2">
                    {searchResults.map(p => (
                      <button key={p.id} onClick={() => handleSelectPatient(p)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-slate-800 dark:text-white">{p.firstName} {p.lastName}</p>
                          <p className="text-[11px] text-slate-400">{p.patientNumber} · {p.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected patient card */}
                {selectedPatient && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-blue-700 dark:text-blue-300">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <p className="text-[11px] text-blue-500">{selectedPatient.patientNumber}</p>
                    </div>
                    <button onClick={() => { setSelPatient(null); setPSearch(''); }}
                      className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                      <X className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4" />

              {/* Visit type */}
              <div>
                <p className={sectionTitle}>Visit Type</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Appointment</label>
                    <select value={selectedApt} onChange={e => setSelApt(e.target.value)} className={fieldCls}>
                      <option value="walkin">Walk-in (no appointment)</option>
                      {patientApts.map(a => (
                        <option key={a.id} value={a.id}>{a.time} — {a.type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>
                      {selectedApt === 'walkin' ? 'Assign Doctor *' : 'Doctor (from appointment)'}
                    </label>
                    {selectedApt === 'walkin' ? (
                      <select value={selectedDoctor} onChange={e => setSelDoctor(e.target.value)} className={fieldCls}>
                        <option value="">Select doctor…</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>
                            Dr. {d.firstName} {d.lastName}{d.specialization ? ` · ${d.specialization}` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className={`${fieldCls} bg-slate-50 dark:bg-slate-800 text-slate-500`}>
                        {(() => {
                          const apt = todayApts.find(a => a.id === selectedApt);
                          const doc = apt ? doctors.find(d => d.userId === apt.doctorId || d.id === apt.doctorId) : null;
                          return doc ? `Dr. ${doc.firstName} ${doc.lastName}` : 'From appointment';
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4" />

              {/* Priority & Wait */}
              <div>
                <p className={sectionTitle}>Priority & Wait Time</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Priority Level</label>
                    <div className="flex gap-1.5">
                      {(Object.keys(PRIORITY_CFG) as Priority[]).map(p => (
                        <button key={p} onClick={() => setPriority(p)}
                          className={cn('flex-1 py-2 rounded text-[11px] font-medium uppercase tracking-wide transition-colors',
                            priority === p ? PRIORITY_CFG[p].active : PRIORITY_CFG[p].idle)}>
                          {PRIORITY_CFG[p].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls + ' mb-0'}>Estimated Wait</label>
                      <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">~{estWait} min</span>
                    </div>
                    <input type="range" min={5} max={120} step={5} value={estWait}
                      onChange={e => setEstWait(Number(e.target.value))}
                      className="w-full accent-blue-600 mt-2" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>5 min</span><span>1 hr</span><span>2 hr</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit footer */}
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0">
              <button onClick={handleSubmit} disabled={submitting || !selectedPatient}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {submitting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</>
                  : <><UserPlus className="w-3.5 h-3.5" /> Issue Queue Token</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: active queue ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 flex flex-col flex-1 min-h-0">
            <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
              <Users className="w-4 h-4 text-slate-400" />
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Queue</p>
              <span className="ml-auto px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-semibold rounded">
                {activeQueue.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activeQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[12px] text-slate-400">Queue is empty</p>
                </div>
              ) : (
                activeQueue.map(entry => {
                  const p   = patients.find(pt => pt.id === entry.patientId);
                  const doc = doctors.find(d => d.userId === entry.doctorId || d.id === entry.doctorId);
                  return (
                    <div key={entry.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700/50">
                      <div className="text-[15px] font-semibold text-slate-700 dark:text-white w-10 shrink-0 text-center">
                        {entry.tokenNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-slate-800 dark:text-white truncate">
                          {p ? `${p.firstName} ${p.lastName}` : '—'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {doc ? `Dr. ${doc.lastName}` : ''}
                          {entry.priority !== 'normal' && (
                            <span className={cn('ml-1 font-semibold uppercase',
                              entry.priority === 'emergency' ? 'text-red-500' : 'text-amber-500')}>
                              · {entry.priority}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[entry.status] ?? 'bg-slate-300')} />
                        <span className="text-[10px] text-slate-500 font-medium">{STATUS_LABEL[entry.status] ?? entry.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Today's appointments context */}
            {todayApts.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> {todayApts.length} appointment{todayApts.length !== 1 ? 's' : ''} today
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
