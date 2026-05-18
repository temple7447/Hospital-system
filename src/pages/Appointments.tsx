import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Stethoscope,
  Activity,
  CheckCheck,
  PlayCircle,
  RefreshCw,
  Building2,
  FileText,
  Phone,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import type { Appointment, AppointmentStatus, AppointmentType, Patient, Staff, Department } from '@/types';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string; darkBg: string }> = {
  scheduled:  { label: 'Scheduled',   color: 'text-blue-600',   bg: 'bg-blue-50',    darkBg: 'dark:bg-blue-900/20' },
  confirmed:  { label: 'Confirmed',   color: 'text-emerald-600',bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/20' },
  in_progress:{ label: 'In Progress', color: 'text-violet-600', bg: 'bg-violet-50',  darkBg: 'dark:bg-violet-900/20' },
  completed:  { label: 'Completed',   color: 'text-slate-500',  bg: 'bg-slate-100',  darkBg: 'dark:bg-slate-800' },
  cancelled:  { label: 'Cancelled',   color: 'text-red-600',    bg: 'bg-red-50',     darkBg: 'dark:bg-red-900/20' },
  no_show:    { label: 'No Show',     color: 'text-amber-600',  bg: 'bg-amber-50',   darkBg: 'dark:bg-amber-900/20' },
};

const TYPE_LABELS: Record<AppointmentType, string> = {
  check_up:     'Check-up',
  consultation: 'Consultation',
  follow_up:    'Follow-up',
  emergency:    'Emergency',
  procedure:    'Procedure',
};

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function generateTimeSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (cur + 30 <= endMin) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    cur += 30;
  }
  return slots;
}

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: AppointmentStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block', cfg.bg, cfg.darkBg, cfg.color)}>
      {cfg.label}
    </span>
  );
};

// ─── Book Appointment Modal ───────────────────────────────────────────────────

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  currentUser: { id: string; role: string };
  patients: Patient[];
  staff: Staff[];
  departments: Department[];
}

const BOOK_STEPS = ['Patient & Department', 'Doctor & Date', 'Details'];

