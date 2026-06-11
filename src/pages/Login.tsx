import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Hospital, Lock, Mail, ChevronRight,
  ShieldCheck, Activity, Stethoscope, Heart,
  AlertCircle, CheckCircle2, User,
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Admin',        email: 'admin',                   pwd: 'admin123' },
  { label: 'Doctor',       email: 'doctor1',                 pwd: 'admin123' },
  { label: 'Receptionist', email: 'reception',               pwd: 'admin123' },
  { label: 'Nurse',        email: 'nurse1',                  pwd: 'admin123' },
  { label: 'Pharmacist',   email: 'pharmacist1',             pwd: 'admin123' },
  { label: 'Lab Tech',     email: 'labtech1',                pwd: 'admin123' },
  { label: 'Radiologist',  email: 'radiologist1',            pwd: 'admin123' },
  { label: 'Patient',      email: 'john.anderson@email.com', pwd: '' },
];

const features = [
  { icon: ShieldCheck, title: 'HIPAA Compliant',     desc: 'End-to-end encrypted patient records.' },
  { icon: Activity,    title: 'Real-time Analytics', desc: 'Live dashboards for every department.' },
  { icon: Stethoscope, title: 'Clinical Workflows',  desc: 'SOAP notes, prescriptions, lab orders.' },
  { icon: Heart,       title: 'Patient Portal',      desc: 'Appointments, results, and billing.' },
];

const LoginPage: React.FC = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  // Always go to /dashboard after login — each role's dashboard handles its own view.
  // Using `from` caused nurses/pharmacists etc. to land on admin-only pages and get 403.
  const from = '/dashboard';

  useEffect(() => {
    const reg = (location.state as { registered?: string })?.registered;
    if (reg) { setRegisteredEmail(reg); setEmail(reg); }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPwd: string) => {
    setError('');
    setEmail(demoEmail);
    setPassword(demoPwd);
    setIsSubmitting(true);
    try {
      await login(demoEmail, demoPwd);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans">

      {/* Left panel — solid blue, no animations */}
      <div className="hidden lg:flex lg:w-[42%] flex-col bg-blue-600 text-white p-12 xl:p-16">
        <div className="flex items-center gap-2.5 mb-16">
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
            <Hospital className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">CareFlow</span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-4xl xl:text-5xl font-semibold leading-tight mb-5 tracking-tight">
            Hospital Management<br />
            <span className="text-blue-200">Made Simple</span>
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed mb-12 max-w-sm">
            A unified platform for doctors, nurses, pharmacists, lab technicians,
            and administrators — all in one place.
          </p>

          <div className="grid grid-cols-1 gap-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{f.title}</p>
                  <p className="text-blue-200 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-xs">
          &copy; {new Date().getFullYear()} CareFlow Health Systems.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Hospital className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900 dark:text-white">CareFlow</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1.5">Sign in</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter your credentials or use a demo account below.
            </p>
            {registeredEmail && (
              <div className="mt-4 flex items-center gap-2.5 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Account created. Sign in below.
                </p>
              </div>
            )}
          </div>

          {/* Demo accounts */}
          <div className="mb-6">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Demo accounts
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoLogin(acc.email, acc.pwd)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs text-slate-400 uppercase tracking-wider">or sign in manually</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2.5 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="input-field pl-9"
                  placeholder="username or email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            Credentials validated against the backend server.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
