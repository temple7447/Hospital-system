import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ClipboardCheck, HeartPulse, Users, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import {
  getNurseStats,
  listNursingTasks,
  listPatients,
} from '@/lib/services';
import type { NursingTask, Patient } from '@/types';

const TASK_CFG = {
  medication: { color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',     label: 'Medication' },
  vitals:     { color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20', label: 'Vitals' },
  wound_care: { color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',   label: 'Wound Care' },
  assessment: { color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20', label: 'Assessment' },
  other:      { color: 'bg-slate-100 text-slate-600 dark:bg-slate-800',     label: 'Other' },
} as const;

const NurseDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pending, setPending] = useState<NursingTask[]>([]);
  const [completed, setCompleted] = useState<NursingTask[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const { data: stats } = useApi(getNurseStats);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      listNursingTasks({ nurse_id: user.id, status: 'pending' }),
      listNursingTasks({ nurse_id: user.id, status: 'completed' }),
      listPatients({ limit: 500 }),
    ]).then(([pendingTasks, completedTasks, patientList]) => {
      setPending(pendingTasks.slice(0, 6));
      setCompleted(completedTasks.slice(0, 4));
      setPatients(patientList);
    });
  }, [user]);

  if (!user) return null;

  const getPatient = (id: string) => patients.find(p => p.id === id);

  const KPI = [
    { label: 'My Patients',    value: stats?.myPatients ?? '—',          icon: Users,          color: 'blue' },
    { label: 'Tasks Today',    value: stats?.tasksToday ?? '—',          icon: ClipboardCheck, color: 'violet' },
    { label: 'Completed',      value: stats?.tasksCompleted ?? '—',      icon: CheckCircle2,   color: 'emerald' },
    { label: 'Vitals Recorded',value: stats?.vitalsRecordedToday ?? '—', icon: HeartPulse,     color: 'rose' },
  ];

  return (
    <div className="space-y-8 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Welcome, {user.name.split(' ')[0]}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Nursing shift overview</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-5 rounded-lg">
            <div className={cn('w-10 h-10 rounded-md flex items-center justify-center mb-3',
              k.color === 'blue'    && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
              k.color === 'violet'  && 'bg-violet-50 dark:bg-violet-900/20 text-violet-600',
              k.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
              k.color === 'rose'    && 'bg-rose-50 dark:bg-rose-900/20 text-rose-600',
            )}>
              <k.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{k.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Pending Tasks</h3>
              <p className="text-xs text-slate-400 font-bold">Next up on your shift</p>
            </div>
            <Link to="/nurse/tasks" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</Link>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium text-sm">All tasks completed. Great work!</div>
          ) : (
            <div className="space-y-3">
              {pending.map(t => {
                const patient = getPatient(t.patientId);
                const cfg = TASK_CFG[t.type];
                return (
                  <Link key={t.id} to={`/nurse/tasks?id=${t.id}`}
                    className="flex items-center gap-4 p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', cfg.color)}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{t.description}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'} · {cfg.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Clock className="w-3 h-3" />
                      {new Date(t.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-card rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Completed Today</h3>
          <p className="text-xs text-slate-400 font-bold mb-5">Recent activity</p>
          {completed.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium">No completed tasks yet</p>
          ) : (
            <div className="space-y-3">
              {completed.map(t => (
                <div key={t.id} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.description}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {t.completedAt && new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <Link to="/nurse/patients" className="block py-2.5 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-xs font-semibold text-center hover:bg-blue-100 transition-colors">
              View Patients
            </Link>
            <Link to="/nurse/vitals" className="block py-2.5 px-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-xs font-semibold text-center hover:bg-emerald-100 transition-colors">
              Record Vitals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
