import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Search, UserRound, ChevronRight, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { listPatients, listAppointments, listPrescriptions, listLabOrders } from '@/lib/services';
import type { Patient, Appointment, Prescription, LabOrder } from '@/types';

function calcAge(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}

type Filter = 'all' | 'assigned' | 'visited';

const MyPatients: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [apts, setApts] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      listPatients(),
      listAppointments({ doctor_id: user.id }),
      listPrescriptions(),
      listLabOrders({ doctor_id: user.id }),
    ]).then(([pats, apt, rxs, labs]) => {
      setAllPatients(pats);
      setApts(apt);
      setPrescriptions(rxs);
      setLabOrders(labs);
    });
  }, [user?.id]);

  const assignedIds = useMemo(
    () => new Set(allPatients.filter(p => p.assignedDoctorId === user?.id).map(p => p.id)),
    [allPatients, user],
  );

  const visitedIds = useMemo(() => new Set(apts.map(a => a.patientId)), [apts]);

  const patients = useMemo(() => {
    const relevant = allPatients.filter(p =>
      filter === 'all'      ? (assignedIds.has(p.id) || visitedIds.has(p.id)) :
      filter === 'assigned' ? assignedIds.has(p.id) :
      visitedIds.has(p.id),
    );
    if (!search.trim()) return relevant;
    const t = search.toLowerCase();
    return relevant.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(t) ||
      p.patientNumber.toLowerCase().includes(t),
    );
  }, [allPatients, filter, search, assignedIds, visitedIds]);

  const visitCount = (pid: string) => apts.filter(a => a.patientId === pid).length;
  const rxCount   = (pid: string) => prescriptions.filter(rx => rx.patientId === pid && rx.status === 'active').length;
  const labCount  = (pid: string) => labOrders.filter(l => l.patientId === pid && l.status === 'pending').length;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Patients</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {patients.length} patient{patients.length !== 1 ? 's' : ''} · {assignedIds.size} assigned
          </p>
        </div>
      </motion.div>

      {/* Filter + Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {(['all', 'assigned', 'visited'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                filter === f
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-300')}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or patient number…"
            className="w-full pl-11 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </motion.div>

      {/* List */}
      {patients.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card p-16 rounded-3xl text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">
            {search ? 'No patients match your search' : 'No patients yet'}
          </p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {patients.map((p, i) => {
            const visits = visitCount(p.id);
            const rxs    = rxCount(p.id);
            const labs   = labCount(p.id);
            const isAssigned = assignedIds.has(p.id);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/doctor/patient/${p.id}`)}>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <UserRound className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {p.firstName} {p.lastName}
                    </p>
                    {isAssigned && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                        Assigned
                      </span>
                    )}
                    <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase',
                      p.status === 'active'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
                    {p.patientNumber} · {calcAge(p.dateOfBirth)}y · {p.bloodType}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-5 shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{visits}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visits</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-emerald-600">{rxs}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Rx</p>
                  </div>
                  {labs > 0 && (
                    <div className="text-center">
                      <p className="text-sm font-black text-amber-600">{labs}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Labs</p>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default MyPatients;
