import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hospital, Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, KeyRound,
} from 'lucide-react';
import { listPatients, listStaff } from '@/lib/services';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const q = email.trim().toLowerCase();
    if (!q) return;
    setLoading(true);
    try {
      const [staff, patients] = await Promise.all([
        listStaff({ search: q }),
        listPatients({ search: q }),
      ]);
      const found = staff.some(s => s.email.toLowerCase() === q) ||
                    patients.some(p => p.email.toLowerCase() === q);
      if (!found) {
        setError('No account found with this email address.');
        return;
      }
      setSent(true);
    } catch {
      setError('Unable to verify account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-sans selection:bg-blue-100">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-10 w-fit">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
            <Hospital className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">CareFlow</span>
        </Link>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-8">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-5">
                  <KeyRound className="w-7 h-7 text-blue-600" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Forgot Password?</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Enter the email address linked to your account and we'll send a reset link.
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mb-5 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="your@email.com"
                      className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium transition-all"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading || !email.trim()}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  Demo mode: password resets are simulated. Your email must exist in the system for the confirmation to appear.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Check Your Email</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  A password reset link has been sent to
                </p>
                <p className="font-black text-slate-900 dark:text-white mt-1">{email}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2 text-left">
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">What's next?</p>
                <ul className="space-y-1.5">
                  {[
                    'Open the email from CareFlow',
                    'Click the "Reset Password" link',
                    'Choose a new password',
                    'Sign in with your new credentials',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[9px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <button onClick={() => { setSent(false); setEmail(''); }}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Try a Different Email
                </button>
                <Link to="/login"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25">
                  Back to Sign In
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!sent && (
          <div className="mt-8 flex items-center justify-center">
            <Link to="/login" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
