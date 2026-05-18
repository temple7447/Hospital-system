import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Pill, Search, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import type { Prescription } from '@/types';

const PrescriptionQueue: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Prescription[]>(() => db.prescriptions.getPendingDispense());
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = () => setItems(db.prescriptions.getPendingDispense());

  const filtered = useMemo(() => {
    if (!search) return items;
    const t = search.toLowerCase();
    return items.filter(rx => {
      const p = db.patients.getById(rx.patientId);
      return (
        rx.prescriptionNumber.toLowerCase().includes(t) ||
        rx.diagnosis.toLowerCase().includes(t) ||
        (p && (`${p.firstName} ${p.lastName}`.toLowerCase().includes(t) || p.patientNumber.toLowerCase().includes(t)))
      );
    });
  }, [items, search]);

  const handleDispense = (rx: Prescription) => {
    if (!user) return;
    db.prescriptions.dispense(rx.id, user.id);
    const patient = db.patients.getById(rx.patientId);
    db.auditLogs.create({
      userId: user.id, userRole: user.role,
      action: 'DISPENSE_PRESCRIPTION', resource: 'Prescription', resourceId: rx.id,
      details: `Dispensed ${rx.prescriptionNumber} for ${patient ? `${patient.firstName} ${patient.lastName}` : 'patient'}`,
    });
    if (patient) {
      db.notifications.create({
        userId: patient.id, type: 'prescription',
        title: 'Prescription ready',
        message: `Your prescription ${rx.prescriptionNumber} has been dispensed.`,
      });
    }
    toast.success(`Dispensed ${rx.prescriptionNumber}`);
    refresh();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Prescription Queue</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{filtered.length} pending dispense</p>
      </div>

      <div className="glass-card rounded-3xl p-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by Rx number, patient, or diagnosis…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 py-2.5 text-sm w-full" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <p className="text-slate-400 font-medium">Queue is empty. All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(rx => {
            const patient = db.patients.getById(rx.patientId);
            const doctor  = db.staff.getById(rx.doctorId);
            const isExpanded = expanded === rx.id;
            const hasAllergyConflict = patient && rx.items.some(item =>
              patient.allergies.some(a => item.medicine.toLowerCase().includes(a.toLowerCase()))
            );

            return (
              <motion.div key={rx.id} layout
                className={cn('glass-card rounded-3xl overflow-hidden',
                  hasAllergyConflict && 'ring-2 ring-red-400')}>
                <button onClick={() => setExpanded(isExpanded ? null : rx.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-left">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 dark:text-white truncate">{rx.prescriptionNumber} · {rx.diagnosis}</p>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'} · {doctor ? db.staff.getDisplayName(doctor) : '—'} · {rx.items.length} medicine{rx.items.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  {hasAllergyConflict && (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 shrink-0">
                      <AlertTriangle className="w-3 h-3" /> Allergy
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(rx.createdAt).toLocaleDateString()}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                    {hasAllergyConflict && patient && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200">
                        <p className="text-xs font-black text-red-700 uppercase mb-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> Allergy warning
                        </p>
                        <p className="text-sm font-bold text-red-700 dark:text-red-300">
                          Patient is allergic to: {patient.allergies.join(', ')}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {rx.items.map((item, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-black text-slate-900 dark:text-white">{item.medicine}</p>
                            <span className="text-xs font-black text-blue-600">{item.dosage}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {item.frequency} · {item.duration}
                          </p>
                          {item.instructions && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1.5 italic">{item.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <button onClick={() => handleDispense(rx)}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Mark as Dispensed
                    </button>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default PrescriptionQueue;
