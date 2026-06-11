import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, UserRound, HeartPulse, ClipboardList, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { listPatients, listStaff, listAppointments, listNursingTasks, listVitals } from '@/lib/services';
import type { Patient, NursingTask, VitalRecord } from '@/types';

const calcAge = (dob: string) => {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

const NurseMyPatients: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tasks, setTasks] = useState<NursingTask[]>([]);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      listPatients(),
      listStaff(),
      listAppointments(),
      listNursingTasks({ nurse_id: user.id }),
      listVitals(),
    ]).then(([allPatients, staffList, apts, nurseTasks, allVitals]) => {
      const nurse = staffList.find(s => s.id === user.id);
      let filtered = allPatients;
      if (nurse?.departmentId) {
        const deptPatientIds = new Set(
          apts.filter(a => a.departmentId === nurse.departmentId).map(a => a.patientId)
        );
        filtered = allPatients.filter(p => deptPatientIds.has(p.id));
      }
      setPatients(filtered);
      setTasks(nurseTasks);
      setVitals(allVitals);
    });
  }, [user?.id]);

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    if (!t) return patients;
    return patients.filter(p =>
      p.firstName.toLowerCase().includes(t) ||
      p.lastName.toLowerCase().includes(t) ||
      p.patientNumber.toLowerCase().includes(t)
    );
  }, [patients, search]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">My Patients</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Patients in your department</p>
      </div>

      <div className="glass-card rounded-lg p-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by name or patient number…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 py-2.5 text-sm w-full" />
        </div>
        <p className="text-xs font-bold text-slate-400 mt-3">{filtered.length} patient{filtered.length === 1 ? '' : 's'}</p>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center text-slate-400 font-medium">No patients found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const taskCount = tasks.filter(t => t.patientId === p.id && (t.status === 'pending' || t.status === 'in_progress')).length;
            const latestVital = vitals
              .filter(v => v.patientId === p.id)
              .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? null;
            return (
              <motion.div key={p.id} whileHover={{ y: -3 }} className="glass-card rounded-lg p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn('w-11 h-11 rounded-md flex items-center justify-center shrink-0 text-white font-semibold',
                    p.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500')}>
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-slate-500 font-bold">{p.patientNumber} · {calcAge(p.dateOfBirth)}y · {p.bloodType}</p>
                  </div>
                </div>

                {p.allergies.length > 0 && (
                  <div className="mb-3 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">Allergies</p>
                    <p className="text-xs font-bold text-red-700 dark:text-red-300">{p.allergies.join(', ')}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                    <ClipboardList className="w-3.5 h-3.5 mx-auto mb-1 text-violet-500" />
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{taskCount}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Tasks</p>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                    <HeartPulse className="w-3.5 h-3.5 mx-auto mb-1 text-rose-500" />
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{latestVital?.heartRate ?? '—'}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Heart rate</p>
                  </div>
                </div>

                <Link to={`/nurse/vitals?patientId=${p.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors">
                  <UserRound className="w-3.5 h-3.5" /> Record Vitals
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default NurseMyPatients;
