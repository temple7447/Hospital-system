import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pill,
  CheckCircle2,
  Loader2,
  User,
  Calendar,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import type { PrescriptionItem, Patient, Appointment } from '@/types';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

const DURATIONS = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '3 months', '6 months'];
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'Every 6 hours', 'As needed', 'Once weekly', 'Twice weekly'];
const COMMON_MEDS = [
  'Amoxicillin', 'Ibuprofen', 'Paracetamol', 'Metformin', 'Lisinopril',
  'Atorvastatin', 'Amlodipine', 'Omeprazole', 'Cetirizine', 'Azithromycin',
  'Metronidazole', 'Ciprofloxacin', 'Prednisone', 'Diazepam', 'Salbutamol',
];

const emptyItem = (): PrescriptionItem => ({ medicine: '', dosage: '', frequency: 'Once daily', duration: '7 days', instructions: '' });

// ─── Medicine Row ─────────────────────────────────────────────────────────────

interface MedRowProps {
  item: PrescriptionItem;
  index: number;
  onChange: (i: number, field: keyof PrescriptionItem, value: string) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}

const MedRow: React.FC<MedRowProps> = ({ item, index, onChange, onRemove, canRemove }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filtered = COMMON_MEDS.filter(m => m.toLowerCase().includes(item.medicine.toLowerCase()) && item.medicine.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3 relative border border-slate-100 dark:border-slate-800"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicine {index + 1}</span>
        {canRemove && (
          <button onClick={() => onRemove(index)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Medicine name with suggestions */}
        <div className="relative md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Medicine Name *</label>
          <div className="relative">
            <Pill className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={item.medicine}
              onChange={e => { onChange(index, 'medicine', e.target.value); setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g. Amoxicillin 500mg"
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
              {filtered.slice(0, 6).map(m => (
                <button key={m} onMouseDown={() => { onChange(index, 'medicine', m); setShowSuggestions(false); }}
                  className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all">
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Dosage *</label>
          <input type="text" value={item.dosage} onChange={e => onChange(index, 'dosage', e.target.value)}
            placeholder="e.g. 500mg"
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Frequency *</label>
          <select value={item.frequency} onChange={e => onChange(index, 'frequency', e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Duration *</label>
          <select value={item.duration} onChange={e => onChange(index, 'duration', e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Special Instructions</label>
          <input type="text" value={item.instructions || ''} onChange={e => onChange(index, 'instructions', e.target.value)}
            placeholder="e.g. Take with food"
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const WritePrescription: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') || '';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState(preselectedPatientId);
  const [patientSearch, setPatientSearch] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [linkedAptId, setLinkedAptId] = useState('');
  const [aptOptions, setAptOptions] = useState<Appointment[]>([]);

  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [expiresIn, setExpiresIn] = useState('30');
  const [items, setItems] = useState<PrescriptionItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rxNumber, setRxNumber] = useState('');

  useEffect(() => {
    setPatients(db.patients.getAll());
  }, []);

  useEffect(() => {
    if (patientId) {
      const p = db.patients.getById(patientId);
      setPatient(p);
      if (p) {
        const apts = db.appointments.getByPatient(patientId)
          .filter(a => a.status === 'confirmed' || a.status === 'in_progress' || a.status === 'completed')
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 5);
        setAptOptions(apts);
        setPatientSearch(`${p.firstName} ${p.lastName}`);
      }
    }
  }, [patientId]);

  const filteredPatients = patients.filter(p => {
    const q = patientSearch.toLowerCase();
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.patientNumber.toLowerCase().includes(q);
  }).slice(0, 8);

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof PrescriptionItem, value: string) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const isValid = patientId && diagnosis.trim() && items.every(it => it.medicine.trim() && it.dosage.trim());

  const handleSubmit = () => {
    if (!isValid) { toast.error('Please fill in all required fields'); return; }
    setSaving(true);
    const rx = db.prescriptions.create({
      patientId,
      doctorId: user!.id,
      appointmentId: linkedAptId || undefined,
      items,
      diagnosis: diagnosis.trim(),
      notes: notes.trim() || undefined,
      status: 'active',
      expiresAt: addDays(Number(expiresIn)),
    });
    db.notifications.create({
      userId: patientId,
      title: 'New Prescription',
      message: `Dr. ${user!.name.split(' ')[1] || user!.name} has written you a new prescription (${rx.prescriptionNumber}).`,
      type: 'prescription',
      relatedId: rx.id,
    });
    db.auditLogs.create({
      userId: user!.id,
      action: 'CREATE',
      resource: 'prescription',
      resourceId: rx.id,
      details: `Prescription ${rx.prescriptionNumber} written for patient ${patientId}`,
    });
    setRxNumber(rx.prescriptionNumber);
    setTimeout(() => { setSaving(false); setSuccess(true); }, 600);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </motion.div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Prescription Issued</h2>
          <p className="text-blue-600 font-black text-lg mt-1">{rxNumber}</p>
          <p className="text-slate-500 mt-2 text-sm">for {patient?.firstName} {patient?.lastName}</p>
          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate(`/doctor/patient/${patientId}`)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">
              View Patient Record
            </button>
            <button onClick={() => { setSuccess(false); setSaving(false); setDiagnosis(''); setNotes(''); setItems([emptyItem()]); setLinkedAptId(''); if (!preselectedPatientId) { setPatientId(''); setPatientSearch(''); setPatient(null); } }}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
              Write Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Write Prescription</h1>
        <p className="text-slate-500 mt-1 font-medium">Prescribing as Dr. {user?.name.split(' ').slice(1).join(' ') || user?.name}</p>
      </motion.div>

      {/* Patient selection */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h2 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Patient</h2>

        {!preselectedPatientId ? (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={patientSearch}
              onChange={e => { setPatientSearch(e.target.value); setPatientId(''); setPatient(null); }}
              placeholder="Search patient by name or ID..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {patientSearch && !patient && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto">
                {filteredPatients.length === 0
                  ? <p className="text-xs text-slate-400 p-4 text-center">No patients found</p>
                  : filteredPatients.map(p => (
                    <button key={p.id} onClick={() => setPatientId(p.id)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      {p.firstName} {p.lastName}
                      <span className="text-slate-400 font-normal">{p.patientNumber}</span>
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        ) : null}

        {patient && (
          <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shrink-0">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div className="flex-1">
              <p className="font-black text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</p>
              <p className="text-xs text-slate-400 font-bold">{patient.patientNumber}</p>
              {patient.allergies.length > 0 && (
                <p className="text-xs text-red-500 font-bold mt-1">⚠ Allergies: {patient.allergies.join(', ')}</p>
              )}
            </div>
            {!preselectedPatientId && (
              <button onClick={() => { setPatientId(''); setPatient(null); setPatientSearch(''); }} className="p-1.5 rounded-lg hover:bg-white/50 transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        )}

        {aptOptions.length > 0 && (
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link to Appointment (optional)</label>
            <select value={linkedAptId} onChange={e => setLinkedAptId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <option value="">No link</option>
              {aptOptions.map(a => (
                <option key={a.id} value={a.id}>{fmtDate(a.date)} at {fmtTime(a.time)} — {a.type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Diagnosis */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h2 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Diagnosis & Details</h2>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnosis / Condition *</label>
          <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Primary diagnosis or clinical finding..."
            rows={2} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500 font-medium" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid For</label>
            <select value={expiresIn} onChange={e => setExpiresIn(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">6 months</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expires On</label>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{fmtDate(addDays(Number(expiresIn)))}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="General notes for patient or pharmacist..."
            rows={2} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500 font-medium" />
        </div>
      </div>

      {/* Medicines */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Medicines ({items.length})</h2>
          <button onClick={addItem} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-100 transition-all">
            <Plus className="w-4 h-4" /> Add Medicine
          </button>
        </div>

        <AnimatePresence>
          {items.map((item, i) => (
            <MedRow key={i} item={item} index={i} onChange={updateItem} onRemove={removeItem} canRemove={items.length > 1} />
          ))}
        </AnimatePresence>
      </div>

      {/* Submit */}
      <div className="flex gap-4 pb-8">
        <button onClick={() => navigate(-1)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={saving || !isValid}
          className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Issuing...</> : <><Pill className="w-4 h-4" /> Issue Prescription</>}
        </button>
      </div>
    </div>
  );
};

export default WritePrescription;
