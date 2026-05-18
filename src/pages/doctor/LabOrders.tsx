import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical, Plus, Search, X, ChevronDown, ChevronUp,
  Clock, CheckCircle2, AlertTriangle, XCircle, Loader2,
  Zap, ArrowRight, ClipboardList, User,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import type { LabOrder, LabResult, LabTestStatus, Patient, Appointment, ResultFlag } from '@/types';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMON_TESTS = [
  'Complete Blood Count (CBC)',
  'Basic Metabolic Panel (BMP)',
  'Comprehensive Metabolic Panel (CMP)',
  'Lipid Panel',
  'Liver Function Tests (LFT)',
  'Thyroid Stimulating Hormone (TSH)',
  'HbA1c',
  'Fasting Blood Glucose',
  'Urinalysis',
  'Urine Culture',
  'Blood Culture',
  'Prothrombin Time (PT/INR)',
  'C-Reactive Protein (CRP)',
  'Erythrocyte Sedimentation Rate (ESR)',
  'Troponin I',
  'D-Dimer',
  'Chest X-Ray',
  'ECG / EKG',
  'Echocardiogram',
  'Abdominal Ultrasound',
];

const STATUS_CFG: Record<LabTestStatus, { label: string; bg: string; text: string; icon: React.ElementType; next?: LabTestStatus; nextLabel?: string }> = {
  ordered:    { label: 'Ordered',    bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-500',   icon: ClipboardList, next: 'collected',  nextLabel: 'Mark Collected' },
  collected:  { label: 'Collected',  bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-600',    icon: Clock,         next: 'processing', nextLabel: 'Mark Processing' },
  processing: { label: 'Processing', bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-600',   icon: Loader2,       next: 'completed',  nextLabel: 'Enter Results' },
  completed:  { label: 'Completed',  bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-500',     icon: XCircle },
};

const FLAG_CFG: Record<ResultFlag, { label: string; bg: string; text: string }> = {
  normal:   { label: 'Normal',   bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
  abnormal: { label: 'Abnormal', bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-600' },
  critical: { label: 'Critical', bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-600' },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ─── Create Order Modal ───────────────────────────────────────────────────────

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  doctorId: string;
}

const CreateModal: React.FC<CreateModalProps> = ({ open, onClose, onCreated, doctorId }) => {
  const [saving, setSaving] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [aptId, setAptId] = useState('');
  const [aptOptions, setAptOptions] = useState<Appointment[]>([]);
  const [testSearch, setTestSearch] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setPatientSearch(''); setPatientId(''); setPatient(null); setAptId('');
      setTestSearch(''); setSelectedTests([]); setPriority('routine'); setNotes('');
      setPatients(db.patients.getAll());
    }
  }, [open]);

  useEffect(() => {
    if (patientId) {
      const p = db.patients.getById(patientId);
      setPatient(p);
      if (p) {
        setPatientSearch(`${p.firstName} ${p.lastName}`);
        setAptOptions(
          db.appointments.getByPatient(patientId)
            .filter(a => a.status === 'completed' || a.status === 'confirmed')
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 6)
        );
      }
    }
  }, [patientId]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.toLowerCase();
    return patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.patientNumber.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [patients, patientSearch]);

  const filteredTests = useMemo(() => {
    const q = testSearch.toLowerCase();
    return COMMON_TESTS.filter(t => t.toLowerCase().includes(q) && !selectedTests.includes(t)).slice(0, 8);
  }, [testSearch, selectedTests]);

  const toggleTest = (t: string) => {
    setSelectedTests(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  };

  const handleSubmit = () => {
    if (!patientId || selectedTests.length === 0) return;
    setSaving(true);
    const order = db.labOrders.create({
      patientId,
      doctorId,
      appointmentId: aptId || undefined,
      tests: selectedTests,
      status: 'ordered',
      priority,
      notes: notes.trim() || undefined,
    });
    db.notifications.create({
      userId: patientId,
      title: 'Lab Tests Ordered',
      message: `${selectedTests.length} test${selectedTests.length !== 1 ? 's' : ''} ordered (${order.labNumber}). You will be notified when results are ready.`,
      type: 'lab_result',
      relatedId: order.id,
    });
    db.auditLogs.create({
      userId: doctorId,
      action: 'CREATE',
      resource: 'lab_order',
      resourceId: order.id,
      details: `Lab order ${order.labNumber} created: ${selectedTests.join(', ')}`,
    });
    setTimeout(() => {
      setSaving(false);
      onCreated();
      onClose();
      toast.success(`Lab order ${order.labNumber} created`);
    }, 500);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => !saving && onClose()}>
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white">New Lab Order</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">Order diagnostic tests for a patient</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Patient search */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={patientSearch}
                  onChange={e => { setPatientSearch(e.target.value); if (!e.target.value) { setPatientId(''); setPatient(null); } }}
                  placeholder="Search patient..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
              </div>
              {patientSearch && !patient && filteredPatients.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
                  {filteredPatients.map(p => (
                    <button key={p.id} onClick={() => setPatientId(p.id)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-black shrink-0">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      {p.firstName} {p.lastName}
                      <span className="text-slate-400 font-normal text-xs">{p.patientNumber}</span>
                    </button>
                  ))}
                </div>
              )}
              {patient && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-sm">{patient.firstName} {patient.lastName}</p>
                    <p className="text-xs text-slate-400 font-bold">{patient.patientNumber}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Appointment link */}
            {aptOptions.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link to Appointment (optional)</label>
                <select value={aptId} onChange={e => setAptId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <option value="">No link</option>
                  {aptOptions.map(a => (
                    <option key={a.id} value={a.id}>{a.date} — {a.type.replace('_', ' ')} ({a.status})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Test selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tests</label>
              <div className="relative">
                <FlaskConical className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={testSearch} onChange={e => setTestSearch(e.target.value)}
                  placeholder="Search or type a test name..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
              </div>

              {testSearch && filteredTests.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md">
                  {filteredTests.map(t => (
                    <button key={t} onClick={() => { toggleTest(t); setTestSearch(''); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t}
                    </button>
                  ))}
                  {testSearch && !COMMON_TESTS.some(t => t.toLowerCase() === testSearch.toLowerCase()) && (
                    <button onClick={() => { toggleTest(testSearch); setTestSearch(''); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-sm font-medium text-blue-600 border-t border-slate-100 dark:border-slate-700">
                      + Add "{testSearch}"
                    </button>
                  )}
                </div>
              )}

              {selectedTests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTests.map(t => (
                    <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold">
                      {t}
                      <button onClick={() => toggleTest(t)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
              <div className="flex gap-2">
                {(['routine', 'urgent', 'stat'] as const).map(p => (
                  <button key={p} onClick={() => setPriority(p)}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2',
                      priority === p
                        ? p === 'stat' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600'
                          : p === 'urgent' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                          : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                        : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500 hover:border-slate-300'
                    )}>
                    {p === 'stat' && <Zap className="w-3 h-3 inline mr-1" />}
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Clinical context or special instructions..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none resize-none font-medium" />
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3 shrink-0 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button onClick={onClose} disabled={saving}
              className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving || !patientId || selectedTests.length === 0}
              className="flex-2 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Ordering...</> : 'Place Order'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Enter Results Modal ──────────────────────────────────────────────────────

interface ResultsModalProps {
  order: LabOrder | null;
  onClose: () => void;
  onSaved: () => void;
  doctorId: string;
}

const ResultsModal: React.FC<ResultsModalProps> = ({ order, onClose, onSaved, doctorId }) => {
  const [results, setResults] = useState<LabResult[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setResults(order.tests.map(t => ({
        testName: t,
        value: '',
        unit: '',
        referenceRange: '',
        flag: 'normal' as ResultFlag,
      })));
    }
  }, [order]);

  if (!order) return null;

  const updateResult = (i: number, field: keyof LabResult, val: string) => {
    setResults(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  };

  const canSave = results.every(r => r.value.trim() !== '');

  const handleSave = () => {
    setSaving(true);
    db.labOrders.complete(order.id, results);
    const hasCritical = results.some(r => r.flag === 'critical');
    db.notifications.create({
      userId: order.patientId,
      title: hasCritical ? 'Critical Lab Results Ready' : 'Lab Results Ready',
      message: `Results for ${order.labNumber} are now available.${hasCritical ? ' Some values require immediate attention.' : ''}`,
      type: 'lab_result',
      relatedId: order.id,
    });
    db.auditLogs.create({
      userId: doctorId,
      action: 'UPDATE',
      resource: 'lab_order',
      resourceId: order.id,
      details: `Results entered for ${order.labNumber}`,
    });
    setTimeout(() => {
      setSaving(false);
      onSaved();
      onClose();
      toast.success('Results saved and patient notified');
    }, 500);
  };

  return (
    <AnimatePresence>
      {order && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !saving && onClose()}>
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">Enter Results</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">{order.labNumber} · {order.tests.length} test{order.tests.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-1">
                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Test</div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Value</div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Unit</div>
                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Reference</div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Flag</div>
              </div>

              {results.map((r, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <div className="col-span-3">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{r.testName}</p>
                  </div>
                  <input type="text" value={r.value} onChange={e => updateResult(i, 'value', e.target.value)}
                    placeholder="e.g. 120"
                    className="col-span-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                  <input type="text" value={r.unit} onChange={e => updateResult(i, 'unit', e.target.value)}
                    placeholder="e.g. mg/dL"
                    className="col-span-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  <input type="text" value={r.referenceRange} onChange={e => updateResult(i, 'referenceRange', e.target.value)}
                    placeholder="e.g. 70-100"
                    className="col-span-3 px-3 py-2 bg-white dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                  <select value={r.flag} onChange={e => updateResult(i, 'flag', e.target.value)}
                    className={cn(
                      'col-span-2 px-2 py-2 rounded-xl text-xs font-black outline-none cursor-pointer',
                      r.flag === 'normal' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700'
                        : r.flag === 'abnormal' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700'
                        : 'bg-red-50 dark:bg-red-900/30 text-red-700'
                    )}>
                    <option value="normal">Normal</option>
                    <option value="abnormal">Abnormal</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="px-6 pb-6 flex gap-3 shrink-0 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button onClick={onClose} disabled={saving}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !canSave}
                className="flex-2 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Results'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Order Card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: LabOrder;
  patient: Patient | undefined;
  expanded: boolean;
  onToggle: () => void;
  onAdvance: (order: LabOrder) => void;
  onEnterResults: (order: LabOrder) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, patient, expanded, onToggle, onAdvance, onEnterResults }) => {
  const cfg = STATUS_CFG[order.status];
  const hasCritical = order.results?.some(r => r.flag === 'critical');
  const hasAbnormal = order.results?.some(r => r.flag === 'abnormal');

  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all" onClick={onToggle}>
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', cfg.bg)}>
            <cfg.icon className={cn('w-5 h-5', cfg.text)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-slate-900 dark:text-white">{order.labNumber}</p>
              <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase', cfg.bg, cfg.text)}>{cfg.label}</span>
              {order.priority !== 'routine' && (
                <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1',
                  order.priority === 'stat' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600')}>
                  {order.priority === 'stat' && <Zap className="w-2.5 h-2.5" />}{order.priority}
                </span>
              )}
              {hasCritical && <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-red-50 dark:bg-red-900/20 text-red-600">Critical Values</span>}
              {!hasCritical && hasAbnormal && <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-900/20 text-amber-600">Abnormal</span>}
            </div>
            <p className="text-xs text-slate-400 font-bold truncate">
              {patient ? `${patient.firstName} ${patient.lastName}` : '—'} · {order.tests.length} test{order.tests.length !== 1 ? 's' : ''} · {fmtDateTime(order.orderedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">

              {/* Tests list */}
              <div className="flex flex-wrap gap-2">
                {order.tests.map(t => (
                  <span key={t} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold">{t}</span>
                ))}
              </div>

              {order.notes && (
                <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl">{order.notes}</p>
              )}

              {/* Results table */}
              {order.results && order.results.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Results</p>
                  <div className="space-y-1.5">
                    {order.results.map((r, i) => {
                      const fc = FLAG_CFG[r.flag];
                      return (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white">{r.testName}</p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                              Ref: {r.referenceRange || '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{r.value} {r.unit}</span>
                            <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase', fc.bg, fc.text)}>{fc.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {order.completedAt && (
                    <p className="text-[10px] text-slate-400 font-bold">Completed {fmtDate(order.completedAt)}</p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <div className="flex gap-3 pt-1">
                  {order.status !== 'processing' && cfg.next && (
                    <button onClick={() => onAdvance(order)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                      <ArrowRight className="w-4 h-4" /> {cfg.nextLabel}
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button onClick={() => onEnterResults(order)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">
                      <CheckCircle2 className="w-4 h-4" /> Enter Results
                    </button>
                  )}
                  <button onClick={() => {
                    db.labOrders.update(order.id, { status: 'cancelled' });
                    onAdvance(order);
                  }}
                    className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const LabOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LabTestStatus | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [resultsTarget, setResultsTarget] = useState<LabOrder | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = () => {
    const isAdmin = user?.role === 'ADMIN';
    const all = isAdmin
      ? db.labOrders.getAll()
      : db.labOrders.getByDoctor(user!.id);
    setOrders(all.sort((a, b) => b.orderedAt.localeCompare(a.orderedAt)));
    setPatients(db.patients.getAll());
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length,
    completed: orders.filter(o => o.status === 'completed').length,
    critical: orders.filter(o => o.results?.some(r => r.flag === 'critical')).length,
  }), [orders]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const pat = patients.find(p => p.id === o.patientId);
        const name = pat ? `${pat.firstName} ${pat.lastName}`.toLowerCase() : '';
        if (!name.includes(q) && !o.labNumber.toLowerCase().includes(q) && !o.tests.join(' ').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, search, patients]);

  const handleAdvance = (order: LabOrder) => {
    const cfg = STATUS_CFG[order.status];
    if (cfg.next) {
      db.labOrders.update(order.id, { status: cfg.next });
    }
    loadData();
  };

  return (
    <div className="space-y-8">
      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadData} doctorId={user!.id} />
      <ResultsModal order={resultsTarget} onClose={() => setResultsTarget(null)} onSaved={loadData} doctorId={user!.id} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Lab Orders</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Order tests and manage diagnostic results</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 self-start">
          <Plus className="w-5 h-5" /> New Order
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, icon: FlaskConical, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'In Progress', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Critical Values', value: stats.critical, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl flex items-center gap-4">
            <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', s.bg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-52 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patient, order number or test..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as LabTestStatus | 'all')}
          className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none cursor-pointer text-slate-600 dark:text-slate-300">
          <option value="all">All Statuses</option>
          {(Object.keys(STATUS_CFG) as LabTestStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CFG[s].label}</option>
          ))}
        </select>
        {(search || statusFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setStatusFilter('all'); }}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-all flex items-center gap-2">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center">
          <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">No lab orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              patient={patients.find(p => p.id === order.patientId)}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              onAdvance={o => { handleAdvance(o); loadData(); }}
              onEnterResults={setResultsTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LabOrders;
