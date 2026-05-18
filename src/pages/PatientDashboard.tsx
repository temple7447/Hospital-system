import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Pill, Receipt, Activity, Clock, Stethoscope,
  Heart, Droplets, Thermometer, AlertTriangle, ArrowUpRight,
  CheckCircle2, FlaskConical,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Appointment, Prescription, Staff, VitalRecord } from '../types';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apts, setApts] = useState<Appointment[]>([]);
  const [rxs, setRxs] = useState<Prescription[]>([]);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);

  useEffect(() => {
    if (!user) return;
    setApts(db.appointments.getByPatient(user.id));
    setRxs(db.prescriptions.getActiveByPatient(user.id));
    setVitals(db.vitals.getByPatient(user.id).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)));
    setDoctors(db.staff.getDoctors());
  }, [user]);

  const stats = useMemo(() => user ? db.stats.patient(user.id) : null, [user]);

  const today = new Date().toISOString().split('T')[0];

  const nextApt = useMemo(() =>
    apts.filter(a => a.date >= today && (a.status === 'scheduled' || a.status === 'confirmed'))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0] ?? null,
    [apts, today]);

  const nextDoctor = nextApt ? doctors.find(d => d.id === nextApt.doctorId) : null;

  const latestVital: VitalRecord | null = vitals[0] ?? null;

  const hasExpiringSoon = rxs.some(rx => {
    const diff = new Date(rx.expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 7 * 86400000;
  });

  if (!stats) return null;

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Your health summary and upcoming appointments
          </p>
        </div>
        <button onClick={() => navigate('/patient/book')}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 self-start">
          <Calendar className="w-4 h-4" /> Book Appointment
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming Apts',       value: stats.upcomingAppointments, icon: Calendar,    color: 'blue',    path: '/patient/appointments' },
          { label: 'Active Prescriptions',value: stats.activePrescriptions,  icon: Pill,        color: 'emerald', path: '/patient/prescriptions' },
          { label: 'Pending Bills',       value: stats.pendingBills,         icon: Receipt,     color: 'amber',   path: '/patient/bills' },
          { label: 'Total Visits',        value: stats.totalVisits,          icon: CheckCircle2,color: 'purple',  path: '/patient/appointments' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            onClick={() => navigate(s.path)}
            className="glass-card p-5 rounded-2xl cursor-pointer hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center',
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
            <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Expiring Rx alert */}
      {hasExpiringSoon && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          onClick={() => navigate('/patient/prescriptions')}
          className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl cursor-pointer hover:bg-amber-100 transition-all">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
            You have prescriptions expiring within 7 days — view them now.
          </p>
          <ArrowUpRight className="w-4 h-4 text-amber-500 ml-auto shrink-0" />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Next appointment hero */}
          {nextApt ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-7 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
              <div className="relative z-10">
                <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Next Appointment
                </span>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                      <Stethoscope className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">
                        {nextDoctor ? `Dr. ${nextDoctor.firstName} ${nextDoctor.lastName}` : 'Your Doctor'}
                      </h3>
                      <p className="text-blue-200 font-medium text-sm">
                        {nextDoctor?.specialization ?? 'Specialist'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Date</p>
                      <p className="font-black text-lg">{fmtDate(nextApt.date)}</p>
                    </div>
                    <div>
                      <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Time</p>
                      <p className="font-black text-lg">{nextApt.time}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-wider capitalize">
                    {nextApt.type.replace('_', ' ')}
                  </span>
                  <span className="px-2.5 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    {nextApt.appointmentNumber}
                  </span>
                </div>
              </div>
              <Activity className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card p-8 rounded-3xl text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-bold mb-4">No upcoming appointments</p>
              <button onClick={() => navigate('/patient/book')}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                Book Now
              </button>
            </motion.div>
          )}

          {/* Active prescriptions */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white">Active Medications</h3>
              <button onClick={() => navigate('/patient/prescriptions')}
                className="text-xs font-black text-blue-600 hover:text-blue-500 uppercase tracking-widest">
                View All
              </button>
            </div>
            {rxs.length === 0 ? (
              <div className="p-8 text-center">
                <Pill className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 font-bold text-sm">No active prescriptions</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {rxs.slice(0, 4).map(rx => {
                  const days = Math.ceil((new Date(rx.expiresAt).getTime() - Date.now()) / 86400000);
                  const expiringSoon = days <= 7 && days > 0;
                  return (
                    <div key={rx.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                        <Pill className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {rx.items[0]?.medicine ?? 'Prescription'}
                          {rx.items.length > 1 && <span className="text-slate-400 font-bold"> +{rx.items.length - 1} more</span>}
                        </p>
                        <p className="text-xs text-slate-400 font-bold">{rx.prescriptionNumber}</p>
                      </div>
                      {expiringSoon ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                          {days}d left
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Latest vitals */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-5 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 dark:text-white text-sm">Latest Vitals</h3>
              {latestVital && (
                <span className="text-[10px] text-slate-400 font-bold">
                  {new Date(latestVital.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            {latestVital ? (
              <div className="space-y-3">
                {[
                  { label: 'Heart Rate',     value: latestVital.heartRate  ? `${latestVital.heartRate} bpm`       : null, icon: Heart,       color: 'red' },
                  { label: 'Blood Pressure', value: latestVital.bloodPressureSystolic ? `${latestVital.bloodPressureSystolic}/${latestVital.bloodPressureDiastolic} mmHg` : null, icon: Droplets, color: 'blue' },
                  { label: 'Temperature',    value: latestVital.temperature ? `${latestVital.temperature}°C`       : null, icon: Thermometer, color: 'amber' },
                  { label: 'Weight',         value: latestVital.weight      ? `${latestVital.weight} kg`           : null, icon: Activity,    color: 'purple' },
                ].filter(v => v.value).map(v => (
                  <div key={v.label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <v.icon className={cn('w-4 h-4',
                        v.color === 'red'   && 'text-red-500',
                        v.color === 'blue'  && 'text-blue-500',
                        v.color === 'amber' && 'text-amber-500',
                        v.color === 'purple'&& 'text-purple-500',
                      )} />
                      <span className="text-xs font-bold text-slate-500">{v.label}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{v.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Activity className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-xs font-bold">No vitals recorded yet</p>
              </div>
            )}
          </motion.div>

          {/* Quick links */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-card p-5 rounded-3xl">
            <h3 className="font-black text-slate-900 dark:text-white text-sm mb-3">My Health</h3>
            <div className="space-y-1">
              {[
                { label: 'My Appointments', icon: Calendar,    path: '/patient/appointments' },
                { label: 'Prescriptions',   icon: Pill,        path: '/patient/prescriptions' },
                { label: 'Lab Results',     icon: FlaskConical,path: '/patient/lab-results' },
                { label: 'Medical Records', icon: Activity,    path: '/patient/records' },
                { label: 'My Bills',        icon: Receipt,     path: '/patient/bills' },
              ].map(l => (
                <button key={l.path} onClick={() => navigate(l.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group text-left">
                  <l.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition-colors flex-1">
                    {l.label}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
