import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, Pill, CheckCircle2,
  Loader2, User, Calendar, Search, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { listPatients, getPatient, listAppointments, createPrescription } from '@/lib/services';
import type { PrescriptionItem, Patient, Appointment } from '@/types';
import { toast } from 'sonner';

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function addDays(n: number): string {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

const DURATIONS   = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '3 months', '6 months'];
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'Every 6 hours', 'As needed', 'Once weekly', 'Twice weekly'];
const COMMON_MEDS = [
  'Amoxicillin', 'Ibuprofen', 'Paracetamol', 'Metformin', 'Lisinopril',
  'Atorvastatin', 'Amlodipine', 'Omeprazole', 'Cetirizine', 'Azithromycin',
  'Metronidazole', 'Ciprofloxacin', 'Prednisone', 'Diazepam', 'Salbutamol',
];
const emptyItem = (): PrescriptionItem => ({ medicine: '', dosage: '', frequency: 'Once daily', duration: '7 days', instructions: '' });

// ─── Medicine row ─────────────────────────────────────────────────────────────

interface MedRowProps {
  item: PrescriptionItem;
  index: number;
  onChange: (i: number, field: keyof PrescriptionItem, value: string) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}

const MedRow: React.FC<MedRowProps> = ({ item, index, onChange, onRemove, canRemove }) => {
  const [showSug, setShowSug] = useState(false);
  const filtered = COMMON_MEDS.filter(m => m.toLowerCase().includes(item.medicine.toLowerCase()) && item.medicine.length > 0);

  const inputCls = 'w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200';
  const selectCls = 'w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none text-slate-700 dark:text-slate-300 cursor-pointer';
  const labelCls = 'block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-700/60"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          #{index + 1}
        </span>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-2">
        {/* Medicine name — full width */}
        <div className="col-span-12 relative">
          <label className={labelCls}>Medicine *</label>
          <div className="relative">
            <Pill className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={item.medicine}
              onChange={e => { onChange(index, 'medicine', e.target.value); setShowSug(true); }}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
              placeholder="e.g. Amoxicillin 500mg"
              className={`${inputCls} pl-8`}
            />
          </div>
          {showSug && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-md z-20 overflow-hidden">
              {filtered.slice(0, 5).map(m => (
                <button key={m} onMouseDown={() => { onChange(index, 'medicine', m); setShowSug(false); }}
                  className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dosage */}
        <div className="col-span-4">
          <label className={labelCls}>Dosage *</label>
          <input type="text" value={item.dosage} onChange={e => onChange(index, 'dosage', e.target.value)}
            placeholder="500mg" className={inputCls} />
        </div>

        {/* Frequency */}
        <div className="col-span-4">
          <label className={labelCls}>Frequency</label>
          <select value={item.frequency} onChange={e => onChange(index, 'frequency', e.target.value)} className={selectCls}>
            {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Duration */}
        <div className="col-span-4">
          <label className={labelCls}>Duration</label>
          <select value={item.duration} onChange={e => onChange(index, 'duration', e.target.value)} className={selectCls}>
            {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Instructions */}
        <div className="col-span-12">
          <label className={labelCls}>Instructions</label>
          <input type="text" value={item.instructions || ''} onChange={e => onChange(index, 'instructions', e.target.value)}
            placeholder="e.g. Take with food, avoid alcohol…" className={inputCls} />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const WritePrescription: React.FC = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') || '';

  const [patients, setPatients]     = useState<Patient[]>([]);
  const [patientId, setPatientId]   = useState(preselectedPatientId);
  const [patientSearch, setPSearch] = useState('');
  const [patient, setPatient]       = useState<Patient | null>(null);
  const [linkedAptId, setLinkedApt] = useState('');
  const [aptOptions, setAptOptions] = useState<Appointment[]>([]);

  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes]         = useState('');
  const [expiresIn, setExpiresIn] = useState('30');
  const [items, setItems]         = useState<PrescriptionItem[]>([emptyItem()]);
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState(false);
  const [rxNumber, setRxNumber]   = useState('');

  useEffect(() => { listPatients().then(setPatients); }, []);

  useEffect(() => {
    if (!patientId) return;
    Promise.all([
      getPatient(patientId).catch(() => null as unknown as Patient),
      listAppointments({ patient_id: patientId }),
    ]).then(([p, apts]) => {
      setPatient(p);
      if (p) {
        const filtered = apts
          .filter(a => a.status === 'confirmed' || a.status === 'in_progress' || a.status === 'completed')
          .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
        setAptOptions(filtered);
        setPSearch(`${p.firstName} ${p.lastName}`);
      }
    });
  }, [patientId]);

  const filteredPatients = patients.filter(p => {
    const q = patientSearch.toLowerCase();
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.patientNumber.toLowerCase().includes(q);
  }).slice(0, 8);

  const addItem    = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof PrescriptionItem, value: string) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const isValid = patientId && diagnosis.trim() && items.every(it => it.medicine.trim() && it.dosage.trim());

  const handleSubmit = async () => {
    if (!isValid) { toast.error('Please fill in all required fields'); return; }
    setSaving(true);
    try {
      const id = await createPrescription({
        patientId,
        doctorId: user!.id,
        appointmentId: linkedAptId || undefined,
        items,
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || undefined,
        status: 'active',
        expiresAt: addDays(Number(expiresIn)),
      });
      setRxNumber(id);
      setSuccess(true);
    } catch {
      toast.error('Failed to issue prescription');
    } finally {
      setSaving(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-xs">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Prescription Issued</h2>
          <p className="text-blue-600 font-semibold mt-1">{rxNumber}</p>
          <p className="text-slate-400 text-sm mt-1">
            for {patient?.firstName} {patient?.lastName}
          </p>
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => navigate(`/doctor/patient/${patientId}`)}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              View Patient
            </button>
            <button
              onClick={() => {
                setSuccess(false); setSaving(false); setDiagnosis(''); setNotes('');
                setItems([emptyItem()]); setLinkedApt('');
                if (!preselectedPatientId) { setPatientId(''); setPSearch(''); setPatient(null); }
              }}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Write Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  const sectionTitle = 'text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3';
  const labelCls     = 'block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1';
  const fieldCls     = 'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200';

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">Write Prescription</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-slate-400">
            Dr. {user?.name.split(' ').slice(1).join(' ') || user?.name}
          </span>
          <button
            onClick={handleSubmit}
            disabled={saving || !isValid}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Issuing…</>
              : <><Pill className="w-3.5 h-3.5" /> Issue Prescription</>}
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0">

        {/* ── Left panel: Patient + Diagnosis ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-0.5">

          {/* Patient card */}
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
            <p className={sectionTitle}>Patient</p>

            {!preselectedPatientId && (
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={e => { setPSearch(e.target.value); setPatientId(''); setPatient(null); }}
                  placeholder="Search by name or ID…"
                  className={`${fieldCls} pl-8`}
                />
                {patientSearch && !patient && (
                  <div className="absolute top-full left-0 right-0 mt-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-md z-20 max-h-48 overflow-y-auto">
                    {filteredPatients.length === 0
                      ? <p className="text-[12px] text-slate-400 p-3 text-center">No patients found</p>
                      : filteredPatients.map(p => (
                        <button key={p.id} onClick={() => setPatientId(p.id)}
                          className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{p.firstName} {p.lastName}</span>
                          <span className="text-slate-400 text-[11px] ml-auto">{p.patientNumber}</span>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {patient ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white text-[12px] font-semibold shrink-0">
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-white truncate">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-[11px] text-slate-400">{patient.patientNumber}</p>
                  {patient.allergies.length > 0 && (
                    <p className="text-[11px] text-red-500 font-medium mt-0.5">
                      Allergies: {patient.allergies.join(', ')}
                    </p>
                  )}
                </div>
                {!preselectedPatientId && (
                  <button onClick={() => { setPatientId(''); setPatient(null); setPSearch(''); }}
                    className="p-1 rounded hover:bg-white/60 dark:hover:bg-slate-700 transition-colors">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded border border-dashed border-slate-200 dark:border-slate-700">
                <User className="w-4 h-4 text-slate-300" />
                <p className="text-[12px] text-slate-400">No patient selected</p>
              </div>
            )}

            {aptOptions.length > 0 && (
              <div className="mt-3">
                <label className={labelCls}>Link to appointment (optional)</label>
                <select value={linkedAptId} onChange={e => setLinkedApt(e.target.value)}
                  className={fieldCls}>
                  <option value="">No link</option>
                  {aptOptions.map(a => (
                    <option key={a.id} value={a.id}>
                      {fmtDate(a.date)} at {fmtTime(a.time)} — {a.type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Diagnosis & Notes */}
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4 space-y-3">
            <p className={sectionTitle}>Diagnosis</p>

            <div>
              <label className={labelCls}>Diagnosis / Condition *</label>
              <textarea
                value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                placeholder="Primary diagnosis or clinical finding…"
                rows={3}
                className={`${fieldCls} resize-none`}
              />
            </div>

            <div>
              <label className={labelCls}>Additional Notes</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Notes for patient or pharmacist…"
                rows={2}
                className={`${fieldCls} resize-none`}
              />
            </div>
          </div>

          {/* Validity */}
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
            <p className={sectionTitle}>Validity</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Valid for</label>
                <select value={expiresIn} onChange={e => setExpiresIn(e.target.value)} className={fieldCls}>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">6 months</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Expires on</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[13px] text-slate-600 dark:text-slate-300">
                    {fmtDate(addDays(Number(expiresIn)))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel — bottom of left col */}
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2 text-[13px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* ── Right panel: Medicines ───────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-3">
              <p className={`${sectionTitle} mb-0`}>
                Medicines
                <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] text-slate-500">
                  {items.length}
                </span>
              </p>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
              <AnimatePresence>
                {items.map((item, i) => (
                  <MedRow key={i} item={item} index={i} onChange={updateItem} onRemove={removeItem} canRemove={items.length > 1} />
                ))}
              </AnimatePresence>
            </div>

            {/* Inline validation hint */}
            {!isValid && (patientId || diagnosis) && (
              <p className="mt-3 text-[11px] text-amber-500 flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3" />
                {!patientId ? 'Select a patient' : !diagnosis.trim() ? 'Enter a diagnosis' : 'Fill in medicine name and dosage for all items'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritePrescription;
