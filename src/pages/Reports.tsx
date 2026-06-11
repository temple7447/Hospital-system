import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, Calendar, DollarSign,
  Activity, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { listAppointments, listPatients, listInvoices, getAdminStats } from '@/lib/services';
import type { Appointment, Patient, Invoice, AdminStats } from '@/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    Promise.all([
      listAppointments({ limit: 1000 }),
      listPatients({ limit: 1000 }),
      listInvoices({ limit: 1000 }),
      getAdminStats(),
    ]).then(([apts, pats, invs, s]) => {
      setAppointments(apts);
      setPatients(pats);
      setInvoices(invs);
      setStats(s);
    }).catch(() => {});
  }, []);

  const revenueData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - 4 + i, 1);
      const revenue = invoices
        .filter(inv => {
          if (inv.status !== 'paid' || !inv.paidAt) return false;
          const pd = new Date(inv.paidAt);
          return pd >= d && pd < next;
        })
        .reduce((sum, inv) => sum + (inv.total ?? 0), 0);
      return { month: MONTHS[d.getMonth()], revenue };
    });
  }, [invoices]);

  const aptStats = useMemo(() => {
    const completed  = appointments.filter(a => a.status === 'completed').length;
    const scheduled  = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;
    const cancelled  = appointments.filter(a => a.status === 'cancelled').length;
    const noShow     = appointments.filter(a => a.status === 'no_show').length;
    return [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Upcoming',  value: scheduled, color: '#3b82f6' },
      { name: 'Cancelled', value: cancelled, color: '#f59e0b' },
      { name: 'No Show',   value: noShow,    color: '#ef4444' },
    ];
  }, [appointments]);

  const aptByType = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach(a => { counts[a.type] = (counts[a.type] ?? 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, ' '), count,
    })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [appointments]);

  const patientGrowth = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - 4 + i, 1);
      const count = patients.filter(p => {
        const reg = new Date(p.registeredAt);
        return reg >= d && reg < next;
      }).length;
      return { month: MONTHS[d.getMonth()], patients: count };
    });
  }, [patients]);

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalApts    = aptStats.reduce((s, d) => s + d.value, 0);

  const KPI = [
    { label: 'Total Revenue (6mo)', value: `$${(totalRevenue / 1000).toFixed(1)}k`, icon: DollarSign, color: 'emerald', change: '+12%' },
    { label: 'Total Appointments',  value: totalApts,                                icon: Calendar,   color: 'blue',    change: '+8%' },
    { label: 'Active Patients',     value: stats?.totalPatients ?? '—',              icon: Users,      color: 'violet',  change: '+5%' },
    { label: 'Active Staff',        value: stats?.totalStaff ?? '—',                 icon: Activity,   color: 'amber',   change: '0%' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Reports & Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Hospital performance overview</p>
      </motion.div>

      {/* KPI cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            className="glass-card p-5 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-md flex items-center justify-center',
                k.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20',
                k.color === 'blue'    && 'bg-blue-50 dark:bg-blue-900/20',
                k.color === 'violet'  && 'bg-violet-50 dark:bg-violet-900/20',
                k.color === 'amber'   && 'bg-amber-50 dark:bg-amber-900/20',
              )}>
                <k.icon className={cn('w-5 h-5',
                  k.color === 'emerald' && 'text-emerald-600',
                  k.color === 'blue'    && 'text-blue-600',
                  k.color === 'violet'  && 'text-violet-600',
                  k.color === 'amber'   && 'text-amber-600',
                )} />
              </div>
              <span className="text-xs font-semibold text-emerald-600">{k.change}</span>
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{k.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{k.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Revenue trend + Patient growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card p-6 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Revenue Trend</h3>
          <p className="text-xs text-slate-400 font-bold mb-5">Last 6 months</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ left: -10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5}
                  fill="url(#revGrad)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">New Patient Registrations</h3>
          <p className="text-xs text-slate-400 font-bold mb-5">Last 6 months</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientGrowth} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="patients" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Appointment breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-6 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Appointment Status</h3>
          <p className="text-xs text-slate-400 font-bold mb-5">All time breakdown</p>
          <div className="h-52 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={aptStats} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {aptStats.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {aptStats.map(s => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-slate-500 font-bold">{s.name}</span>
                <span className="ml-auto text-xs font-semibold text-slate-900 dark:text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Appointments by Type</h3>
          <p className="text-xs text-slate-400 font-bold mb-5">Top visit reasons</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aptByType} layout="vertical" margin={{ left: 20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <YAxis type="category" dataKey="type" axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }} width={90} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Summary table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="glass-card p-6 rounded-lg">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Quick Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Staff',      value: stats?.totalStaff ?? '—',        icon: Activity,     color: 'blue' },
            { label: 'Patients',   value: stats?.totalPatients ?? '—',      icon: Users,        color: 'violet' },
            { label: 'Today Apts', value: stats?.todayAppointments ?? '—',  icon: Calendar,     color: 'amber' },
            { label: 'Completed',  value: aptStats[0]?.value ?? '—',        icon: CheckCircle2, color: 'emerald' },
            { label: 'Pending Bills', value: stats?.pendingInvoices ?? '—', icon: Clock,        color: 'orange' },
            { label: 'Low Stock',  value: stats?.lowStockItems ?? '—',      icon: XCircle,      color: 'red' },
          ].map(s => (
            <div key={s.label} className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;
