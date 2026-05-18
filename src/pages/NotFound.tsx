import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hospital, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-3xl mb-8 mx-auto"
        >
          <Hospital className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </motion.div>

        {/* 404 text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative inline-block mb-6">
            <span className="text-[120px] font-black text-slate-100 dark:text-slate-800 leading-none select-none">
              404
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-blue-600 dark:text-blue-400">
              Page Not Found
            </span>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-12 leading-relaxed"
        >
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </motion.p>

        {/* Pulse line — like a heartbeat flatline */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex items-center justify-center gap-1 mb-12"
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ scaleY: i === 8 ? [1, 4, 1] : i === 9 ? [1, 6, 1] : i === 10 ? [1, 3, 1] : 1 }}
              transition={{ delay: 0.8 + i * 0.04, duration: 0.3, ease: 'easeOut' }}
              className="w-2 rounded-full bg-blue-300 dark:bg-blue-700"
              style={{ height: '4px' }}
            />
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:border-blue-500/40 hover:text-blue-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25"
          >
            <Home className="w-5 h-5" />
            {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
