import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, Search, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getToken } from '@/lib/api';
import { listLabOrders, listPatients, listStaff } from '@/lib/services';
import { db } from '@/lib/db';
import type { LabOrder, Patient, Staff, ResultFlag } from '@/types';

const FLAG_CFG: Record<ResultFlag, string> = {
  normal:   'text-emerald-600',
  abnormal: 'text-amber-600',
  critical: 'text-red-600',
};

const IMAGING_CATEGORIES = ['radiology', 'imaging', 'xray', 'mri', 'ct', 'ultrasound'];
function isImagingOrder(o: LabOrder) {
  return o.category ? IMAGING_CATEGORIES.includes(o.category.toLowerCase()) : false;
}

const ReportHistory: React.FC = () => {
  const [reports, setReports] = useState<LabOrder[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (getToken()) {
      Promise.all([
        listLabOrders({ category: 'radiology', status: 'completed' }),
        listPatients(),
        listStaff(),
      ]).then(([labOrders, pts, st]) => {
        const completed = labOrders
          .filter(o => isImagingOrder(o) && o.status === 'completed')
          .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
        setReports(completed);
        setPatients(pts);
        setStaff(st);
      }).catch(() => loadLocal());
    } else {
      loadLocal();
    }
  }, []);

  function loadLocal() {
    const all = db.labOrders.getAll();
    const completed = all
      .filter(o => isImagingOrder(o) && o.status === 'completed')
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
    setReports(completed);
    setPatients(db.patients.getAll());
    setStaff(db.staff.getAll());
  }

  const filtered = useMemo(() => {
    if (!search) return reports;
    const t = search.toLowerCase();
    return reports.filter(o => {
      const p = patients.find(pt => pt.id === o.patientId);
      return (
        o.labNumber.toLowerCase().includes(t) ||
        o.tests.some(test => test.toLowerCase().includes(t)) ||
        (p && `${p.firstName} ${p.lastName}`.toLowerCase().includes(t))
      );
    });
  }, [reports, search, patients]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Report History</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{filtered.length} radiology reports</p>
      </div>

      <div className="glass-card rounded-lg p-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by lab number, study, or patient…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-10 py-2.5 text-sm w-full" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center text-slate-400 font-medium">No reports yet.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const patient = patients.find(p => p.id === o.patientId);
            const radiologist = o.processedBy ? staff.find(s => s.userId === o.processedBy || s.id === o.processedBy) : null;
            const isExpanded = expanded === o.id;
            const hasAbnormal = Array.isArray(o.results) && o.results.some(r => r.flag !== 'normal');

            return (
              <motion.div key={o.id} layout className="glass-card rounded-lg overflow-hidden">
                <button onClick={() => setExpanded(isExpanded ? null : o.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-left">
                  <div className="w-11 h-11 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shrink-0">
                    <ScanLine className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{o.labNumber} · {o.tests.join(', ')}</p>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'}
                      {radiologist && ` · reported by ${radiologist.firstName} ${radiologist.lastName}`}
                    </p>
                  </div>
                  {hasAbnormal && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                      <AlertTriangle className="w-3 h-3" /> Abnormal
                    </span>
                  )}
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-400 shrink-0">
                    {o.completedAt && new Date(o.completedAt).toLocaleDateString()}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isExpanded && o.results && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                    {o.results.map((r, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{r.testName}</p>
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg uppercase tracking-wide', FLAG_CFG[r.flag], 'bg-slate-100 dark:bg-slate-800')}>
                            {r.flag}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{r.value}</p>
                      </div>
                    ))}
                    {o.notes && (
                      <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg">
                        <p className="text-[10px] font-semibold text-indigo-600 uppercase mb-1">Impression</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{o.notes}</p>
                      </div>
                    )}
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

export default ReportHistory;
