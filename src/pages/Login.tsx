import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Hospital, Lock, Mail, ChevronRight, Activity,
  ShieldCheck, Heart, Stethoscope, AlertCircle, User, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEMO_ACCOUNTS = [
  { label: 'Admin',        name: 'James Carter',       email: 'admin@careflow.com',           role: 'ADMIN',          color: 'from-violet-500 to-purple-600' },
  { label: 'Doctor',       name: 'Dr. Sarah Mitchell', email: 'dr.mitchell@careflow.com',     role: 'DOCTOR',         color: 'from-blue-500 to-blue-700' },
  { label: 'Receptionist', name: 'Anna Martinez',      email: 'anna@careflow.com',             role: 'RECEPTIONIST',   color: 'from-emerald-500 to-teal-600' },
  { label: 'Patient',      name: 'John Anderson',      email: 'john.anderson@email.com',       role: 'PATIENT',        color: 'from-amber-500 to-orange-600' },
  { label: 'Nurse',        name: 'Maria Santos',       email: 'maria@careflow.com',            role: 'NURSE',          color: 'from-pink-500 to-rose-600' },
  { label: 'Pharmacist',   name: 'Daniel Patel',       email: 'daniel.pharma@careflow.com',   role: 'PHARMACIST',     color: 'from-cyan-500 to-sky-600' },
  { label: 'Lab Tech',     name: 'Aaron Foster',       email: 'aaron.lab@careflow.com',       role: 'LAB_TECHNICIAN', color: 'from-lime-500 to-green-600' },
  { label: 'Radiologist',  name: 'Marcus Bennett',     email: 'marcus.rad@careflow.com',      role: 'RADIOLOGIST',    color: 'from-indigo-500 to-violet-600' },
];

const features = [
  { icon: ShieldCheck, title: 'Secure Data',        desc: 'HIPAA-compliant security for all patient records.' },
  { icon: Activity,    title: 'Real-time Analytics', desc: 'Monitor hospital performance instantly.' },
  { icon: Stethoscope, title: 'Clinical Tools',      desc: 'Advanced diagnostics and treatment planning.' },
  { icon: Heart,       title: 'Patient Centric',     desc: 'Designed with patient care as top priority.' },
];

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError('');
    setEmail(demoEmail);
    setIsSubmitting(true);
    try {
      await login(demoEmail);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800" />
        <div className="absolute inset-0">
          <svg className="h-full w-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        <motion.div animate={{ scale: [1,1.2,1], opacity: [0.3,0.5,0.3], x: [0,50,0], y: [0,-30,0] }} transition={{ duration: 10, repeat: Infinity }} className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-30" />
        <motion.div animate={{ scale: [1,1.1,1], opacity: [0.2,0.4,0.2], x: [0,-40,0], y: [0,60,0] }} transition={{ duration: 12, repeat: Infinity }} className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-indigo-500 rounded-full blur-3xl opacity-20" />

        <div className="relative z-10 flex flex-col justify-center px-20 text-white w-full">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-12">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20 shadow-2xl">
              <Hospital className="w-10 h-10 text-white" />
            </div>
            <span className="text-4xl font-black tracking-tighter">CareFlow</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-6xl font-black leading-tight mb-8">
              Empowering <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">Healthcare</span> <br />
              Intelligence
            </h2>
            <p className="text-xl text-blue-100/80 mb-16 max-w-lg font-medium leading-relaxed">
              The unified operating system for modern healthcare providers.
              Efficiency, security, and care in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-10">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="group flex items-start gap-5">
                <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors border border-white/10">
                  <f.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold mb-1.5 text-lg">{f.title}</h4>
                  <p className="text-sm text-blue-100/60 leading-relaxed font-medium">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-10 left-20 z-10">
          <div className="px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-blue-600 bg-blue-400" />)}
            </div>
            <span className="text-xs font-bold text-blue-100/80 tracking-wide uppercase">Trusted by 500+ Hospitals</span>
          </div>
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <Hospital className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">CareFlow</span>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Welcome Back</h1>
            <p className="text-base text-slate-500 dark:text-slate-400 font-medium">
              Sign in with your credentials or use a demo account below.
            </p>
          </div>

          {/* Demo Accounts */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quick Demo Login</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoLogin(acc.email)}
                  disabled={isSubmitting}
                  className="group relative flex flex-col items-start p-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500/40 bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 text-left disabled:opacity-50"
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center mb-2 shadow-sm`}>
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[11px] font-black text-slate-900 dark:text-white leading-none mb-0.5">{acc.label}</span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate w-full">{acc.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">or sign in manually</span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="input-field pl-12 py-4 text-base"
                  placeholder="name@careflow.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 py-4 text-base"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 ml-1 font-medium">
                Any password works in demo mode — email determines your role.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-base font-black flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <AnimatePresence mode="wait">
                {isSubmitting ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                ) : (
                  <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                    Enter Portal
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              New patient?{' '}
              <Link to="/register" className="font-black text-blue-600 hover:underline underline-offset-4 transition-all">
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
