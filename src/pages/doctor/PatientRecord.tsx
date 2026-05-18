import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Activity,
  FileText,
  Pill,
  FlaskConical,
  Heart,
  Thermometer,
  Wind,
  Weight,
  Droplets,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Clock,
  Stethoscope,
  ClipboardList,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import type { Patient, Staff, Appointment, Prescription, ConsultationNote, VitalRecord, Department } from '../../types';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcAge(dob: string) {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

const TABS = [
  { id: 'overview',      label: 'Overview',     icon: User },
  { id: 'vitals',        label: 'Vitals',        icon: Activity },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'notes',         label: 'Notes',         icon: ClipboardList },
];

const STATUS_CLR: Record<string, string> = {
  scheduled:  'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
  confirmed:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
  completed:  'bg-slate-100 text-slate-500 dark:bg-slate-800',
  cancelled:  'bg-red-50 text-red-500 dark:bg-red-900/20',
  in_progress:'bg-violet-50 text-violet-600 dark:bg-violet-900/20',
  no_show:    'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
};

// ─── Add Vitals Modal ─────────────────────────────────────────────────────────

interface AddVitalsModalProps {
  open: boolean;
  patientId: string;
  doctorId: string;
  onClose: () => void;
  onSaved: () => void;
}

const AddVitalsModal: React.FC<AddVitalsModalProps> = ({ open, patientId, doctorId, onClose, onSaved }) => {
  const [form, setForm] = useState({ bp_sys: '', bp_dia: '', hr: '', temp: '', weight: '', height: '', o2: '', rr: '' });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { if (open) setForm({ bp_sys: '', bp_dia: '', hr: '', temp: '', weight: '', height: '', o2: '', rr: '' }); }, [open]);

  const handleSave = () => {
    const required = ['bp_sys', 'bp_dia', 'hr', 'temp', 'weight', 'height', 'o2', 'rr'] as const;
    if (required.some(k => !form[k] || isNaN(Number(form[k])))) {
      toast.error('Please fill in all vital fields with valid numbers');
      return;
    }
    setSaving(true);
    db.vitals.add({
      patientId,
      recordedBy: doctorId,
      bloodPressureSystolic: Number(form.bp_sys),
      bloodPressureDiastolic: Number(form.bp_dia),
      heartRate: Number(form.hr),
      temperature: Number(form.temp),
      weight: Number(form.weight),
      height: Number(form.height),
      oxygenSaturation: Number(form.o2),
      respiratoryRate: Number(form.rr),
      recordedAt: new Date().toISOString(),
    });
    db.auditLogs.create({ userId: doctorId, action: 'CREATE', resource: 'vitals', resourceId: patientId, details: 'Vitals recorded' });
    setTimeout(() => { setSaving(false); onSaved(); onClose(); toast.success('Vitals recorded'); }, 400);
  };

  if (!open) return null;

  const fields = [
    { key: 'bp_sys', label: 'Systolic BP', unit: 'mmHg', placeholder: '120' },
    { key: 'bp_dia', label: 'Diastolic BP', unit: 'mmHg', placeholder: '80' },
    { key: 'hr',     label: 'Heart Rate',   unit: 'bpm',  placeholder: '72' },
    { key: 'temp',   label: 'Temperature',  unit: '°C',   placeholder: '36.6' },
    { key: 'weight', label: 'Weight',       unit: 'kg',   placeholder: '70' },
    { key: 'height', label: 'Height',       unit: 'cm',   placeholder: '175' },
    { key: 'o2',     label: 'O₂ Saturation',unit: '%',    placeholder: '98' },
    { key: 'rr',     label: 'Resp. Rate',   unit: '/min', placeholder: '16' },
  ] as const;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => !saving && onClose()}
      >
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-slate-900 dark:text-white">Record Vitals</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3">
              {fields.map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</label>
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <input
                      type="number"
                      value={form[f.key]}
                      onChange={e => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="flex-1 px-3 py-2.5 bg-transparent text-sm outline-none font-bold text-slate-900 dark:text-white"
                    />
                    <span className="px-2 text-[10px] font-black text-slate-400 border-l border-slate-200 dark:border-slate-700 py-2.5">{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-2 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save Vitals'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Add Note Modal ───────────────────────────────────────────────────────────

interface AddNoteModalProps {
  open: boolean;
  patientId: string;
  doctorId: string;
  appointments: Appointment[];
  onClose: () => void;
  onSaved: () => void;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({ open, patientId, doctorId, appointments, onClose, onSaved }) => {
  const [aptId, setAptId] = useState('');
  const [soap, setSoap] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setAptId(''); setSoap({ subjective: '', objective: '', assessment: '', plan: '' }); } }, [open]);

  const linked = appointments.filter(a => a.status === 'confirmed' || a.status === 'in_progress' || a.status === 'completed').slice(0, 10);

  const handleSave = () => {
    if (!soap.subjective.trim() || !soap.assessment.trim()) {
      toast.error('Subjective and Assessment are required');
      return;
    }
    setSaving(true);
    const note = db.consultationNotes.create({
      patientId,
      doctorId,
      appointmentId: aptId || `standalone-${Date.now()}`,
      ...soap,
    });
    db.auditLogs.create({ userId: doctorId, action: 'CREATE', resource: 'consultation_note', resourceId: note.id, details: 'SOAP note created' });
    setTimeout(() => { setSaving(false); onSaved(); onClose(); toast.success('Note saved'); }, 400);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => !saving && onClose()}
      >
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h3 className="font-black text-slate-900 dark:text-white">Add Consultation Note (SOAP)</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto">
            {linked.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link to Appointment (optional)</label>
                <select value={aptId} onChange={e => setAptId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <option value="">No appointment link</option>
                  {linked.map(a => (
                    <option key={a.id} value={a.id}>{a.date} · {fmtTime(a.time)} — {a.type.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            )}
            {([
              { key: 'subjective',  label: 'S — Subjective',  placeholder: "Patient's complaints, symptoms, history...", required: true },
              { key: 'objective',   label: 'O — Objective',   placeholder: 'Examination findings, test results, observations...' },
              { key: 'assessment',  label: 'A — Assessment',  placeholder: 'Diagnosis or differential diagnoses...', required: true },
              { key: 'plan',        label: 'P — Plan',        placeholder: 'Treatment plan, medications, follow-up, referrals...' },
            ] as const).map(({ key, label, placeholder, required }) => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  {label} {required && <span className="text-red-400">*</span>}
                </label>
                <textarea
                  value={soap[key]}
                  onChange={e => setSoap(s => ({ ...s, [key]: e.target.value }))}
                  placeholder={placeholder}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 dark:text-slate-300"
                />
              </div>
            ))}
          </div>
          <div className="px-6 pb-6 flex gap-3 shrink-0">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-2 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save Note'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PatientRecord: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [assignedDoc, setAssignedDoc] = useState<Staff | null>(null);
  const [dept, setDept] = useState<Department | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [notes, setNotes] = useState<ConsultationNote[]>([]);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);

  const [activeTab, setActiveTab] = useState('overview');
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [expandedRxId, setExpandedRxId] = useState<string | null>(null);

  const loadData = () => {
    if (!patientId) return;
    const p = db.patients.getById(patientId);
    setPatient(p);
    if (p) {
      if (p.assignedDoctorId) {
        const doc = db.staff.getById(p.assignedDoctorId);
        setAssignedDoc(doc);
        if (doc?.departmentId) setDept(db.departments.getById(doc.departmentId));
      }
    }
    const apts = db.appointments.getByPatient(patientId);
    apts.sort((a, b) => b.date.localeCompare(a.date));
    setAppointments(apts);
    const rxs = db.prescriptions.getByPatient(patientId);
    rxs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setPrescriptions(rxs);
    const ns = db.consultationNotes.getByPatient(patientId);
    setNotes(ns);
    const vs = db.vitals.getByPatient(patientId);
    setVitals(vs);
    setAllStaff(db.staff.getAll());
  };

  useEffect(() => { loadData(); }, [patientId]);

  const latestVitals = vitals[0] ?? null;

  const chartData = useMemo(() =>
    [...vitals].reverse().slice(-10).map(v => ({
      date: new Date(v.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      systolic:  v.bloodPressureSystolic,
      diastolic: v.bloodPressureDiastolic,
      heartRate: v.heartRate,
      weight:    v.weight,
    })),
    [vitals]
  );

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400 font-bold">Patient not found</p>
      </div>
    );
  }

  const age = calcAge(patient.dateOfBirth);

  return (
    <div className="space-y-6">
      {/* Modals */}
      <AddVitalsModal open={showVitalsModal} patientId={patient.id} doctorId={user!.id} onClose={() => setShowVitalsModal(false)} onSaved={loadData} />
      <AddNoteModal open={showNoteModal} patientId={patient.id} doctorId={user!.id} appointments={appointments} onClose={() => setShowNoteModal(false)} onSaved={loadData} />

      {/* Back + Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </button>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar + basic */}
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-blue-500/25 shrink-0">
                {getInitials(patient.firstName, patient.lastName)}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</h1>
                <p className="text-sm text-blue-600 font-black">{patient.patientNumber}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider">{age} yrs · {patient.gender}</span>
                  <span className={cn('px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider', patient.bloodType === 'unknown' ? 'bg-slate-100 text-slate-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600')}>
                    {patient.bloodType}
                  </span>
                  <span className={cn('px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider', patient.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-100 text-slate-400')}>
                    {patient.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick vitals */}
            {latestVitals && (
              <div className="md:ml-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Heart, label: 'BP', value: `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}`, unit: 'mmHg', color: 'text-red-500' },
                  { icon: Activity, label: 'HR', value: latestVitals.heartRate, unit: 'bpm', color: 'text-blue-500' },
                  { icon: Thermometer, label: 'Temp', value: latestVitals.temperature, unit: '°C', color: 'text-amber-500' },
                  { icon: Droplets, label: 'SpO₂', value: latestVitals.oxygenSaturation, unit: '%', color: 'text-cyan-500' },
                ].map(v => (
                  <div key={v.label} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center">
                    <v.icon className={cn('w-4 h-4 mx-auto mb-1', v.color)} />
                    <p className="text-sm font-black text-slate-900 dark:text-white">{v.value}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase">{v.unit}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => navigate(`/doctor/prescription/new?patientId=${patient.id}`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
            >
              <Pill className="w-4 h-4" /> Write Prescription
            </button>
            <button
              onClick={() => setShowNoteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-200 transition-all"
            >
              <ClipboardList className="w-4 h-4" /> Add Note
            </button>
            <button
              onClick={() => setShowVitalsModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-200 transition-all"
            >
              <Activity className="w-4 h-4" /> Record Vitals
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
              activeTab === t.id ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── OVERVIEW ─────────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: personal + medical */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 rounded-3xl">
                <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: Calendar, label: 'Date of Birth', value: `${fmtDate(patient.dateOfBirth)} (${age} yrs)` },
                    { icon: User, label: 'Gender', value: patient.gender },
                    { icon: Phone, label: 'Phone', value: patient.phone },
                    { icon: Mail, label: 'Email', value: patient.email },
                    { icon: MapPin, label: 'Address', value: `${patient.address}, ${patient.city}` },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl">
                <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4">Medical Information</h3>
                <div className="space-y-4">
                  {patient.allergies.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" /> Allergies
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {patient.allergies.map(a => (
                          <span key={a} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-xs font-black">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {patient.chronicConditions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Chronic Conditions</p>
                      <div className="flex flex-wrap gap-2">
                        {patient.chronicConditions.map(c => (
                          <span key={c} className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 rounded-xl text-xs font-black">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {patient.insuranceProvider && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Insurance Provider</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{patient.insuranceProvider}</p>
                      </div>
                      {patient.insuranceNumber && (
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Policy Number</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{patient.insuranceNumber}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {!patient.allergies.length && !patient.chronicConditions.length && !patient.insuranceProvider && (
                    <p className="text-sm text-slate-400 font-medium">No medical flags recorded</p>
                  )}
                </div>
              </div>

              {/* Recent appointments */}
              <div className="glass-card p-6 rounded-3xl">
                <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4">Recent Visits</h3>
                {appointments.length === 0 ? (
                  <p className="text-sm text-slate-400">No appointments yet</p>
                ) : (
                  <div className="space-y-2">
                    {appointments.slice(0, 5).map(apt => {
                      const doc = allStaff.find(s => s.id === apt.doctorId);
                      return (
                        <div key={apt.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{fmtDate(apt.date)} at {fmtTime(apt.time)}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{doc ? `Dr. ${doc.firstName} ${doc.lastName}` : '—'} · {apt.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <span className={cn('px-2 py-1 rounded-lg text-[9px] font-black uppercase', STATUS_CLR[apt.status] || 'bg-slate-100 text-slate-500')}>
                            {apt.status.replace('_', ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: emergency + assigned doctor */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-3xl">
                <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4">Emergency Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{patient.emergencyContactName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{patient.emergencyContactPhone}</p>
                  </div>
                </div>
              </div>

              {assignedDoc && (
                <div className="glass-card p-6 rounded-3xl">
                  <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4">Assigned Doctor</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
                      {getInitials(assignedDoc.firstName, assignedDoc.lastName)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white">Dr. {assignedDoc.firstName} {assignedDoc.lastName}</p>
                      <p className="text-xs text-blue-600 font-bold mt-0.5">{assignedDoc.specialization || 'General'}</p>
                      {dept && <p className="text-[10px] text-slate-400 font-bold">{dept.name}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="glass-card p-6 rounded-3xl">
                <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4">Record Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Total Visits', value: appointments.filter(a => a.status === 'completed').length },
                    { label: 'Prescriptions', value: prescriptions.length },
                    { label: 'Active Rx', value: prescriptions.filter(p => p.status === 'active').length },
                    { label: 'SOAP Notes', value: notes.length },
                    { label: 'Vital Records', value: vitals.length },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">{label}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── VITALS ───────────────────────────────────────────────────────────── */}
        {activeTab === 'vitals' && (
          <motion.div key="vitals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">{vitals.length} record{vitals.length !== 1 ? 's' : ''}</p>
              <button onClick={() => setShowVitalsModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all">
                <Plus className="w-4 h-4" /> Record Vitals
              </button>
            </div>

            {vitals.length >= 2 && (
              <div className="glass-card p-6 rounded-3xl">
                <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-6">Blood Pressure & Heart Rate</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                    <Line type="monotone" dataKey="systolic"  name="Systolic"  stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="heartRate" name="Heart Rate" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {vitals.length === 0 ? (
              <div className="glass-card p-16 rounded-3xl text-center">
                <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">No vitals recorded yet</p>
              </div>
            ) : (
              <div className="glass-card rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        {['Date', 'BP', 'HR', 'Temp', 'Weight', 'Height', 'SpO₂', 'RR'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vitals.map((v, i) => (
                        <tr key={v.id} className={cn('border-b border-slate-50 dark:border-slate-800/50', i === 0 && 'bg-blue-50/50 dark:bg-blue-900/10')}>
                          <td className="px-4 py-3 text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">{fmtDate(v.recordedAt)}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{v.heartRate}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{v.temperature}°C</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{v.weight} kg</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{v.height} cm</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{v.oxygenSaturation}%</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{v.respiratoryRate}/min</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── PRESCRIPTIONS ────────────────────────────────────────────────────── */}
        {activeTab === 'prescriptions' && (
          <motion.div key="prescriptions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">{prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}</p>
              <button
                onClick={() => navigate(`/doctor/prescription/new?patientId=${patient.id}`)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all"
              >
                <Plus className="w-4 h-4" /> Write Prescription
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <div className="glass-card p-16 rounded-3xl text-center">
                <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">No prescriptions yet</p>
              </div>
            ) : (
              prescriptions.map(rx => {
                const doc = allStaff.find(s => s.id === rx.doctorId);
                const expanded = expandedRxId === rx.id;
                return (
                  <div key={rx.id} className="glass-card rounded-3xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all"
                      onClick={() => setExpandedRxId(expanded ? null : rx.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider', rx.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                          {rx.status}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{rx.prescriptionNumber}</p>
                          <p className="text-xs text-slate-400 font-bold">{fmtDate(rx.createdAt)} · {rx.items.length} medicine{rx.items.length !== 1 ? 's' : ''} · {doc ? `Dr. ${doc.firstName} ${doc.lastName}` : '—'}</p>
                        </div>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Diagnosis</p>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{rx.diagnosis}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Medicines</p>
                              <div className="space-y-2">
                                {rx.items.map((item, i) => (
                                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <p className="text-sm font-black text-slate-900 dark:text-white">{item.medicine}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{item.dosage} · {item.frequency} · {item.duration}</p>
                                    {item.instructions && <p className="text-xs text-blue-600 mt-0.5 italic">{item.instructions}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-6">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Issued</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{fmtDate(rx.createdAt)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Expires</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{fmtDate(rx.expiresAt)}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ─── NOTES ────────────────────────────────────────────────────────────── */}
        {activeTab === 'notes' && (
          <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
              <button onClick={() => setShowNoteModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all">
                <Plus className="w-4 h-4" /> Add Note
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="glass-card p-16 rounded-3xl text-center">
                <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">No consultation notes yet</p>
              </div>
            ) : (
              notes.map(note => {
                const doc = allStaff.find(s => s.id === note.doctorId);
                const expanded = expandedNoteId === note.id;
                return (
                  <div key={note.id} className="glass-card rounded-3xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all"
                      onClick={() => setExpandedNoteId(expanded ? null : note.id)}
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{fmtDate(note.createdAt)}</p>
                          <p className="text-xs text-slate-400 font-bold">{doc ? `Dr. ${doc.firstName} ${doc.lastName}` : '—'} · {note.assessment.slice(0, 60)}{note.assessment.length > 60 ? '...' : ''}</p>
                        </div>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { label: 'S — Subjective', value: note.subjective, color: 'border-blue-400' },
                              { label: 'O — Objective', value: note.objective, color: 'border-emerald-400' },
                              { label: 'A — Assessment', value: note.assessment, color: 'border-amber-400' },
                              { label: 'P — Plan', value: note.plan, color: 'border-violet-400' },
                            ].map(({ label, value, color }) => (
                              <div key={label} className={cn('p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4', color)}>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{value || <span className="text-slate-300 italic">Not recorded</span>}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientRecord;
