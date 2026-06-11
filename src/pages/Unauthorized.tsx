import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldOff, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg w-full"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-lg mb-8 mx-auto"
        >
          <ShieldOff className="w-12 h-12 text-red-500" />
        </motion.div>

        {/* Title */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="relative inline-block mb-6">
            <span className="text-[100px] font-semibold text-slate-100 dark:text-slate-800 leading-none select-none">
              403
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-red-500">
              Access Denied
            </span>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-4 leading-relaxed"
        >
          You don't have permission to view this page.
        </motion.p>

        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg mb-10"
          >
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Logged in as</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg uppercase tracking-wider">{user.role}</span>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 rounded-md border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:border-red-400/40 hover:text-red-500 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-6 py-3 rounded-md bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all "
          >
            <LayoutDashboard className="w-5 h-5" />
            My Dashboard
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Unauthorized;
