import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  User, Heart, AlertTriangle,
  ChevronRight, CheckCircle2,
  Plus, X, Calendar, Clipboard,
} from 'lucide-react';
import { createPatient } from '@/lib/services';
import { cn } from '@/utils/cn';
import type { BloodType } from '@/types';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];
const GENDERS = ['male', 'female', 'other'] as const;

interface FormData {
  firstName: string; lastName: string; email: string; phone: string;
  dateOfBirth: string; gender: typeof GENDERS[number];
  address: string; city: string;
  bloodType: BloodType;
  allergies: string[]; chronicConditions: string[];
  insuranceProvider: string; insuranceNumber: string;
  emergencyContactName: string; emergencyContactPhone: string;
}

const empty = (): FormData => ({
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', gender: 'male',
  address: '', city: '',
  bloodType: 'unknown',
  allergies: [], chronicConditions: [],
  insuranceProvider: '', insuranceNumber: '',
  emergencyContactName: '', emergencyContactPhone: '',
});

const STEPS = [
  { label: 'Personal',  icon: User,         title: 'Personal Details',    subtitle: 'Basic patient information' },
  { label: 'Medical',   icon: Heart,         title: 'Medical Information', subtitle: 'Health history and blood type' },
  { label: 'Emergency', icon: AlertTriangle, title: 'Emergency Contact',   subtitle: 'Who to contact in an emergency' },
];

