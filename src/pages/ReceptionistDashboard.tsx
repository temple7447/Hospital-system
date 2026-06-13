import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, Users, CreditCard, UserPlus, Receipt,
  ArrowUpRight, ChevronRight, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import {
  getReceptionistStats,
  listAppointments,
  listPatients,
  listStaff,
} from '@/lib/services';
import type { Appointment, Patient, Staff } from '@/types';

const STATUS_CFG = {
  scheduled:   { label: 'Scheduled',   cls: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
  confirmed:   { label: 'Confirmed',   cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' },
  completed:   { label: 'Completed',   cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-50 text-red-500 dark:bg-red-900/20' },
  no_show:     { label: 'No Show',     cls: 'bg-slate-100 text-slate-400 dark:bg-slate-800' },
} as const;

const ReceptionistDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apts, setApts] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);

  const { data: stats } = useApi(getReceptionistStats);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      listAppointments({ date: today }),
      listPatients({ limit: 500 }),
      listStaff({ role: 'DOCTOR' }),
    ]).then(([aptList, patientList, staffList]) => {
      setApts(aptList.slice().sort((a, b) => a.time.localeCompare(b.time)));
      setPatients(patientList);
      setDoctors(staffList);
    });
  }, []);

  const getPatient = (id: string) => patients.find(p => p.id === id);
  const getDoctor  = (id: string) => doctors.find(d => d.id === id || d.userId === id);

  const waiting  = apts.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;
  const progress = apts.filter(a => a.status === 'in_progress').length;
  const done     = apts.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Reception Desk</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Hello, {user?.name.split(' ')[0]}. Manage today's patient flow.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => navigate('/receptionist/register')}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-md font-bold  hover:bg-blue-700 transition-all ">
            <UserPlus className="w-4 h-4" /> Register Patient
          </button>
          <button onClick={() => navigate('/appointments')}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-md font-bold hover:bg-slate-50 transition-all">
            <Calendar className="w-4 h-4" /> Appointments
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Appointments", value: stats?.todayAppointments ?? '—', icon: Calendar,    color: 'blue',    path: '/appointments' },
          { label: 'New Registrations',    value: stats?.todayRegistrations ?? '—',icon: UserPlus,    color: 'emerald', path: '/patients' },
          { label: 'Waiting Queue',        value: stats?.waitingQueue ?? '—',      icon: Clock,       color: 'amber',   path: '/appointments' },
          { label: 'Pending Payments',     value: stats?.pendingPayments ?? '—',   icon: CreditCard,  color: 'purple',  path: '/receptionist/billing' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            onClick={() => navigate(s.path)}
            className="glass-card p-5 rounded-md cursor-pointer hover:shadow-sm transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-md flex items-center justify-center',
                s.color === 'blue'   && 'bg-blue-50 dark:bg-blue-900/20',
                s.color === 'emerald'&& 'bg-emerald-50 dark:bg-emerald-900/20',
                s.color === 'amber'  && 'bg-amber-50 dark:bg-amber-900/20',
                s.color === 'purple' && 'bg-purple-50 dark:bg-purple-900/20',
              )}>
                <s.icon className={cn('w-5 h-5',
                  s.color === 'blue'   && 'text-blue-600',
                  s.color === 'emerald'&& 'text-emerald-600',
                  s.color === 'amber'  && 'text-amber-600',
                  s.color === 'purple' && 'text-purple-600',
                )} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Progress summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4">
        {[
          { label: 'Waiting',     value: waiting,  color: 'amber',   icon: Clock },
          { label: 'In Progress', value: progress, color: 'blue',    icon: AlertCircle },
          { label: 'Completed',   value: done,     color: 'emerald', icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} className={cn('p-4 rounded-md border flex items-center gap-3',
            s.color === 'amber'  && 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
            s.color === 'blue'   && 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
            s.color === 'emerald'&& 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
          )}>
            <s.icon className={cn('w-5 h-5 shrink-0',
              s.color === 'amber'  && 'text-amber-600',
              s.color === 'blue'   && 'text-blue-600',
              s.color === 'emerald'&& 'text-emerald-600',
            )} />
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's appointment list */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 glass-card rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white">Today's Appointments</h3>
            <button onClick={() => navigate('/appointments')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-500 uppercase tracking-widest">
              Manage All
            </button>
          </div>
          {apts.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 font-bold text-sm">No appointments today</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {apts.slice(0, 8).map(a => {
                const p   = getPatient(a.patientId);
                const doc = getDoctor(a.doctorId);
                const cfg = STATUS_CFG[a.status] ?? STATUS_CFG.scheduled;
                return (
                  <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[10px] font-semibold text-blue-600 shrink-0">
                      {p ? `${p.firstName[0]}${p.lastName[0]}` : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {p ? `${p.firstName} ${p.lastName}` : '—'}
                      </p>
                      <p className="text-xs text-slate-400 font-bold">
                        {doc ? `Dr. ${doc.firstName} ${doc.lastName}` : '—'}
                        {' · '}{a.time}
                      </p>
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase hidden sm:block', cfg.cls)}>
                      {cfg.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Register New Patient', icon: UserPlus,  path: '/receptionist/register', color: 'blue' },
              { label: 'Billing & Payment',    icon: Receipt,   path: '/receptionist/billing',  color: 'amber' },
              { label: 'All Appointments',     icon: Calendar,  path: '/appointments',           color: 'purple' },
              { label: 'Patient Records',      icon: Users,     path: '/patients',               color: 'emerald' },
            ].map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-all group text-left">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                  a.color === 'blue'   && 'bg-blue-50 dark:bg-blue-900/20',
                  a.color === 'amber'  && 'bg-amber-50 dark:bg-amber-900/20',
                  a.color === 'purple' && 'bg-purple-50 dark:bg-purple-900/20',
                  a.color === 'emerald'&& 'bg-emerald-50 dark:bg-emerald-900/20',
                )}>
                  <a.icon className={cn('w-4 h-4',
                    a.color === 'blue'   && 'text-blue-600',
                    a.color === 'amber'  && 'text-amber-600',
                    a.color === 'purple' && 'text-purple-600',
                    a.color === 'emerald'&& 'text-emerald-600',
                  )} />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors flex-1">
                  {a.label}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
