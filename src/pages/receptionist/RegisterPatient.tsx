import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  User, Heart, AlertTriangle,
  ChevronRight, ChevronLeft, CheckCircle2,
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

const steps = [
  { label: 'Personal',  icon: User,          title: 'Personal Details',     subtitle: 'Basic patient information' },
  { label: 'Medical',   icon: Heart,          title: 'Medical Information',  subtitle: 'Health history and blood type' },
  { label: 'Emergency', icon: AlertTriangle,  title: 'Emergency Contact',    subtitle: 'Who to contact in an emergency' },
];

// Small tag input component
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
      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className={cn('flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold',
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
          placeholder={placeholder} className="input-field py-2.5 text-sm flex-1" />
        <button type="button" onClick={add}
          className="px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const RegisterPatient: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(empty());
  const [createdPatient, setCreatedPatient] = useState<{ name: string; number: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.dateOfBirth || !form.address || !form.city) {
        toast.error('Please fill in all required fields');
        return false;
      }
    }
    if (step === 2) {
      if (!form.emergencyContactName || !form.emergencyContactPhone) {
        toast.error('Emergency contact details are required');
        return false;
      }
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
      const patientId = await createPatient({
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
      const patientNumber = `P-${patientId.slice(-6).toUpperCase()}`;
      const name = `${form.firstName} ${form.lastName}`;
      setCreatedPatient({ name, number: patientNumber });
      toast.success('Patient registered successfully');
    } catch {
      toast.error('Registration failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Success Screen ──────────────────────────────────────────────────────────
  if (createdPatient) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto mt-16 text-center">
        <div className="glass-card rounded-3xl p-10">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </motion.div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Patient Registered!</h2>
          <p className="text-slate-500 font-medium mb-6">{createdPatient.name} has been added to the system</p>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-8">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Patient ID</p>
            <p className="text-3xl font-black text-blue-600 tracking-wider">{createdPatient.number}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate('/appointments')}
              className="btn-primary py-3 flex items-center justify-center gap-2 font-bold">
              <Calendar className="w-4 h-4" /> Book Appointment Now
            </button>
            <button onClick={() => { setForm(empty()); setCreatedPatient(null); setStep(0); }}
              className="py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-blue-500/40 transition-all">
              Register Another Patient
            </button>
            <button onClick={() => navigate('/patients')}
              className="text-sm font-bold text-blue-600 hover:text-blue-500 transition-colors">
              View All Patients →
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Register New Patient</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Enter patient details to create their hospital record</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center mb-10">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 font-black text-sm',
                  done   ? 'bg-emerald-600 text-white' :
                  active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' :
                           'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                  {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={cn('text-[10px] font-black uppercase tracking-wider hidden sm:block',
                  active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-slate-400')}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-3 transition-colors duration-300', i < step ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700')} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Form Card */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{steps[step].title}</h2>
          <p className="text-sm text-slate-500 font-medium">{steps[step].subtitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="p-6 space-y-5">

              {/* ── Step 0: Personal ──────────────────────────────────────────── */}
              {step === 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {[['First Name *', 'firstName'], ['Last Name *', 'lastName']].map(([label, key]) => (
                      <div key={key}>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                        <input type="text" required value={form[key as keyof FormData] as string}
                          onChange={e => set(key as keyof FormData, e.target.value as never)}
                          className="input-field py-2.5 text-sm" placeholder={label.replace(' *', '')} />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
                      <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                        className="input-field py-2.5 text-sm" placeholder="patient@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Phone *</label>
                      <input type="tel" required value={form.phone} onChange={e => set('phone', e.target.value)}
                        className="input-field py-2.5 text-sm" placeholder="+1-555-0000" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Date of Birth *</label>
                      <input type="date" required value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
                        className="input-field py-2.5 text-sm" max={new Date().toISOString().slice(0, 10)} />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Gender *</label>
                      <div className="flex gap-2">
                        {GENDERS.map(g => (
                          <button key={g} type="button" onClick={() => set('gender', g)}
                            className={cn('flex-1 py-2.5 rounded-xl text-xs font-black capitalize border-2 transition-all',
                              form.gender === g ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-blue-300')}>
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Address *</label>
                    <input type="text" required value={form.address} onChange={e => set('address', e.target.value)}
                      className="input-field py-2.5 text-sm" placeholder="Street address" />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">City *</label>
                    <input type="text" required value={form.city} onChange={e => set('city', e.target.value)}
                      className="input-field py-2.5 text-sm" placeholder="City" />
                  </div>
                </>
              )}

              {/* ── Step 1: Medical ──────────────────────────────────────────── */}
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Blood Type</label>
                    <div className="flex flex-wrap gap-2">
                      {BLOOD_TYPES.map(bt => (
                        <button key={bt} type="button" onClick={() => set('bloodType', bt)}
                          className={cn('px-4 py-2 rounded-xl text-xs font-black border-2 transition-all',
                            form.bloodType === bt ? 'bg-red-600 border-red-600 text-white' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-red-300')}>
                          {bt === 'unknown' ? 'Unknown' : bt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <TagInput label="Allergies" placeholder="e.g. Penicillin, Latex" color="red"
                    tags={form.allergies} onChange={v => set('allergies', v)} />

                  <TagInput label="Chronic Conditions" placeholder="e.g. Hypertension, Diabetes" color="amber"
                    tags={form.chronicConditions} onChange={v => set('chronicConditions', v)} />

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Insurance (Optional)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Provider</label>
                        <input type="text" value={form.insuranceProvider} onChange={e => set('insuranceProvider', e.target.value)}
                          className="input-field py-2.5 text-sm" placeholder="e.g. BlueCross" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Policy Number</label>
                        <input type="text" value={form.insuranceNumber} onChange={e => set('insuranceNumber', e.target.value)}
                          className="input-field py-2.5 text-sm" placeholder="e.g. BC-12345" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 2: Emergency ────────────────────────────────────────── */}
              {step === 2 && (
                <>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Emergency contact will be notified in case of a medical emergency. Please ensure accuracy.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Contact Name *</label>
                    <input type="text" required value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)}
                      className="input-field py-2.5 text-sm" placeholder="Full name of emergency contact" />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Contact Phone *</label>
                    <input type="tel" required value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)}
                      className="input-field py-2.5 text-sm" placeholder="+1-555-0000" />
                  </div>

                  {/* Summary */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Registration Summary</p>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-2">
                      {[
                        ['Name',       `${form.firstName} ${form.lastName}`],
                        ['DOB',        form.dateOfBirth || '—'],
                        ['Blood Type', form.bloodType],
                        ['Allergies',  form.allergies.join(', ') || 'None'],
                        ['Conditions', form.chronicConditions.join(', ') || 'None'],
                        ['Insurance',  form.insuranceProvider || 'None / Self-pay'],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between text-xs">
                          <span className="font-bold text-slate-400">{label}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 text-right max-w-[60%] truncate">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            {step > 0 && (
              <button type="button" onClick={handleBack}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-all">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <div className="flex-1" />
            {step < steps.length - 1 ? (
              <button type="button" onClick={handleNext}
                className="btn-primary px-6 py-3 flex items-center gap-2 text-sm font-bold">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={saving}
                className="btn-primary px-8 py-3 flex items-center gap-2 text-sm font-bold disabled:opacity-50">
                <Clipboard className="w-4 h-4" /> {saving ? 'Registering…' : 'Register Patient'}
              </button>
            )}
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default RegisterPatient;
