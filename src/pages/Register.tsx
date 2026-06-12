import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hospital, ChevronRight, ChevronLeft, CheckCircle2,
  User, Mail, Phone, Calendar, Droplets, AlertCircle,
  MapPin, Users, Loader2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { createPatient } from '@/lib/services';
import type { BloodType } from '@/types';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const COMMON_ALLERGIES = ['Penicillin', 'Sulfa drugs', 'Aspirin', 'Ibuprofen', 'Latex', 'Pollen', 'Dust', 'Peanuts', 'Shellfish', 'None'];
const COMMON_CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart disease', 'Arthritis', 'Depression', 'Anxiety', 'None'];

const STEPS = ['Personal', 'Medical', 'Contact'];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodType: BloodType;
  allergies: string[];
  chronicConditions: string[];
  address: string;
  city: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

const EMPTY: FormState = {
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', gender: 'male', bloodType: 'O+',
  allergies: [], chronicConditions: [],
  address: '', city: '', emergencyContactName: '', emergencyContactPhone: '',
};

const Register: React.FC = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [customAllergy, setCustomAllergy] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const set = (field: keyof FormState, val: string) => setForm(f => ({ ...f, [field]: val }));

  const toggleChip = (field: 'allergies' | 'chronicConditions', val: string) => {
    setForm(f => {
      const arr = f[field];
      if (val === 'None') return { ...f, [field]: arr.includes('None') ? [] : ['None'] };
      const without = arr.filter(x => x !== 'None');
      return { ...f, [field]: arr.includes(val) ? without.filter(x => x !== val) : [...without, val] };
    });
  };

  const canStep0 = form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.phone.trim() && form.dateOfBirth;
  const canStep1 = true;
  const canStep2 = form.address.trim() && form.city.trim() && form.emergencyContactName.trim() && form.emergencyContactPhone.trim();

  const canNext = step === 0 ? canStep0 : step === 1 ? canStep1 : canStep2;

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const allAllergies = form.allergies.filter(a => a !== 'None');
      const allConditions = form.chronicConditions.filter(c => c !== 'None');
      await createPatient({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodType: form.bloodType,
        allergies: allAllergies,
        chronicConditions: allConditions,
        address: form.address.trim(),
        city: form.city.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
      });
      setDone(true);
      setTimeout(() => {
        navigate('/login', { state: { registered: form.email.trim().toLowerCase() } });
      }, 1800);
    } catch {
      setError('Registration failed. This email may already be registered.');
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-5">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto  shadow-emerald-500/40">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Welcome to CareFlow!</h2>
          <p className="text-slate-500 font-medium">Account created. Logging you in…</p>
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans selection:bg-blue-100">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 relative bg-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700" />
        <motion.div animate={{ scale: [1,1.2,1], opacity: [0.3,0.5,0.3] }} transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-30" />
        <motion.div animate={{ scale: [1,1.1,1], opacity: [0.2,0.4,0.2], y: [0,40,0] }} transition={{ duration: 12, repeat: Infinity }}
          className="absolute -bottom-32 -right-16 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white w-full">
          <Link to="/" className="flex items-center gap-3 mb-16">
            <div className="p-3 bg-white/10 rounded-md border border-white/20"><Hospital className="w-7 h-7 text-white" /></div>
            <span className="text-3xl font-semibold tracking-tight">CareFlow</span>
          </Link>

          <h2 className="text-5xl font-semibold leading-tight mb-6">
            Your Health,<br />
            <span className="text-blue-200">Your Records</span>
          </h2>
          <p className="text-blue-100/80 text-lg font-medium mb-12 leading-relaxed max-w-sm">
            Create your patient account to book appointments, view prescriptions, and track your health journey.
          </p>

          <div className="space-y-4">
            {[
              'Book appointments online in seconds',
              'Access your medical records anytime',
              'View prescriptions and lab results',
              'Receive appointment reminders',
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-blue-100/80 font-medium text-sm">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="p-2.5 bg-blue-600 rounded-lg shadow-sm shadow-blue-500/30"><Hospital className="w-6 h-6 text-white" /></div>
            <span className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">CareFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Create Account</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Patient self-registration · Free</p>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1">
                <div className={cn('h-1.5 rounded-full transition-all duration-300',
                  i < step ? 'bg-emerald-500' : i === step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700')} />
                <p className={cn('text-[9px] font-semibold uppercase tracking-widest mt-1',
                  i === step ? 'text-blue-600' : 'text-slate-400')}>{s}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ── Step 0: Personal ── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)}
                        placeholder="Jane" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Last Name</label>
                    <input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)}
                      placeholder="Doe" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="jane@example.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Gender</label>
                    <select value={form.gender} onChange={e => set('gender', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm outline-none cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Registration creates a patient record. Use your credentials to log in after registration.
                </p>
              </motion.div>
            )}

            {/* ── Step 1: Medical ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5" /> Blood Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BLOOD_TYPES.map(bt => (
                      <button key={bt} onClick={() => set('bloodType', bt)}
                        className={cn('px-4 py-2 rounded-lg text-xs font-semibold border-2 transition-all',
                          form.bloodType === bt
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700'
                            : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500 hover:border-blue-300')}>
                        {bt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Allergies</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGIES.map(a => (
                      <button key={a} onClick={() => toggleChip('allergies', a)}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all',
                          form.allergies.includes(a)
                            ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600'
                            : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500 hover:border-slate-300')}>
                        {a}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <input type="text" value={customAllergy} onChange={e => setCustomAllergy(e.target.value)}
                      placeholder="Other allergy…"
                      onKeyDown={e => { if (e.key === 'Enter' && customAllergy.trim()) { toggleChip('allergies', customAllergy.trim()); setCustomAllergy(''); } }}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={() => { if (customAllergy.trim()) { toggleChip('allergies', customAllergy.trim()); setCustomAllergy(''); } }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">Add</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Chronic Conditions</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_CONDITIONS.map(c => (
                      <button key={c} onClick={() => toggleChip('chronicConditions', c)}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all',
                          form.chronicConditions.includes(c)
                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700'
                            : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500 hover:border-slate-300')}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <input type="text" value={customCondition} onChange={e => setCustomCondition(e.target.value)}
                      placeholder="Other condition…"
                      onKeyDown={e => { if (e.key === 'Enter' && customCondition.trim()) { toggleChip('chronicConditions', customCondition.trim()); setCustomCondition(''); } }}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={() => { if (customCondition.trim()) { toggleChip('chronicConditions', customCondition.trim()); setCustomCondition(''); } }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">Add</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Contact ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Street Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
                      placeholder="123 Main Street"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">City</label>
                  <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                    placeholder="New York"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Emergency Contact
                  </p>
                  <input type="text" value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)}
                    placeholder="Contact full name"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="tel" value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)}
                      placeholder="Contact phone number"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            <button onClick={() => step === 0 ? navigate('/login') : setStep(s => s - 1)}
              className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              {step === 0 ? 'Sign In' : 'Back'}
            </button>
            {step < 2 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext}
                className="flex-2 py-3.5 bg-blue-600 text-white rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving || !canNext}
                className="flex-2 py-3.5 bg-emerald-600 text-white rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Account'}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 font-medium mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline underline-offset-4">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
