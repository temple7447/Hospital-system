import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, Building2, DollarSign, AlertCircle, Package,
  ArrowUpRight, CheckCircle2, Clock, XCircle, Activity,
  UserPlus, ShieldCheck, Stethoscope, BedDouble, Receipt,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion as m } from 'framer-motion';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Appointment, Staff, Patient } from '../types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_CFG = {
  scheduled:   { label: 'Scheduled',   cls: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
  confirmed:   { label: 'Confirmed',   cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' },
  completed:   { label: 'Completed',   cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-50 text-red-500 dark:bg-red-900/20' },
  no_show:     { label: 'No Show',     cls: 'bg-slate-100 text-slate-400 dark:bg-slate-800' },
} as const;

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apts, setApts] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    setApts(db.appointments.getToday().sort((a, b) => a.time.localeCompare(b.time)));
    setDoctors(db.staff.getDoctors());
    setPatients(db.patients.getAll());
  }, []);

  const stats = useMemo(() => db.stats.admin(), []);

  const revenueData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        month: MONTHS[d.getMonth()],
        revenue: db.invoices.getMonthlyRevenue(d.getFullYear(), d.getMonth() + 1),
      };
    });
  }, []);

  const occupancyPct = stats.totalBeds > 0
    ? Math.round(((stats.totalBeds - stats.availableBeds) / stats.totalBeds) * 100)
    : 0;

  const getPatient = (id: string) => patients.find(p => p.id === id);
  const getDoctor  = (id: string) => doctors.find(d => d.id === id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hospital Administration
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Welcome back, {user?.name.split(' ')[0]}. Here's today's overview.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => navigate('/receptionist/register')}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95">
            <UserPlus className="w-4 h-4" /> Register Patient
          </button>
          <button onClick={() => navigate('/admin/audit-logs')}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all">
            <ShieldCheck className="w-4 h-4" /> Audit Logs
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Patients',   value: stats.totalPatients,     icon: Users,      color: 'blue',   action: '/patients' },
          { label: 'Active Staff',      value: stats.totalStaff,        icon: Stethoscope, color: 'purple', action: '/admin/staff' },
          { label: 'Today\'s Appts',   value: stats.todayAppointments, icon: Calendar,    color: 'emerald',action: '/appointments' },
          { label: 'Bed Occupancy',     value: `${occupancyPct}%`,      icon: BedDouble,  color: 'amber',  action: '/admin/rooms' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            onClick={() => navigate(s.action)}
            className="glass-card p-5 rounded-2xl cursor-pointer hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center',
                s.color === 'blue'   && 'bg-blue-50 dark:bg-blue-900/20',
                s.color === 'purple' && 'bg-purple-50 dark:bg-purple-900/20',
                s.color === 'emerald'&& 'bg-emerald-50 dark:bg-emerald-900/20',
                s.color === 'amber'  && 'bg-amber-50 dark:bg-amber-900/20',
              )}>
                <s.icon className={cn('w-5 h-5',
                  s.color === 'blue'   && 'text-blue-600',
                  s.color === 'purple' && 'text-purple-600',
                  s.color === 'emerald'&& 'text-emerald-600',
                  s.color === 'amber'  && 'text-amber-600',
                )} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Alerts row */}
      {(stats.pendingInvoices > 0 || stats.lowStockItems > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3">
          {stats.pendingInvoices > 0 && (
            <button onClick={() => navigate('/admin/billing')}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-2xl text-xs font-bold hover:bg-amber-100 transition-all">
              <Receipt className="w-4 h-4" /> {stats.pendingInvoices} pending invoice{stats.pendingInvoices !== 1 ? 's' : ''}
            </button>
          )}
          {stats.lowStockItems > 0 && (
            <button onClick={() => navigate('/admin/inventory')}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl text-xs font-bold hover:bg-red-100 transition-all">
              <Package className="w-4 h-4" /> {stats.lowStockItems} low-stock item{stats.lowStockItems !== 1 ? 's' : ''}
            </button>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white">Revenue (Last 6 Months)</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                This month: ${stats.monthlyRevenue.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-black text-emerald-600">
                ${db.invoices.getTotalRevenue().toLocaleString()} total
              </span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#adminRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-3xl">
          <h3 className="font-black text-slate-900 dark:text-white mb-5">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Manage Staff',     icon: Users,     path: '/admin/staff',        color: 'blue' },
              { label: 'Departments',      icon: Building2, path: '/admin/departments',  color: 'purple' },
              { label: 'Rooms & Beds',     icon: BedDouble, path: '/admin/rooms',        color: 'emerald' },
              { label: 'Billing',          icon: Receipt,   path: '/admin/billing',      color: 'amber' },
              { label: 'Inventory',        icon: Package,   path: '/admin/inventory',    color: 'red' },
              { label: 'Audit Logs',       icon: ShieldCheck,path: '/admin/audit-logs',  color: 'slate' },
            ].map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group text-left">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                  a.color === 'blue'   && 'bg-blue-50 dark:bg-blue-900/20',
                  a.color === 'purple' && 'bg-purple-50 dark:bg-purple-900/20',
                  a.color === 'emerald'&& 'bg-emerald-50 dark:bg-emerald-900/20',
                  a.color === 'amber'  && 'bg-amber-50 dark:bg-amber-900/20',
                  a.color === 'red'    && 'bg-red-50 dark:bg-red-900/20',
                  a.color === 'slate'  && 'bg-slate-100 dark:bg-slate-800',
                )}>
                  <a.icon className={cn('w-4 h-4',
                    a.color === 'blue'   && 'text-blue-600',
                    a.color === 'purple' && 'text-purple-600',
                    a.color === 'emerald'&& 'text-emerald-600',
                    a.color === 'amber'  && 'text-amber-600',
                    a.color === 'red'    && 'text-red-500',
                    a.color === 'slate'  && 'text-slate-500',
                  )} />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">{a.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 ml-auto transition-colors" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Today's appointments */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white">Today's Appointments</h3>
            <p className="text-xs text-slate-400 font-bold mt-0.5">{apts.length} total</p>
          </div>
          <button onClick={() => navigate('/appointments')}
            className="text-xs font-black text-blue-600 hover:text-blue-500 uppercase tracking-widest">
            View All
          </button>
        </div>
        {apts.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 font-bold text-sm">No appointments today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  {['Patient', 'Doctor', 'Time', 'Type', 'Status'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {apts.slice(0, 10).map(a => {
                  const patient = getPatient(a.patientId);
                  const doctor  = getDoctor(a.doctorId);
                  const cfg     = STATUS_CFG[a.status] ?? STATUS_CFG.scheduled;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[10px] font-black text-blue-600 shrink-0">
                            {patient ? `${patient.firstName[0]}${patient.lastName[0]}` : '?'}
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {patient ? `${patient.firstName} ${patient.lastName}` : a.patientId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5" /> {a.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium capitalize">{a.type.replace('_', ' ')}</td>
                      <td className="px-6 py-4">
                        <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-black uppercase', cfg.cls)}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
