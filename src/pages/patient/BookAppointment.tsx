import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCheck,
  FileText,
  Loader2,
  Star,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import {
  listDepartments,
  listStaff,
  listAppointments,
  createAppointment,
} from '@/lib/services';
import type { AppointmentType, Department, Staff } from '@/types';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: AppointmentType; label: string; desc: string }[] = [
  { value: 'consultation',  label: 'Consultation',  desc: 'First visit for a new concern' },
  { value: 'follow_up',     label: 'Follow-up',     desc: 'Continuing care from a prior visit' },
  { value: 'check_up',      label: 'Check-up',      desc: 'Routine preventive visit' },
  { value: 'procedure',     label: 'Procedure',     desc: 'Scheduled in-office procedure' },
  { value: 'emergency',     label: 'Urgent',        desc: 'Same-day urgent concern' },
];

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ap}`;
}

function generateTimeSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (cur + 30 <= endMin) {
    const h = Math.floor(cur / 60);
    const mn = cur % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${mn.toString().padStart(2, '0')}`);
    cur += 30;
  }
  return slots;
}

function dayNameOf(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

// ─── Step components ──────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Department', icon: Building2 },
  { label: 'Doctor',     icon: Stethoscope },
  { label: 'Date & Time',icon: Calendar },
  { label: 'Details',    icon: FileText },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

const BookAppointment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookedAptNumber, setBookedAptNumber] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [allDoctors, setAllDoctors] = useState<Staff[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  const [deptId, setDeptId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [type, setType] = useState<AppointmentType>('consultation');
  const [reason, setReason] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => {});
    listStaff({ role: 'DOCTOR', status: 'active' }).then(setAllDoctors).catch(() => {});
  }, []);

  // When doctor + date change, fetch booked slots
  useEffect(() => {
    if (!doctorId || !date) { setBookedTimes([]); return; }
    listAppointments({ doctor_id: doctorId, date })
      .then(apts => setBookedTimes(apts.filter(a => a.status !== 'cancelled').map(a => a.time)))
      .catch(() => setBookedTimes([]));
  }, [doctorId, date]);

  const deptDoctors = useMemo(() =>
    allDoctors.filter(d => d.departmentId === deptId),
    [allDoctors, deptId]
  );

  const selectedDoctor = useMemo(() => allDoctors.find(d => d.id === doctorId), [allDoctors, doctorId]);
  const selectedDept = useMemo(() => departments.find(d => d.id === deptId), [departments, deptId]);

  const timeSlots = useMemo(() => {
    if (!selectedDoctor || !date) return [];
    const dayName = dayNameOf(date);
    if (!selectedDoctor.workingDays.includes(dayName as any)) return [];
    const all = generateTimeSlots(selectedDoctor.workingHours.start, selectedDoctor.workingHours.end);
    return all.filter(s => !bookedTimes.includes(s));
  }, [selectedDoctor, date, bookedTimes]);

  // Calendar state
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const calDays = useMemo(() => {
    const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay();
    const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  }, [calMonth]);

  const isDateAvailable = (dateStr: string) => {
    if (!selectedDoctor) return false;
    const dayName = dayNameOf(dateStr);
    return selectedDoctor.workingDays.includes(dayName as any);
  };

  const makeDateStr = (day: number) => {
    const m = (calMonth.month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${calMonth.year}-${m}-${d}`;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const aptId = await createAppointment({
        patientId: user.id,
        doctorId,
        departmentId: deptId,
        date,
        time: slot,
        duration: 30,
        type,
        status: 'scheduled',
        reason: reason.trim(),
      });
      // Fetch the created appointment to get its appointmentNumber
      const apts = await listAppointments({ patient_id: user.id });
      const created = apts.find(a => a.id === aptId);
      setBookedAptNumber(created?.appointmentNumber ?? aptId);
      setSuccess(true);
    } catch {
      toast.error('Failed to book appointment. Please try again.');
      setSaving(false);
    }
  };

  const canProceed = [
    deptId !== '',
    doctorId !== '',
    date !== '' && slot !== '',
    reason.trim().length >= 10,
  ];

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </motion.div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Booked!</h2>
          <p className="text-slate-500 mt-2 font-medium">Your appointment has been scheduled</p>

          <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl text-left space-y-3">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Appointment #</p>
              <p className="text-lg font-black text-blue-600">{bookedAptNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Doctor</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedDoctor ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Department</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedDept?.name || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Date</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{date}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Time</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{formatTime(slot)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate('/appointments')}
              className="flex-1 px-4 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all"
            >
              View My Appointments
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setSaving(false);
                setStep(0);
                setDeptId('');
                setDoctorId('');
                setDate('');
                setSlot('');
                setType('consultation');
                setReason('');
              }}
              className="flex-1 px-4 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Book Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Book an Appointment</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Schedule a visit with one of our specialists</p>
      </motion.div>

      {/* Step progress */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="glass-card p-5 rounded-3xl">
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={i}>
                <div className={cn('flex items-center gap-2 flex-shrink-0', active ? 'opacity-100' : done ? 'opacity-100' : 'opacity-40')}>
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                    done ? 'bg-emerald-500' : active ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  )}>
                    {done
                      ? <CheckCheck className="w-4 h-4 text-white" />
                      : <s.icon className={cn('w-4 h-4', active ? 'text-white' : 'text-slate-400')} />
                    }
                  </div>
                  <span className={cn(
                    'text-xs font-black uppercase tracking-wider hidden md:block',
                    active ? 'text-slate-900 dark:text-white' : done ? 'text-emerald-600' : 'text-slate-400'
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-3', i < step ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700')} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {/* Step 0: Department */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Select Department</h2>
                <p className="text-sm text-slate-500 mt-1">Choose the specialty that best fits your concern</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {departments.map(dept => {
                  const doctorCount = allDoctors.filter(d => d.departmentId === dept.id).length;
                  return (
                    <button
                      key={dept.id}
                      onClick={() => { setDeptId(dept.id); setDoctorId(''); setSlot(''); setDate(''); }}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all',
                        deptId === dept.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10'
                          : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:border-blue-500/30'
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm text-xl flex-shrink-0">
                        {dept.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-slate-900 dark:text-white">{dept.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{dept.description}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          {doctorCount} doctor{doctorCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {deptId === dept.id && <CheckCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 1: Doctor */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Choose a Doctor</h2>
                <p className="text-sm text-slate-500 mt-1">{selectedDept?.name} specialists</p>
              </div>
              {deptDoctors.length === 0 ? (
                <div className="py-12 text-center">
                  <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold">No active doctors in this department</p>
                  <button onClick={() => setStep(0)} className="mt-4 text-blue-600 text-sm font-bold hover:underline">
                    ← Pick another department
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {deptDoctors.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => { setDoctorId(doc.id); setDate(''); setSlot(''); }}
                      className={cn(
                        'w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all',
                        doctorId === doc.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10'
                          : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:border-blue-500/30'
                      )}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-blue-500/20 shrink-0">
                        {getInitials(doc.firstName, doc.lastName)}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-900 dark:text-white">Dr. {doc.firstName} {doc.lastName}</p>
                        <p className="text-xs font-bold text-blue-600 mt-0.5">{doc.specialization || 'General Medicine'}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.workingDays.map(d => (
                            <span key={d} className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-lg text-[9px] font-black text-slate-500 uppercase border border-slate-200 dark:border-slate-700 capitalize">
                              {d.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          {formatTime(doc.workingHours.start)} – {formatTime(doc.workingHours.end)}
                        </p>
                      </div>
                      {doctorId === doc.id && <CheckCheck className="w-5 h-5 text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="glass-card rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Pick a Date & Time</h2>
                {selectedDoctor && (
                  <p className="text-sm text-slate-500 mt-1">
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName} works {selectedDoctor.workingDays.map(d => d.slice(0, 3)).join(', ')}
                  </p>
                )}
              </div>

              {/* Calendar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-900 dark:text-white">
                    {new Date(calMonth.year, calMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCalMonth(c => {
                        const d = new Date(c.year, c.month - 1);
                        return { year: d.getFullYear(), month: d.getMonth() };
                      })}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => setCalMonth(c => {
                        const d = new Date(c.year, c.month + 1);
                        return { year: d.getFullYear(), month: d.getMonth() };
                      })}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: calDays.firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: calDays.daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = makeDateStr(day);
                    const isPast = dateStr < today;
                    const available = !isPast && isDateAvailable(dateStr);
                    const selected = date === dateStr;
                    const isToday = dateStr === today;

                    return (
                      <button
                        key={day}
                        disabled={!available}
                        onClick={() => { setDate(dateStr); setSlot(''); }}
                        className={cn(
                          'aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all',
                          selected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' :
                          available ? (isToday ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white') :
                          'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {date && (
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                    Available Times for {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  {timeSlots.length === 0 ? (
                    <div className="py-6 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-400">No available slots on this day</p>
                      <p className="text-xs text-slate-400 mt-1">Try another date</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {timeSlots.map(s => (
                        <button
                          key={s}
                          onClick={() => setSlot(s)}
                          className={cn(
                            'py-2.5 rounded-xl text-xs font-black transition-all',
                            slot === s
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600'
                          )}
                        >
                          {formatTime(s)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="glass-card rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Visit Details</h2>
                <p className="text-sm text-slate-500 mt-1">Tell us a bit about your visit</p>
              </div>

              {/* Booking summary */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Doctor</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedDoctor ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Department</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{selectedDept?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Time</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{formatTime(slot)}</p>
                </div>
              </div>

              {/* Visit type */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Type of Visit</label>
                <div className="space-y-2">
                  {TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setType(opt.value)}
                      className={cn(
                        'w-full flex items-center gap-4 px-4 py-3 rounded-2xl border-2 text-left transition-all',
                        type === opt.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:border-blue-500/20'
                      )}
                    >
                      <div className={cn('w-2 h-2 rounded-full shrink-0 mt-0.5', type === opt.value ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600')} />
                      <div>
                        <p className={cn('text-sm font-black', type === opt.value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white')}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">{opt.desc}</p>
                      </div>
                      {type === opt.value && <CheckCheck className="w-4 h-4 text-blue-600 ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Reason for Visit <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Describe your symptoms or what you'd like to discuss (at least 10 characters)..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none border border-transparent focus:border-blue-500/20"
                />
                <p className={cn('text-[10px] font-bold text-right', reason.length >= 10 ? 'text-emerald-600' : 'text-slate-400')}>
                  {reason.length} / 10 min chars {reason.length >= 10 && '✓'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-4">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={saving}
            className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed[step]}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving || !canProceed[3]}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
              : <><Star className="w-4 h-4" /> Confirm Appointment</>
            }
          </button>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
