import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Stethoscope, Calendar, Clock,
  CheckCircle2, ChevronLeft, ChevronRight,
  User, CheckCheck, FileText, Loader2, Star,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import {
  listDepartments, listStaff, listAppointments, createAppointment,
} from '@/lib/services';
import type { AppointmentType, Department, Staff } from '@/types';
import { toast } from 'sonner';

const TYPE_OPTIONS: { value: AppointmentType; label: string; desc: string }[] = [
  { value: 'consultation', label: 'Consultation', desc: 'First visit for a new concern' },
  { value: 'follow_up',    label: 'Follow-up',    desc: 'Continuing care from a prior visit' },
  { value: 'check_up',     label: 'Check-up',     desc: 'Routine preventive visit' },
  { value: 'procedure',    label: 'Procedure',    desc: 'Scheduled in-office procedure' },
  { value: 'emergency',    label: 'Urgent',       desc: 'Same-day urgent concern' },
];

function getInitials(first: string, last: string) { return `${first[0]}${last[0]}`.toUpperCase(); }
function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function generateTimeSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (cur + 30 <= endMin) {
    const h = Math.floor(cur / 60), mn = cur % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${mn.toString().padStart(2, '0')}`);
    cur += 30;
  }
  return slots;
}
function dayNameOf(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

const STEPS = [
  { label: 'Department', icon: Building2 },
  { label: 'Doctor',     icon: Stethoscope },
  { label: 'Date & Time',icon: Calendar },
  { label: 'Details',    icon: FileText },
];

const BookAppointment: React.FC = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [step, setStep]     = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookedAptNumber, setBookedAptNumber] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [allDoctors, setAllDoctors]   = useState<Staff[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  const [deptId,   setDeptId]   = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date,     setDate]     = useState('');
  const [slot,     setSlot]     = useState('');
  const [type,     setType]     = useState<AppointmentType>('consultation');
  const [reason,   setReason]   = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => {});
    listStaff({ role: 'DOCTOR', status: 'active' }).then(setAllDoctors).catch(() => {});
  }, []);

  useEffect(() => {
    if (!doctorId || !date) { setBookedTimes([]); return; }
    listAppointments({ doctor_id: doctorId, date })
      .then(apts => setBookedTimes(apts.filter(a => a.status !== 'cancelled').map(a => a.time)))
      .catch(() => setBookedTimes([]));
  }, [doctorId, date]);

  const deptDoctors    = useMemo(() => allDoctors.filter(d => d.departmentId === deptId), [allDoctors, deptId]);
  const selectedDoctor = useMemo(() => allDoctors.find(d => d.id === doctorId), [allDoctors, doctorId]);
  const selectedDept   = useMemo(() => departments.find(d => d.id === deptId), [departments, deptId]);

  const timeSlots = useMemo(() => {
    if (!selectedDoctor || !date) return [];
    const dayName = dayNameOf(date);
    if (!selectedDoctor.workingDays.includes(dayName as any)) return [];
    const all = generateTimeSlots(selectedDoctor.workingHours.start, selectedDoctor.workingHours.end);
    return all.filter(s => !bookedTimes.includes(s));
  }, [selectedDoctor, date, bookedTimes]);

  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const calDays = useMemo(() => ({
    firstDay: new Date(calMonth.year, calMonth.month, 1).getDay(),
    daysInMonth: new Date(calMonth.year, calMonth.month + 1, 0).getDate(),
  }), [calMonth]);

  const isDateAvailable = (dateStr: string) => {
    if (!selectedDoctor) return false;
    return selectedDoctor.workingDays.includes(dayNameOf(dateStr) as any);
  };
  const makeDateStr = (day: number) => {
    const m = (calMonth.month + 1).toString().padStart(2, '0');
    return `${calMonth.year}-${m}-${day.toString().padStart(2, '0')}`;
  };

  const canProceed = [deptId !== '', doctorId !== '', date !== '' && slot !== '', reason.trim().length >= 10];

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const aptId = await createAppointment({
        patientId: user.id, doctorId, departmentId: deptId, date, time: slot,
        duration: 30, type, status: 'scheduled', reason: reason.trim(),
      });
      const apts = await listAppointments({ patient_id: user.id });
      const created = apts.find(a => a.id === aptId);
      setBookedAptNumber(created?.appointmentNumber ?? aptId);
      setSuccess(true);
    } catch {
      toast.error('Failed to book appointment. Please try again.');
      setSaving(false);
    }
  };

  // ── Success ──────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Appointment Booked!</h2>
          <p className="text-slate-400 text-sm mt-1">Your visit has been scheduled</p>
          <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-800 rounded text-left space-y-3">
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Appointment #</p>
              <p className="text-base font-semibold text-blue-600">{bookedAptNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Doctor',     selectedDoctor ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}` : '—'],
                ['Department', selectedDept?.name || '—'],
                ['Date',       date],
                ['Time',       formatTime(slot)],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-[13px] font-medium text-slate-800 dark:text-white mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => navigate('/appointments')}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded text-[13px] font-medium hover:bg-blue-700 transition-colors">
              My Appointments
            </button>
            <button onClick={() => { setSuccess(false); setSaving(false); setStep(0); setDeptId(''); setDoctorId(''); setDate(''); setSlot(''); setType('consultation'); setReason(''); }}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[13px] font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Book Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">Book an Appointment</h1>
        <p className="text-[13px] text-slate-400 mt-0.5">Schedule a visit with one of our specialists</p>
      </div>

      {/* Two-column body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0">

        {/* ── Left: steps + selection summary ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Steps progress */}
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Progress</p>
            <div className="space-y-1">
              {STEPS.map((s, i) => {
                const done = i < step, active = i === step;
                return (
                  <div key={i} className={cn('flex items-center gap-3 p-2.5 rounded transition-colors',
                    active ? 'bg-blue-50 dark:bg-blue-900/20' : '')}>
                    <div className={cn('w-7 h-7 rounded flex items-center justify-center shrink-0',
                      done ? 'bg-emerald-100 dark:bg-emerald-900/30' : active ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-800')}>
                      {done
                        ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        : <s.icon className={cn('w-3.5 h-3.5', active ? 'text-white' : 'text-slate-400')} />}
                    </div>
                    <span className={cn('text-[13px] font-medium',
                      active ? 'text-blue-700 dark:text-blue-300' : done ? 'text-emerald-600' : 'text-slate-400')}>
                      {s.label}
                    </span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-blue-500 ml-auto" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selections summary */}
          {(deptId || doctorId || date) && (
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Selections</p>
              <div className="space-y-2.5">
                {selectedDept && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base shrink-0">
                      {selectedDept.icon}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Department</p>
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{selectedDept.name}</p>
                    </div>
                  </div>
                )}
                {selectedDoctor && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Doctor</p>
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                        Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                      </p>
                    </div>
                  </div>
                )}
                {date && slot && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                      <Clock className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Date & Time</p>
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                        {date} · {formatTime(slot)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: step content ──────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">

                {/* Step 0: Department */}
                {step === 0 && (
                  <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 mb-3">Select Department</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {departments.map(dept => {
                        const doctorCount = allDoctors.filter(d => d.departmentId === dept.id).length;
                        return (
                          <button key={dept.id} onClick={() => { setDeptId(dept.id); setDoctorId(''); setSlot(''); setDate(''); }}
                            className={cn('flex items-start gap-3 p-3 rounded border-2 text-left transition-all',
                              deptId === dept.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:border-blue-500/30')}>
                            <span className="text-xl shrink-0 mt-0.5">{dept.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-slate-800 dark:text-white">{dept.name}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{dept.description}</p>
                              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{doctorCount} doctor{doctorCount !== 1 ? 's' : ''}</p>
                            </div>
                            {deptId === dept.id && <CheckCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Doctor */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 mb-3">
                      Choose a Doctor · <span className="font-normal text-slate-400">{selectedDept?.name}</span>
                    </p>
                    {deptDoctors.length === 0 ? (
                      <div className="py-12 text-center">
                        <User className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 text-[13px]">No active doctors in this department</p>
                        <button onClick={() => setStep(0)} className="mt-3 text-blue-600 text-[13px] hover:underline">← Pick another</button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {deptDoctors.map(doc => (
                          <button key={doc.id} onClick={() => { setDoctorId(doc.id); setDate(''); setSlot(''); }}
                            className={cn('w-full flex items-center gap-3 p-3 rounded border-2 text-left transition-all',
                              doctorId === doc.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:border-blue-500/30')}>
                            <div className="w-11 h-11 rounded bg-blue-600 flex items-center justify-center text-white text-[13px] font-semibold shrink-0">
                              {getInitials(doc.firstName, doc.lastName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-slate-800 dark:text-white">Dr. {doc.firstName} {doc.lastName}</p>
                              <p className="text-[11px] text-blue-600 mt-0.5">{doc.specialization || 'General Medicine'}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {doc.workingDays.map(d => (
                                  <span key={d} className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded text-[9px] font-medium text-slate-500 border border-slate-200 dark:border-slate-700 capitalize">
                                    {d.slice(0, 3)}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {doctorId === doc.id && <CheckCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Date & Time */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }} className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                          {new Date(calMonth.year, calMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                        <div className="flex gap-1">
                          <button onClick={() => setCalMonth(c => { const d = new Date(c.year, c.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <ChevronLeft className="w-4 h-4 text-slate-400" />
                          </button>
                          <button onClick={() => setCalMonth(c => { const d = new Date(c.year, c.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                          <div key={d} className="text-center text-[10px] font-medium text-slate-400 py-1">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-0.5">
                        {Array.from({ length: calDays.firstDay }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: calDays.daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = makeDateStr(day);
                          const isPast  = dateStr < today;
                          const available = !isPast && isDateAvailable(dateStr);
                          const selected  = date === dateStr;
                          const isToday   = dateStr === today;
                          return (
                            <button key={day} disabled={!available} onClick={() => { setDate(dateStr); setSlot(''); }}
                              className={cn('aspect-square rounded flex items-center justify-center text-[12px] font-medium transition-colors',
                                selected   ? 'bg-blue-600 text-white' :
                                available  ? (isToday ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white') :
                                             'text-slate-300 dark:text-slate-700 cursor-not-allowed')}>
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {date && (
                      <div>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                          Available times for {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        {timeSlots.length === 0 ? (
                          <div className="py-6 text-center bg-slate-50 dark:bg-slate-800 rounded">
                            <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                            <p className="text-[13px] text-slate-400">No available slots on this day</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-1.5">
                            {timeSlots.map(s => (
                              <button key={s} onClick={() => setSlot(s)}
                                className={cn('py-2 rounded text-[11px] font-medium transition-colors',
                                  slot === s
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600')}>
                                {formatTime(s)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Details */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }} className="space-y-4">
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Type of Visit</p>
                      <div className="space-y-1.5">
                        {TYPE_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => setType(opt.value)}
                            className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded border-2 text-left transition-colors',
                              type === opt.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:border-blue-500/20')}>
                            <div className={cn('w-2 h-2 rounded-full shrink-0', type === opt.value ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600')} />
                            <div>
                              <p className={cn('text-[13px] font-medium', type === opt.value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-white')}>
                                {opt.label}
                              </p>
                              <p className="text-[11px] text-slate-400">{opt.desc}</p>
                            </div>
                            {type === opt.value && <CheckCheck className="w-4 h-4 text-blue-600 ml-auto shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                        Reason for Visit <span className="text-red-400">*</span>
                      </p>
                      <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
                        placeholder="Describe your symptoms or what you'd like to discuss (at least 10 characters)..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
                      <p className={cn('text-[11px] text-right mt-1', reason.length >= 10 ? 'text-emerald-600' : 'text-slate-400')}>
                        {reason.length} / 10 min {reason.length >= 10 && '✓'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="px-5 pb-5 flex gap-3 shrink-0 border-t border-slate-100 dark:border-slate-800 pt-4">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}
              <div className="flex-1" />
              {step < STEPS.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canProceed[step]}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded text-[13px] font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={saving || !canProceed[3]}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded text-[13px] font-medium hover:bg-blue-700 transition-colors disabled:opacity-40">
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Booking…</>
                    : <><Star className="w-3.5 h-3.5" /> Confirm Appointment</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