const BookModal: React.FC<BookModalProps> = ({ isOpen, onClose, onCreated, currentUser, patients, staff, departments }) => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [patientId, setPatientId] = useState(currentUser.role === 'PATIENT' ? currentUser.id : '');
  const [patientSearch, setPatientSearch] = useState('');
  const [deptId, setDeptId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [type, setType] = useState<AppointmentType>('consultation');
  const [reason, setReason] = useState('');

  const isPatient = currentUser.role === 'PATIENT';

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setSaving(false);
      setSuccess(false);
      setPatientId(isPatient ? currentUser.id : '');
      setPatientSearch('');
      setDeptId('');
      setDoctorId('');
      setDate('');
      setSlot('');
      setType('consultation');
      setReason('');
    }
  }, [isOpen]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients.slice(0, 8);
    const q = patientSearch.toLowerCase();
    return patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.patientNumber.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [patients, patientSearch]);

  const deptDoctors = useMemo(() =>
    deptId ? staff.filter(s => s.role === 'DOCTOR' && s.departmentId === deptId && s.status === 'active') : [],
    [staff, deptId]
  );

  const selectedDoctor = useMemo(() => staff.find(s => s.id === doctorId), [staff, doctorId]);

  const timeSlots = useMemo(() => {
    if (!selectedDoctor || !date) return [];
    const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as any;
    if (!selectedDoctor.workingDays.includes(dayName)) return [];
    const all = generateTimeSlots(selectedDoctor.workingHours.start, selectedDoctor.workingHours.end);
    const booked = db.appointments.getByDoctor(doctorId)
      .filter(a => a.date === date && a.status !== 'cancelled')
      .map(a => a.time);
    return all.filter(s => !booked.includes(s));
  }, [selectedDoctor, date, doctorId]);

  const today = new Date().toISOString().split('T')[0];

  const canStep0 = (isPatient || patientId !== '') && deptId !== '';
  const canStep1 = doctorId !== '' && date !== '' && slot !== '';
  const canStep2 = reason.trim() !== '';

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const apt = db.appointments.create({
        patientId,
        doctorId,
        departmentId: deptId,
        date,
        time: slot,
        duration: 30,
        type,
        status: 'scheduled',
        reason: reason.trim(),
      });
      db.auditLogs.create({
        userId: currentUser.id,
        action: 'CREATE',
        resource: 'appointment',
        resourceId: apt.id,
        details: `Appointment booked for ${date} at ${slot}`,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        onCreated();
        toast.success('Appointment booked successfully');
      }, 1800);
    } catch {
      toast.error('Failed to book appointment');
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            onClick={() => !saving && onClose()}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-4xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Book Appointment</h2>
                  <p className="text-xs font-bold text-slate-400 mt-1">Step {step + 1} of {BOOK_STEPS.length}</p>
                </div>
                <button onClick={() => !saving && onClose()} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Step dots */}
              <div className="flex gap-2 px-8 pt-5">
                {BOOK_STEPS.map((label, i) => (
                  <div key={i} className="flex-1">
                    <div className={cn(
                      'h-1.5 rounded-full transition-all',
                      i < step ? 'bg-emerald-500' : i === step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                    )} />
                    <p className={cn('text-[10px] font-bold mt-1.5 uppercase tracking-wider',
                      i === step ? 'text-blue-600' : 'text-slate-400')}>{label}</p>
                  </div>
                ))}
              </div>

              <div className="px-8 py-6 space-y-5 min-h-80 relative">
                {/* Success overlay */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-900/95 z-10 rounded-2xl"
                    >
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">Appointment Booked!</h3>
                      <p className="text-sm text-slate-500 mt-1">Scheduled for {date} at {formatTime(slot)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step 0: Patient & Department */}
                {step === 0 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    {!isPatient && (
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Patient</label>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={patientSearch}
                            onChange={e => { setPatientSearch(e.target.value); setPatientId(''); }}
                            placeholder="Search by name, email or ID..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none border border-transparent focus:border-blue-500/20"
                          />
                        </div>
                        {patientSearch && (
                          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg max-h-44 overflow-y-auto">
                            {filteredPatients.length === 0 ? (
                              <p className="text-xs text-slate-400 p-4 text-center">No patients found</p>
                            ) : filteredPatients.map(p => (
                              <button
                                key={p.id}
                                onClick={() => { setPatientId(p.id); setPatientSearch(`${p.firstName} ${p.lastName}`); }}
                                className={cn(
                                  'w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-3',
                                  patientId === p.id && 'bg-blue-50 dark:bg-blue-900/20'
                                )}
                              >
                                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">
                                  {getInitials(`${p.firstName} ${p.lastName}`)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{p.firstName} {p.lastName}</p>
                                  <p className="text-[10px] text-slate-400">{p.patientNumber} · {p.phone}</p>
                                </div>
                                {patientId === p.id && <CheckCheck className="w-4 h-4 text-blue-600 ml-auto" />}
                              </button>
                            ))}
                          </div>
                        )}
                        {patientId && !patientSearch.includes(' ') && (
                          <p className="text-xs text-emerald-600 font-bold px-1">✓ Patient selected</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Department</label>
                      <div className="grid grid-cols-2 gap-2">
                        {departments.map(d => (
                          <button
                            key={d.id}
                            onClick={() => { setDeptId(d.id); setDoctorId(''); setSlot(''); }}
                            className={cn(
                              'px-4 py-3 rounded-2xl text-sm font-bold text-left transition-all border',
                              deptId === d.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-blue-500/30'
                            )}
                          >
                            {d.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Doctor & Date */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Doctor</label>
                      {deptDoctors.length === 0 ? (
                        <p className="text-sm text-slate-400 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center">No active doctors in this department</p>
                      ) : (
                        <div className="space-y-2">
                          {deptDoctors.map(doc => (
                            <button
                              key={doc.id}
                              onClick={() => { setDoctorId(doc.id); setSlot(''); }}
                              className={cn(
                                'w-full flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all text-left',
                                doctorId === doc.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:border-blue-500/30'
                              )}
                            >
                              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                                {getInitials(`${doc.firstName} ${doc.lastName}`)}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-sm text-slate-900 dark:text-white">Dr. {doc.firstName} {doc.lastName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{doc.specialization || 'General'}</p>
                              </div>
                              {doctorId === doc.id && <CheckCheck className="w-4 h-4 text-blue-600" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          value={date}
                          min={today}
                          onChange={e => { setDate(e.target.value); setSlot(''); }}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    {doctorId && date && (
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                          Available Time Slots {timeSlots.length === 0 && <span className="text-red-500">(None available)</span>}
                        </label>
                        {timeSlots.length > 0 ? (
                          <div className="grid grid-cols-4 gap-2">
                            {timeSlots.map(s => (
                              <button
                                key={s}
                                onClick={() => setSlot(s)}
                                className={cn(
                                  'py-2 rounded-xl text-xs font-bold transition-all',
                                  slot === s
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                                )}
                              >
                                {formatTime(s)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
                            {selectedDoctor && !selectedDoctor.workingDays.includes(
                              new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as any
                            ) ? 'Doctor does not work on this day' : 'All slots are booked'}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Details */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl space-y-2">
                      <p className="text-xs font-black text-blue-600 uppercase tracking-wider">Summary</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-slate-400 font-bold">Doctor</p>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">
                            {selectedDoctor ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold">Date & Time</p>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{date} · {formatTime(slot)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Visit Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(TYPE_LABELS) as [AppointmentType, string][]).map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() => setType(val)}
                            className={cn(
                              'px-4 py-2.5 rounded-xl text-xs font-bold border transition-all',
                              type === val
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-blue-500/30'
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Reason for Visit</label>
                      <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Describe symptoms or reason..."
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 pb-6 flex gap-3">
                <button
                  onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}
                  disabled={saving}
                  className="flex-1 px-4 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  {step === 0 ? 'Cancel' : 'Back'}
                </button>
                {step < BOOK_STEPS.length - 1 ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={(step === 0 && !canStep0) || (step === 1 && !canStep1)}
                    className="flex-2 px-4 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !canStep2}
                    className="flex-2 px-4 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : 'Confirm Booking'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Cancel Modal ─────────────────────────────────────────────────────────────

interface CancelModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  onCancelled: () => void;
  currentUserId: string;
  patients: Patient[];
  staff: Staff[];
}

const CancelModal: React.FC<CancelModalProps> = ({ appointment, onClose, onCancelled, currentUserId, patients, staff }) => {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (appointment) setReason(''); }, [appointment]);

  if (!appointment) return null;

  const patient = patients.find(p => p.id === appointment.patientId);
  const doctor = staff.find(s => s.id === appointment.doctorId);

  const handleCancel = () => {
    if (!reason.trim()) return;
    setSaving(true);
    db.appointments.cancel(appointment.id, reason.trim());
    db.auditLogs.create({
      userId: currentUserId,
      action: 'UPDATE',
      resource: 'appointment',
      resourceId: appointment.id,
      details: `Appointment cancelled: ${reason}`,
    });
    setTimeout(() => {
      setSaving(false);
      onCancelled();
      onClose();
      toast.success('Appointment cancelled');
    }, 600);
  };

  return (
    <AnimatePresence>
      {appointment && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50" onClick={() => !saving && onClose()} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-4xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Cancel Appointment</h2>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="px-8 py-6 space-y-5">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl space-y-1">
                  <p className="text-xs font-black text-red-600 uppercase tracking-wider">Appointment to Cancel</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : '—'} · {formatDate(appointment.date)} at {formatTime(appointment.time)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Reason for Cancellation</label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Provide a reason..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  />
                </div>
              </div>
              <div className="px-8 pb-6 flex gap-3">
                <button onClick={onClose} disabled={saving}
                  className="flex-1 px-4 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Keep
                </button>
                <button onClick={handleCancel} disabled={saving || !reason.trim()}
                  className="flex-2 px-4 py-3.5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</> : 'Cancel Appointment'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AppointmentType | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');

  const [showBook, setShowBook] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [calendarDate, setCalendarDate] = useState(new Date());

  const isAdmin = user?.role === 'ADMIN';
  const isDoctor = user?.role === 'DOCTOR';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const isPatient = user?.role === 'PATIENT';

  const loadData = () => {
    const allPatients = db.patients.getAll();
    const allStaff = db.staff.getAll();
    const allDepts = db.departments.getAll();
    setPatients(allPatients);
    setStaff(allStaff);
    setDepartments(allDepts);

    let apts: Appointment[];
    if (isPatient && user) {
      apts = db.appointments.getByPatient(user.id);
    } else if (isDoctor && user) {
      apts = db.appointments.getByDoctor(user.id);
    } else {
      apts = db.appointments.getAll();
    }
    // Sort: most recent date first, then by time
    apts.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : a.time.localeCompare(b.time));
    setAppointments(apts);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    return appointments.filter(apt => {
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
      if (typeFilter !== 'all' && apt.type !== typeFilter) return false;
      if (dateFilter && apt.date !== dateFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const patient = patients.find(p => p.id === apt.patientId);
        const doctor = staff.find(s => s.id === apt.doctorId);
        const patName = patient ? `${patient.firstName} ${patient.lastName}`.toLowerCase() : '';
        const drName = doctor ? `${doctor.firstName} ${doctor.lastName}`.toLowerCase() : '';
        if (!patName.includes(q) && !drName.includes(q) && !apt.appointmentNumber.toLowerCase().includes(q) && !apt.reason.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, statusFilter, typeFilter, dateFilter, search, patients, staff]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: appointments.length,
      today: appointments.filter(a => a.date === today).length,
      upcoming: appointments.filter(a => a.date >= today && ['scheduled', 'confirmed'].includes(a.status)).length,
      completed: appointments.filter(a => a.status === 'completed').length,
    };
  }, [appointments]);

  // Calendar: days in current month with appointment dots
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, year, month };
  }, [calendarDate]);

  const aptsOnCalendarDate = useMemo(() => {
    const dateStr = (d: number) => {
      const y = calendarDays.year;
      const m = (calendarDays.month + 1).toString().padStart(2, '0');
      const day = d.toString().padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const map: Record<string, number> = {};
    appointments.forEach(a => {
      const d = a.date;
      map[d] = (map[d] || 0) + 1;
    });
    return (day: number) => map[aptsOnCalendarDate ? aptsOnCalendarDate : dateStr(day)] || map[dateStr(day)] || 0;
  }, [appointments, calendarDays]);

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
    toast.success(`Appointment marked as ${STATUS_CONFIG[newStatus].label}`);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      {/* Modals */}
      <BookModal
        isOpen={showBook}
        onClose={() => setShowBook(false)}
        onCreated={loadData}
        currentUser={{ id: user!.id, role: user!.role }}
        patients={patients}
        staff={staff}
        departments={departments}
      />
      <CancelModal
        appointment={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelled={loadData}
        currentUserId={user!.id}
        patients={patients}
        staff={staff}
      />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Appointments</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isPatient ? 'Your scheduled visits' : isDoctor ? 'Your patient schedule' : 'All hospital appointments'}
          </p>
        </div>
        {!isPatient && (
          <button
            onClick={() => setShowBook(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 self-start"
          >
            <Plus className="w-5 h-5" />
            Book Appointment
          </button>
        )}
        {isPatient && (
          <button
            onClick={() => setShowBook(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 self-start"
          >
            <Plus className="w-5 h-5" />
            Book Appointment
          </button>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: "Today's", value: stats.today, icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
          { label: 'Upcoming', value: stats.upcoming, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Completed', value: stats.completed, icon: CheckCheck, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', s.bg)}>
              <s.icon className={cn('w-6 h-6', s.color)} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Appointments List */}
        <div className="xl:col-span-3 space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-55 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isPatient ? 'Search by doctor or reason...' : 'Search patient, doctor, or ID...'}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              {(Object.entries(TYPE_LABELS) as [AppointmentType, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
            />
            {(statusFilter !== 'all' || typeFilter !== 'all' || dateFilter || search) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setDateFilter(''); }}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="glass-card rounded-4xl p-16 text-center">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-lg font-black text-slate-400">No appointments found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((apt, idx) => {
                const patient = patients.find(p => p.id === apt.patientId);
                const doctor = staff.find(s => s.id === apt.doctorId);
                const dept = departments.find(d => d.id === apt.departmentId);
                const isExpanded = expandedId === apt.id;
                const isToday = apt.date === today;
                const isPast = apt.date < today;

                return (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={cn(
                      'glass-card rounded-3xl overflow-hidden transition-all',
                      isToday && 'ring-2 ring-blue-500/30',
                      apt.status === 'cancelled' && 'opacity-60'
                    )}
                  >
                    {isToday && (
                      <div className="px-6 py-1.5 bg-blue-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Today</span>
                      </div>
                    )}
                    <div
                      className="p-5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all"
                      onClick={() => setExpandedId(isExpanded ? null : apt.id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shrink-0 shadow-lg shadow-blue-500/20">
                            {patient ? getInitials(`${patient.firstName} ${patient.lastName}`) : '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-slate-900 dark:text-white text-sm">
                                {patient ? `${patient.firstName} ${patient.lastName}` : apt.patientId}
                              </h3>
                              <StatusBadge status={apt.status} />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              {!isPatient && doctor && (
                                <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                  <Stethoscope className="w-3 h-3" />
                                  Dr. {doctor.firstName} {doctor.lastName}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                <Calendar className="w-3 h-3" />
                                {formatDate(apt.date)}
                              </span>
                              <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                <Clock className="w-3 h-3" />
                                {formatTime(apt.time)}
                              </span>
                              {dept && (
                                <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                  <Building2 className="w-3 h-3" />
                                  {dept.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="hidden sm:block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            {TYPE_LABELS[apt.type]}
                          </span>
                          <ChevronDown className={cn('w-5 h-5 text-slate-400 transition-transform', isExpanded && 'rotate-180')} />
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Appointment #</p>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{apt.appointmentNumber}</p>
                              </div>
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Duration</p>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{apt.duration} min</p>
                              </div>
                              {patient?.phone && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Patient Phone</p>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">{patient.phone}</p>
                                </div>
                              )}
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Reason
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{apt.reason}</p>
                            </div>
                            {apt.cancelledReason && (
                              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <p className="text-[10px] font-black text-red-500 uppercase mb-1">Cancellation Reason</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{apt.cancelledReason}</p>
                              </div>
                            )}
                            {apt.notes && (
                              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Notes</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{apt.notes}</p>
                              </div>
                            )}

                            {/* Actions */}
                            {!isPast && apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'no_show' && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {apt.status === 'scheduled' && !isPatient && (
                                  <button
                                    onClick={() => handleStatusChange(apt, 'confirmed')}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-xs font-black hover:bg-emerald-100 transition-all"
                                  >
                                    <CheckCircle2 className="w-4 h-4" /> Confirm
                                  </button>
                                )}
                                {apt.status === 'confirmed' && (isDoctor || isAdmin) && (
                                  <button
                                    onClick={() => handleStatusChange(apt, 'in_progress')}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-xl text-xs font-black hover:bg-violet-100 transition-all"
                                  >
                                    <PlayCircle className="w-4 h-4" /> Start
                                  </button>
                                )}
                                {apt.status === 'in_progress' && (isDoctor || isAdmin) && (
                                  <button
                                    onClick={() => handleStatusChange(apt, 'completed')}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-200 transition-all"
                                  >
                                    <CheckCheck className="w-4 h-4" /> Complete
                                  </button>
                                )}
                                {!isPatient && (
                                  <button
                                    onClick={() => handleStatusChange(apt, 'no_show')}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl text-xs font-black hover:bg-amber-100 transition-all"
                                  >
                                    <AlertCircle className="w-4 h-4" /> No Show
                                  </button>
                                )}
                                <button
                                  onClick={() => setCancelTarget(apt)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-all"
                                >
                                  <XCircle className="w-4 h-4" /> Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Calendar + Quick Stats */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <div className="glass-card p-5 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 dark:text-white text-sm">
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-center text-[9px] font-black text-slate-400 uppercase py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calendarDays.firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: calendarDays.daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calendarDays.year}-${(calendarDays.month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const count = aptsOnCalendarDate(day);
                const isToday = dateStr === today;
                return (
                  <button
                    key={day}
                    onClick={() => setDateFilter(dateFilter === dateStr ? '' : dateStr)}
                    className={cn(
                      'aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative text-xs font-bold',
                      isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' :
                      dateFilter === dateStr ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                      'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {day}
                    {count > 0 && (
                      <div className={cn('w-1 h-1 rounded-full absolute bottom-0.5', isToday ? 'bg-white' : 'bg-blue-600')} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's Summary */}
          <div className="glass-card p-5 rounded-3xl">
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4">Today</h3>
            {appointments.filter(a => a.date === today).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No appointments today</p>
            ) : (
              <div className="space-y-3">
                {appointments.filter(a => a.date === today).slice(0, 5).map(apt => {
                  const doc = staff.find(s => s.id === apt.doctorId);
                  const pat = patients.find(p => p.id === apt.patientId);
                  return (
                    <div key={apt.id} className="flex items-center gap-3">
                      <div className={cn('w-1 h-8 rounded-full shrink-0', STATUS_CONFIG[apt.status].bg.replace('50', '500').replace('100', '500'))} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {isPatient ? (doc ? `Dr. ${doc.firstName} ${doc.lastName}` : '—') : (pat ? `${pat.firstName} ${pat.lastName}` : '—')}
                        </p>
                        <p className="text-[10px] text-slate-400">{formatTime(apt.time)}</p>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status breakdown */}
          <div className="glass-card p-5 rounded-3xl">
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4">Breakdown</h3>
            <div className="space-y-2">
              {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map(s => {
                const count = appointments.filter(a => a.status === s).length;
                if (count === 0) return null;
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left',
                      statusFilter === s ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <span className={cn('text-xs font-bold', cfg.color)}>{cfg.label}</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
