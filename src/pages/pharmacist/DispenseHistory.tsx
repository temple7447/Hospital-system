import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, Search, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { listPrescriptions, listPatients, listStaff } from '@/lib/services';
import type { Prescription, Patient, Staff } from '@/types';

const DispenseHistory: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'mine' | 'all'>('mine');

  useEffect(() => {
    Promise.all([
      listPrescriptions(),
      listPatients(),
      listStaff(),
    ]).then(([rxs, pts, st]) => {
      const dispensed = rxs.filter(rx => !!rx.dispensedAt);
      dispensed.sort((a, b) => (b.dispensedAt ?? '').localeCompare(a.dispensedAt ?? ''));
      setRecords(dispensed);
      setPatients(pts);
      setStaff(st);
    }).catch(() => {});
  }, []);

  const scopedRecords = useMemo(() => {
    if (scope === 'mine' && user) return records.filter(rx => rx.dispensedBy === user.id);
    return records;
  }, [records, scope, user]);

  const filtered = useMemo(() => {
    if (!search) return scopedRecords;
    const t = search.toLowerCase();
    return scopedRecords.filter(rx => {
      const p = patients.find(pt => pt.id === rx.patientId);
      return (
        rx.prescriptionNumber.toLowerCase().includes(t) ||
        rx.diagnosis.toLowerCase().includes(t) ||
        (p && `${p.firstName} ${p.lastName}`.toLowerCase().includes(t))
      );
    });
  }, [scopedRecords, search, patients]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Dispense History</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{filtered.length} dispensed prescriptions</p>
      </div>

      <div className="glass-card rounded-lg p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search Rx number, patient or diagnosis…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-10 py-2.5 text-sm w-full" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setScope('mine')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${scope === 'mine' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'}`}>
            My Dispenses
          </button>
          <button onClick={() => setScope('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${scope === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'}`}>
            All Pharmacy
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center text-slate-400 font-medium">No history yet.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(rx => {
            const patient = patients.find(p => p.id === rx.patientId);
            const doctor  = staff.find(s => s.userId === rx.doctorId || s.id === rx.doctorId);
            const dispenser = rx.dispensedBy ? staff.find(s => s.userId === rx.dispensedBy || s.id === rx.dispensedBy) : null;
            return (
              <div key={rx.id} className="glass-card rounded-md p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{rx.prescriptionNumber} · {rx.diagnosis}</p>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'}
                    {doctor && ` · prescribed by Dr. ${doctor.firstName} ${doctor.lastName}`}
                  </p>
                  {dispenser && (
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      Dispensed by {dispenser.firstName} {dispenser.lastName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0">
                  <Calendar className="w-3 h-3" />
                  {rx.dispensedAt && new Date(rx.dispensedAt).toLocaleString()}
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default DispenseHistory;
