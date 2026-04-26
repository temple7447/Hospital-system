import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/auth';
import { Hospital, Lock, Mail, ChevronRight, Activity, ShieldCheck, Heart, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('PATIENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate network delay for better UX
    setTimeout(async () => {
      try {
        await login(email, role);
        navigate('/dashboard');
      } catch (error) {
        console.error('Login failed:', error);
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const features = [
    { icon: ShieldCheck, title: 'Secure Data', desc: 'HIPAA compliant security for all patient records.' },
    { icon: Activity, title: 'Real-time Analytics', desc: 'Monitor hospital performance instantly.' },
    { icon: Stethoscope, title: 'Clinical Tools', desc: 'Advanced diagnostics and treatment planning.' },
    { icon: Heart, title: 'Patient Centric', desc: 'Designed with patient care as top priority.' }
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Left Side - Visual/Marketing */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-600 overflow-hidden">
        {/* Animated Background Elements */}
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
        
        {/* Floating Circles */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-30" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-indigo-500 rounded-full blur-3xl opacity-20" 
        />

        <div className="relative z-10 flex flex-col justify-center px-20 text-white w-full">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-12"
          >
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20 shadow-2xl">
              <Hospital className="w-10 h-10 text-white" />
            </div>
            <span className="text-4xl font-black tracking-tighter">CareFlow</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
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
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="group flex items-start gap-5"
              >
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

        {/* Bottom Badge */}
        <div className="absolute bottom-10 left-20 z-10">
          <div className="px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-blue-600 bg-blue-400" />
              ))}
            </div>
            <span className="text-xs font-bold text-blue-100/80 tracking-wide uppercase">Trusted by 500+ Hospitals</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <Hospital className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">CareFlow</span>
          </div>

          <div className="mb-12">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Welcome Back</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
              Access your medical dashboard with secure credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">
                Professional Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12 py-4 text-base"
                  placeholder="name@hospital.com"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 py-4 text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`relative px-4 py-3 text-xs font-bold rounded-xl border-2 transition-all duration-300 ${
                      role === r
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-500/50 hover:text-blue-600'
                    }`}
                  >
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                    {role === r && (
                      <motion.div 
                        layoutId="activeRole"
                        className="absolute inset-0 bg-blue-600 rounded-xl -z-10"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <AnimatePresence mode="wait">
                {isSubmitting ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" 
                  />
                ) : (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    Enter Portal
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </form>

          <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-900">
            <p className="text-center text-slate-500 dark:text-slate-400 font-medium">
              Need access? <a href="#" className="font-bold text-blue-600 hover:underline underline-offset-4 transition-all">Request Credentials</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
