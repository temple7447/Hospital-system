import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, FlaskConical, CheckCircle2, Clock,
  CalendarDays, ClipboardList, Pill, FileText,
  ArrowUpRight, ChevronRight,
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import {
  getDoctorStats,
  listAppointments,
  listPatients,
} from '@/lib/services';
import type { Appointment, Patient } from '@/types';

const STATUS_CFG = {
  scheduled:   { label: 'Scheduled',   cls: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
  confirmed:   { label: 'Confirmed',   cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' },
  completed:   { label: 'Completed',   cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-50 text-red-500 dark:bg-red-900/20' },
  no_show:     { label: 'No Show',     cls: 'bg-slate-100 text-slate-400 dark:bg-slate-800' },
} as const;

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todayApts, setTodayApts] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [weekData, setWeekData] = useState<{ day: string; count: number }[]>([]);
  const [nextApt, setNextApt] = useState<Appointment | null>(null);

  const { data: stats } = useApi(getDoctorStats);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);

    // Load today's appointments and all recent appointments (for weekly chart + next apt)
    Promise.all([
      listAppointments({ date: today, doctor_id: user.id }),
      listPatients({ limit: 500 }),
      // Fetch last 7 days + upcoming for weekly chart and next appointment
      listAppointments({ doctor_id: user.id }),
    ]).then(([todayList, patientList, allApts]) => {
      setTodayApts(todayList.slice().sort((a, b) => a.time.localeCompare(b.time)));
      setPatients(patientList);

      // Build weekly chart data
      const now = new Date();
      const weekly = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - 6 + i);
        const dateStr = d.toISOString().slice(0, 10);
        return {
          day: DAYS[d.getDay()],
          count: allApts.filter(a => a.date === dateStr).length,
        };
      });
      setWeekData(weekly);

      // Find next upcoming appointment
      const upcoming = allApts
        .filter(a => a.date >= today && (a.status === 'scheduled' || a.status === 'confirmed'))
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      setNextApt(upcoming[0] ?? null);
    });
  }, [user]);

  const getPatient = (id: string) => patients.find(p => p.id === id);
  const nextPatient = nextApt ? getPatient(nextApt.patientId) : null;

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Good day, Dr. {user?.name.split(' ').pop()}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {stats.todayAppointments} appointment{stats.todayAppointments !== 1 ? 's' : ''} scheduled for today
          </p>
        </div>
        <button onClick={() => navigate('/doctor/prescription/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-md font-bold  hover:bg-blue-700 transition-all  self-start">
          <Pill className="w-4 h-4" /> Write Prescription
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Appointments", value: stats.todayAppointments, icon: Calendar,     color: 'blue',    path: '/doctor/schedule' },
          { label: 'Completed Today',       value: stats.completedToday,   icon: CheckCircle2, color: 'emerald', path: '/appointments' },
          { label: 'Total Patients',        value: stats.totalPatients,    icon: Users,        color: 'purple',  path: '/patients' },
          { label: 'Pending Lab Orders',    value: stats.pendingLabOrders, icon: FlaskConical, color: 'amber',   path: '/doctor/lab-orders' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            onClick={() => navigate(s.path)}
            className="glass-card p-5 rounded-md cursor-pointer hover:shadow-sm transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-md flex items-center justify-center',
                s.color === 'blue'   && 'bg-blue-50 dark:bg-blue-900/20',
                s.color === 'emerald'&& 'bg-emerald-50 dark:bg-emerald-900/20',
                s.color === 'purple' && 'bg-purple-50 dark:bg-purple-900/20',
                s.color === 'amber'  && 'bg-amber-50 dark:bg-amber-900/20',
              )}>
                <s.icon className={cn('w-5 h-5',
                  s.color === 'blue'   && 'text-blue-600',
                  s.color === 'emerald'&& 'text-emerald-600',
                  s.color === 'purple' && 'text-purple-600',
                  s.color === 'amber'  && 'text-amber-600',
                )} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's queue */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass-card rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white">Today's Queue</h3>
            <button onClick={() => navigate('/doctor/schedule')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-500 uppercase tracking-widest">
              Full Schedule
            </button>
          </div>
          {todayApts.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 font-bold text-sm">No appointments today</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {todayApts.map(a => {
                const p = getPatient(a.patientId);
                const cfg = STATUS_CFG[a.status] ?? STATUS_CFG.scheduled;
                return (
                  <button key={a.id} onClick={() => p && navigate(`/doctor/patient/${p.id}`)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all text-left">
                    <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[11px] font-semibold text-blue-600 shrink-0">
                      {p ? `${p.firstName[0]}${p.lastName[0]}` : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {p ? `${p.firstName} ${p.lastName}` : a.patientId}
                      </p>
                      <p className="text-xs text-slate-400 font-bold mt-0.5 capitalize">{a.type.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                        <Clock className="w-3.5 h-3.5" /> {a.time}
                      </div>
                      <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase hidden sm:block', cfg.cls)}>
                        {cfg.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Weekly chart */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card p-5 rounded-lg">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Last 7 Days</h3>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekData}>
                  <defs>
                    <linearGradient id="docFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Tooltip
                    formatter={(v: number) => [v, 'Appointments']}
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, border: 'none', fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#docFlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Next appointment */}
          {nextApt && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="p-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg text-white ">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-100 mb-3">Next Patient</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-md bg-white/20 flex items-center justify-center text-xs font-semibold">
                  {nextPatient ? `${nextPatient.firstName[0]}${nextPatient.lastName[0]}` : '?'}
                </div>
                <div>
                  <p className="font-semibold">
                    {nextPatient ? `${nextPatient.firstName} ${nextPatient.lastName}` : '—'}
                  </p>
                  <p className="text-xs text-blue-200 font-medium capitalize">{nextApt.type.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-100 font-bold">
                <Clock className="w-3.5 h-3.5" />
                {nextApt.date} · {nextApt.time}
              </div>
              {nextPatient && (
                <button onClick={() => navigate(`/doctor/patient/${nextPatient.id}`)}
                  className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-md text-xs font-semibold uppercase tracking-widest transition-all">
                  Open Record
                </button>
              )}
            </motion.div>
          )}

          {/* Quick links */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-card p-5 rounded-lg">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Quick Links</h3>
            <div className="space-y-1">
              {[
                { label: 'My Schedule',   icon: CalendarDays, path: '/doctor/schedule' },
                { label: 'Write Rx',      icon: Pill,         path: '/doctor/prescription/new' },
                { label: 'Lab Orders',    icon: FlaskConical, path: '/doctor/lab-orders' },
                { label: 'Patient List',  icon: Users,        path: '/patients' },
              ].map(l => (
                <button key={l.path} onClick={() => navigate(l.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group text-left">
                  <l.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition-colors">{l.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
