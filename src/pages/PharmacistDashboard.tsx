import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pill, Package, AlertTriangle, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';

const PharmacistDashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const stats   = useMemo(() => db.stats.pharmacist(), []);
  const pending = useMemo(() => db.prescriptions.getPendingDispense().slice(0, 6), []);
  const lowStock = useMemo(() => db.inventory.getLowStock().filter(i => i.category === 'medicine').slice(0, 5), []);

  const KPI = [
    { label: 'Pending Rx',     value: stats.pendingPrescriptions, icon: Pill,           color: 'blue' },
    { label: 'Dispensed Today',value: stats.dispensedToday,        icon: CheckCircle2,   color: 'emerald' },
    { label: 'Low Stock',      value: stats.lowStockMedicines,     icon: AlertTriangle,  color: 'amber' },
    { label: 'Active Rx',      value: stats.totalActive,           icon: Package,        color: 'violet' },
  ];

  return (
    <div className="space-y-8 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Pharmacy, {user.name.split(' ')[0]}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Dispense and inventory overview</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-5 rounded-3xl">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center mb-3',
              k.color === 'blue'    && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
              k.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
              k.color === 'amber'   && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
              k.color === 'violet'  && 'bg-violet-50 dark:bg-violet-900/20 text-violet-600',
            )}>
              <k.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{k.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white">Pending Prescriptions</h3>
              <p className="text-xs text-slate-400 font-bold">Awaiting dispense</p>
            </div>
            <Link to="/pharmacist/queue" className="text-xs font-black text-blue-600 hover:text-blue-700">View queue →</Link>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium text-sm">Queue is empty. All caught up!</div>
          ) : (
            <div className="space-y-3">
              {pending.map(rx => {
                const patient = db.patients.getById(rx.patientId);
                const doctor  = db.staff.getById(rx.doctorId);
                return (
                  <Link key={rx.id} to={`/pharmacist/queue?id=${rx.id}`}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{rx.prescriptionNumber} · {rx.diagnosis}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'} · {doctor ? db.staff.getDisplayName(doctor) : '—'} · {rx.items.length} items
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Clock className="w-3 h-3" />
                      {new Date(rx.createdAt).toLocaleDateString()}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white">Low Stock</h3>
              <p className="text-xs text-slate-400 font-bold">Medicines to restock</p>
            </div>
            <Link to="/pharmacist/inventory" className="text-xs font-black text-amber-600 hover:text-amber-700">All →</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium">Stock levels good</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2.5 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{item.quantity} {item.unit} left · min {item.minQuantity}</p>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