const TagInput: React.FC<{
  label: string; placeholder: string;
  tags: string[]; onChange: (tags: string[]) => void;
  color: 'red' | 'amber';
}> = ({ label, placeholder, tags, onChange, color }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  };
  return (
    <div>
      <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(tag => (
          <span key={tag} className={cn('flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium',
            color === 'red' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20')}>
            {tag}
            <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-blue-500" />
        <button type="button" onClick={add}
          className="px-3 py-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const RegisterPatient: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep]   = useState(0);
  const [form, setForm]   = useState<FormData>(empty());
  const [createdPatient, setCreatedPatient] = useState<{ name: string; number: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const validateStep = (): boolean => {
    if (step === 0 && (!form.firstName || !form.lastName || !form.email || !form.phone || !form.dateOfBirth || !form.address || !form.city)) {
      toast.error('Please fill in all required fields'); return false;
    }
    if (step === 2 && (!form.emergencyContactName || !form.emergencyContactPhone)) {
      toast.error('Emergency contact details are required'); return false;
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setSaving(true);
    try {
      const result = await createPatient({
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone,
        dateOfBirth: form.dateOfBirth, gender: form.gender,
        address: form.address, city: form.city,
        bloodType: form.bloodType,
        allergies: form.allergies,
        chronicConditions: form.chronicConditions,
        insuranceProvider: form.insuranceProvider || undefined,
        insuranceNumber:   form.insuranceNumber   || undefined,
        emergencyContactName: form.emergencyContactName,
        emergencyContactPhone: form.emergencyContactPhone,
      });
      setCreatedPatient({ name: `${form.firstName} ${form.lastName}`, number: result.patientNumber });
      toast.success('Patient registered successfully');
    } catch {
      toast.error('Registration failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Success ──────────────────────────────────────────────────────────────────
  if (createdPatient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-xs">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Patient Registered!</h2>
          <p className="text-slate-400 text-sm mt-1">{createdPatient.name} added to the system</p>
          <div className="bg-slate-50 dark:bg-slate-800 rounded p-4 my-5">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Patient ID</p>
            <p className="text-2xl font-semibold text-blue-600">{createdPatient.number}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate('/appointments')}
              className="px-4 py-2.5 bg-blue-600 text-white rounded text-[13px] font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" /> Book Appointment
            </button>
            <button onClick={() => { setForm(empty()); setCreatedPatient(null); setStep(0); }}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[13px] font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Register Another
            </button>
            <button onClick={() => navigate('/patients')}
              className="text-[13px] text-blue-600 hover:text-blue-500 transition-colors">
              View All Patients →
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const fieldCls = 'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200';
  const labelCls = 'block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">Register New Patient</h1>
        <p className="text-[13px] text-slate-400 mt-0.5">Enter patient details to create their hospital record</p>
      </div>

      {/* Two-column body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0">

        {/* ── Left: step indicator + summary ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Steps */}
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Progress</p>
            <div className="space-y-1">
              {STEPS.map((s, i) => {
                const done   = i < step;
                const active = i === step;
                return (
                  <div key={i} className={cn('flex items-center gap-3 p-2.5 rounded transition-colors',
                    active ? 'bg-blue-50 dark:bg-blue-900/20' : '')}>
                    <div className={cn('w-7 h-7 rounded flex items-center justify-center shrink-0',
                      done   ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      active ? 'bg-blue-600' :
                               'bg-slate-100 dark:bg-slate-800')}>
                      {done
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        : <s.icon className={cn('w-3.5 h-3.5', active ? 'text-white' : 'text-slate-400')} />}
                    </div>
                    <div>
                      <p className={cn('text-[13px] font-medium',
                        active ? 'text-blue-700 dark:text-blue-300' :
                        done   ? 'text-emerald-600' : 'text-slate-400')}>
                        {s.label}
                      </p>
                      <p className="text-[11px] text-slate-400">{s.subtitle}</p>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-blue-500 ml-auto" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary (shows after step 0 is done) */}
          {step > 0 && (
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Summary</p>
              <div className="space-y-2">
                {[
                  ['Name',       form.firstName ? `${form.firstName} ${form.lastName}` : '—'],
                  ['DOB',        form.dateOfBirth || '—'],
                  ['Gender',     form.gender],
                  ...(step > 1 ? [
                    ['Blood Type', form.bloodType],
                    ['Allergies',  form.allergies.join(', ') || 'None'],
                    ['Conditions', form.chronicConditions.join(', ') || 'None'],
                    ['Insurance',  form.insuranceProvider || 'None / Self-pay'],
                  ] : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <span className="text-slate-400 font-medium">{label}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium text-right max-w-[55%] truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: step form content ─────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Step header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <p className="text-[14px] font-semibold text-slate-800 dark:text-white">{STEPS[step].title}</p>
              <p className="text-[12px] text-slate-400">{STEPS[step].subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5">
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }} className="space-y-4">

                    {/* ── Step 0: Personal ───────────────────────────────────── */}
                    {step === 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>First Name *</label>
                            <input type="text" required value={form.firstName} onChange={e => set('firstName', e.target.value)}
                              className={fieldCls} placeholder="First name" />
                          </div>
                          <div>
                            <label className={labelCls}>Last Name *</label>
                            <input type="text" required value={form.lastName} onChange={e => set('lastName', e.target.value)}
                              className={fieldCls} placeholder="Last name" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Email *</label>
                            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                              className={fieldCls} placeholder="patient@email.com" />
                          </div>
                          <div>
                            <label className={labelCls}>Phone *</label>
                            <input type="tel" required value={form.phone} onChange={e => set('phone', e.target.value)}
                              className={fieldCls} placeholder="+1-555-0000" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Date of Birth *</label>
                            <input type="date" required value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
                              className={fieldCls} max={new Date().toISOString().slice(0, 10)} />
                          </div>
                          <div>
                            <label className={labelCls}>Gender *</label>
                            <div className="flex gap-1.5">
                              {GENDERS.map(g => (
                                <button key={g} type="button" onClick={() => set('gender', g)}
                                  className={cn('flex-1 py-2 rounded text-[12px] font-medium border transition-colors capitalize',
                                    form.gender === g ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300')}>
                                  {g}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Address *</label>
                          <input type="text" required value={form.address} onChange={e => set('address', e.target.value)}
                            className={fieldCls} placeholder="Street address" />
                        </div>
                        <div>
                          <label className={labelCls}>City *</label>
                          <input type="text" required value={form.city} onChange={e => set('city', e.target.value)}
                            className={fieldCls} placeholder="City" />
                        </div>
                      </>
                    )}

                    {/* ── Step 1: Medical ────────────────────────────────────── */}
                    {step === 1 && (
                      <>
                        <div>
                          <label className={labelCls}>Blood Type</label>
                          <div className="flex flex-wrap gap-1.5">
                            {BLOOD_TYPES.map(bt => (
                              <button key={bt} type="button" onClick={() => set('bloodType', bt)}
                                className={cn('px-3 py-1.5 rounded text-[12px] font-medium border transition-colors',
                                  form.bloodType === bt ? 'bg-red-600 border-red-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-300')}>
                                {bt === 'unknown' ? 'Unknown' : bt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <TagInput label="Allergies" placeholder="e.g. Penicillin, Latex" color="red"
                          tags={form.allergies} onChange={v => set('allergies', v)} />
                        <TagInput label="Chronic Conditions" placeholder="e.g. Hypertension, Diabetes" color="amber"
                          tags={form.chronicConditions} onChange={v => set('chronicConditions', v)} />
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                          <p className={`${labelCls} mb-3`}>Insurance (Optional)</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Provider</label>
                              <input type="text" value={form.insuranceProvider} onChange={e => set('insuranceProvider', e.target.value)}
                                className={fieldCls} placeholder="e.g. BlueCross" />
                            </div>
                            <div>
                              <label className={labelCls}>Policy Number</label>
                              <input type="text" value={form.insuranceNumber} onChange={e => set('insuranceNumber', e.target.value)}
                                className={fieldCls} placeholder="e.g. BC-12345" />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── Step 2: Emergency ──────────────────────────────────── */}
                    {step === 2 && (
                      <>
                        <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-[12px] text-amber-700 dark:text-amber-400">
                            Emergency contact will be notified in case of a medical emergency. Please ensure accuracy.
                          </p>
                        </div>
                        <div>
                          <label className={labelCls}>Contact Name *</label>
                          <input type="text" required value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)}
                            className={fieldCls} placeholder="Full name of emergency contact" />
                        </div>
                        <div>
                          <label className={labelCls}>Contact Phone *</label>
                          <input type="tel" required value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)}
                            className={fieldCls} placeholder="+1-555-0000" />
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="px-5 pb-5 flex gap-3 shrink-0 border-t border-slate-100 dark:border-slate-800 pt-4">
                {step > 0 && (
                  <button type="button" onClick={handleBack}
                    className="px-4 py-2 rounded border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Back
                  </button>
                )}
                <div className="flex-1" />
                {step < STEPS.length - 1 ? (
                  <button type="button" onClick={handleNext}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded text-[13px] font-medium hover:bg-blue-700 transition-colors">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded text-[13px] font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                    <Clipboard className="w-3.5 h-3.5" />
                    {saving ? 'Registering…' : 'Register Patient'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPatient;
