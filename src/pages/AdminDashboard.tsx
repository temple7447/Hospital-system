import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, Building2, DollarSign, Package,
  ArrowUpRight, Clock,
  UserPlus, ShieldCheck, Stethoscope, BedDouble, Receipt,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import {
  getAdminStats,
  listAppointments,
  listPatients,
  listStaff,
  listInvoices,
} from '@/lib/services';
import type { Appointment, Staff, Patient } from '@/types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_CFG = {
  scheduled:   { label: 'Scheduled',   cls: 'badge badge-blue' },
  confirmed:   { label: 'Confirmed',   cls: 'badge badge-green' },
  in_progress: { label: 'In Progress', cls: 'badge badge-amber' },
  completed:   { label: 'Completed',   cls: 'badge badge-slate' },
  cancelled:   { label: 'Cancelled',   cls: 'badge badge-red' },
  no_show:     { label: 'No Show',     cls: 'badge badge-slate' },
} as const;

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [apts, setApts]               = useState<Appointment[]>([]);
  const [doctors, setDoctors]         = useState<Staff[]>([]);
  const [patients, setPatients]       = useState<Patient[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const { data: stats } = useApi(getAdminStats);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      listAppointments({ date: today }),
      listStaff({ role: 'DOCTOR' }),
      listPatients({ limit: 500 }),
      listInvoices({ status: 'paid' }),
    ]).then(([aptList, staffList, patientList, invoices]) => {
      setApts(aptList.slice().sort((a, b) => a.time.localeCompare(b.time)));
      setDoctors(staffList);
      setPatients(patientList);

      const total = invoices.reduce((s, i) => s + (i.amountPaid ?? 0), 0);
      setTotalRevenue(total);

      const now = new Date();
      const monthly = Array.from({ length: 6 }, (_, i) => {
        const d  = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const yr = d.getFullYear();
        const mo = d.getMonth() + 1;
        const revenue = invoices
          .filter(inv => {
            const pd = new Date(inv.paidAt ?? inv.createdAt ?? '');
            return pd.getFullYear() === yr && pd.getMonth() + 1 === mo;
          })
          .reduce((s, inv) => s + (inv.amountPaid ?? 0), 0);
        return { month: MONTHS[d.getMonth()], revenue };
      });
      setRevenueData(monthly);
    });
  }, []);

  const occupancyPct = stats && stats.totalBeds > 0
    ? Math.round(((stats.totalBeds - stats.availableBeds) / stats.totalBeds) * 100)
    : 0;

  const getPatient = (id: string) => patients.find(p => p.id === id);
  const getDoctor  = (id: string) => doctors.find(d => d.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Hospital Administration</h1>
          <p className="page-subtitle">
            Welcome back, {user?.name.split(' ')[0]}. Here's today's overview.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate('/receptionist/register')}
            className="btn-primary flex items-center gap-1.5 py-2"
          >
            <UserPlus className="w-4 h-4" /> Register Patient
          </button>
          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="btn-secondary flex items-center gap-1.5 py-2"
          >
            <ShieldCheck className="w-4 h-4" /> Audit Logs
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Patients',  value: stats?.totalPatients ?? '—',      icon: Users,       color: 'blue',    action: '/patients' },
          { label: 'Active Staff',     value: stats?.totalStaff ?? '—',         icon: Stethoscope, color: 'purple',  action: '/admin/staff' },
          { label: "Today's Appts",    value: stats?.todayAppointments ?? '—',  icon: Calendar,    color: 'emerald', action: '/appointments' },
          { label: 'Bed Occupancy',    value: stats ? `${occupancyPct}%` : '—', icon: BedDouble,   color: 'amber',   action: '/admin/rooms' },
        ].map((s) => (
          <div
            key={s.label}
            onClick={() => navigate(s.action)}
            className="card p-5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn('w-9 h-9 rounded-md flex items-center justify-center',
                s.color === 'blue'    && 'bg-blue-50 dark:bg-blue-900/20',
                s.color === 'purple'  && 'bg-purple-50 dark:bg-purple-900/20',
                s.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20',
                s.color === 'amber'   && 'bg-amber-50 dark:bg-amber-900/20',
              )}>
                <s.icon className={cn('w-4.5 h-4.5',
                  s.color === 'blue'    && 'text-blue-600',
                  s.color === 'purple'  && 'text-purple-600',
                  s.color === 'emerald' && 'text-emerald-600',
                  s.color === 'amber'   && 'text-amber-600',
                )} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alert banners */}
      {stats && (stats.pendingInvoices > 0 || stats.lowStockItems > 0) && (
        <div className="flex flex-wrap gap-2">
          {stats.pendingInvoices > 0 && (
            <button
              onClick={() => navigate('/admin/billing')}
              className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-md text-xs font-medium hover:bg-amber-100 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              {stats.pendingInvoices} pending invoice{stats.pendingInvoices !== 1 ? 's' : ''}
            </button>
          )}
          {stats.lowStockItems > 0 && (
            <button
              onClick={() => navigate('/admin/inventory')}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-xs font-medium hover:bg-red-100 transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              {stats.lowStockItems} low-stock item{stats.lowStockItems !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Revenue — Last 6 Months</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                This month: ${(stats?.monthlyRevenue ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                ${totalRevenue.toLocaleString()} total
              </span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#adminRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-1">
            {[
              { label: 'Manage Staff',  icon: Users,      path: '/admin/staff',       color: 'blue' },
              { label: 'Departments',   icon: Building2,  path: '/admin/departments', color: 'purple' },
              { label: 'Rooms & Beds',  icon: BedDouble,  path: '/admin/rooms',       color: 'emerald' },
              { label: 'Billing',       icon: Receipt,    path: '/admin/billing',     color: 'amber' },
              { label: 'Inventory',     icon: Package,    path: '/admin/inventory',   color: 'red' },
              { label: 'Audit Logs',    icon: ShieldCheck,path: '/admin/audit-logs',  color: 'slate' },
            ].map(a => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
              >
                <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0',
                  a.color === 'blue'    && 'bg-blue-50 dark:bg-blue-900/20',
                  a.color === 'purple'  && 'bg-purple-50 dark:bg-purple-900/20',
                  a.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20',
                  a.color === 'amber'   && 'bg-amber-50 dark:bg-amber-900/20',
                  a.color === 'red'     && 'bg-red-50 dark:bg-red-900/20',
                  a.color === 'slate'   && 'bg-slate-100 dark:bg-slate-800',
                )}>
                  <a.icon className={cn('w-3.5 h-3.5',
                    a.color === 'blue'    && 'text-blue-600',
                    a.color === 'purple'  && 'text-purple-600',
                    a.color === 'emerald' && 'text-emerald-600',
                    a.color === 'amber'   && 'text-amber-600',
                    a.color === 'red'     && 'text-red-500',
                    a.color === 'slate'   && 'text-slate-500',
                  )} />
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{a.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 ml-auto transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Today's appointments table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Today's Appointments</h3>
            <p className="text-xs text-slate-400 mt-0.5">{apts.length} scheduled</p>
          </div>
          <button
            onClick={() => navigate('/appointments')}
            className="text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            View all
          </button>
        </div>

        {apts.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No appointments today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                  {['Patient', 'Doctor', 'Time', 'Type', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {apts.slice(0, 10).map(a => {
                  const patient = getPatient(a.patientId);
                  const doctor  = getDoctor(a.doctorId);
                  const cfg     = STATUS_CFG[a.status] ?? STATUS_CFG.scheduled;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                            {patient ? `${patient.firstName[0]}${patient.lastName[0]}` : '?'}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {patient ? `${patient.firstName} ${patient.lastName}` : a.patientId}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5" /> {a.time}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 capitalize">
                        {a.type.replace('_', ' ')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cfg.cls}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
