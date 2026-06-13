import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronRight, Loader2,
  User, Mail, Phone, MapPin, Calendar, Droplets,
  Heart, Thermometer, Activity, Wind, Weight,
  Pill, FlaskConical, FileText, Stethoscope,
  AlertTriangle, ShieldCheck, CreditCard, Phone as PhoneIcon,
  Clock, CheckCircle2, XCircle, AlertCircle, ClipboardList,
  TrendingUp, TrendingDown, Minus, ExternalLink,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type {
  Patient, Appointment, Prescription, VitalRecord,
  LabOrder, Staff, AppointmentStatus, PrescriptionStatus, LabTestStatus,
} from '@/types';
import {
  getPatient, listAppointments, listPrescriptions,
  listVitals, listLabOrders, listStaff,
} from '@/lib/services';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}
function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const bloodColors: Record<string, string> = {
  'A+': 'text-red-600 bg-red-50 dark:bg-red-900/20',
  'A-': 'text-red-600 bg-red-50 dark:bg-red-900/20',
  'B+': 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  'B-': 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  'AB+': 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  'AB-': 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  'O+': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  'O-': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  unknown: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
};

const apptStatusMeta: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  scheduled:   { label: 'Scheduled',   color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20',    icon: <Clock className="w-3 h-3" /> },
  confirmed:   { label: 'Confirmed',   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: <CheckCircle2 className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',  icon: <Activity className="w-3 h-3" /> },
  completed:   { label: 'Completed',   color: 'text-slate-600',   bg: 'bg-slate-100 dark:bg-slate-800',    icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled:   { label: 'Cancelled',   color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20',      icon: <XCircle className="w-3 h-3" /> },
  no_show:     { label: 'No Show',     color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-900/20', icon: <AlertCircle className="w-3 h-3" /> },
};

const rxStatusMeta: Record<PrescriptionStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',     color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  completed: { label: 'Completed',  color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-800' },
  cancelled: { label: 'Cancelled',  color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20' },
  dispensed: { label: 'Dispensed',  color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
};

const labStatusMeta: Record<LabTestStatus, { label: string; color: string; bg: string }> = {
  ordered:    { label: 'Ordered',    color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  collected:  { label: 'Collected',  color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  processing: { label: 'Processing', color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/20' },
  completed:  { label: 'Completed',  color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value?: string | null; icon?: React.ReactNode; mono?: boolean; accent?: string }> = ({ label, value, icon, mono, accent }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
    {icon && <span className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</span>}
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={cn('text-sm font-semibold mt-0.5 truncate', mono && 'font-mono',
        accent ?? 'text-slate-800 dark:text-slate-200',
        !value && 'text-slate-400 italic font-normal')}>
        {value || 'Not provided'}
      </p>
    </div>
  </div>
);

const Card: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className }) => (
  <div className={cn('glass-card rounded-lg p-5', className)}>
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
      <span className="text-blue-500">{icon}</span>
      <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

// ─── Vital indicator ──────────────────────────────────────────────────────────
function vitalStatus(key: string, val: number): 'normal' | 'warning' | 'critical' {
  const ranges: Record<string, [number, number, number, number]> = {
    heartRate:              [40, 60, 100, 120],
    bloodPressureSystolic:  [80, 90, 140, 180],
    bloodPressureDiastolic: [50, 60, 90, 110],
    temperature:            [35.5, 36.1, 37.5, 38.5],
    oxygenSaturation:       [88, 94, 100, 100],
    respiratoryRate:        [8, 12, 20, 25],
  };
  const r = ranges[key];
  if (!r) return 'normal';
  const [critLow, normLow, normHigh, critHigh] = r;
  if (val <= critLow || val >= critHigh) return 'critical';
  if (val < normLow || val > normHigh) return 'warning';
  return 'normal';
}
const vitalColor = { normal: 'text-emerald-600', warning: 'text-amber-500', critical: 'text-red-600' };
const vitalBg    = { normal: 'bg-emerald-50 dark:bg-emerald-900/20', warning: 'bg-amber-50 dark:bg-amber-900/20', critical: 'bg-red-50 dark:bg-red-900/20' };
const VitalIcon  = { normal: <Minus className="w-3 h-3" />, warning: <TrendingUp className="w-3 h-3" />, critical: <AlertTriangle className="w-3 h-3" /> };

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'appointments' | 'prescriptions' | 'vitals' | 'labs';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',      label: 'Overview',      icon: <User className="w-4 h-4" /> },
  { id: 'appointments',  label: 'Appointments',  icon: <Calendar className="w-4 h-4" /> },
  { id: 'prescriptions', label: 'Prescriptions', icon: <Pill className="w-4 h-4" /> },
  { id: 'vitals',        label: 'Vitals',        icon: <Activity className="w-4 h-4" /> },
  { id: 'labs',          label: 'Lab Orders',    icon: <FlaskConical className="w-4 h-4" /> },
];

// ─── Main page ────────────────────────────────────────────────────────────────
const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient,       setPatient]       = useState<Patient | null>(null);
  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [vitals,        setVitals]        = useState<VitalRecord[]>([]);
  const [labOrders,     setLabOrders]     = useState<LabOrder[]>([]);
  const [allStaff,      setAllStaff]      = useState<Staff[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState<Tab>('overview');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getPatient(id),
      listAppointments({ patient_id: id }),
      listPrescriptions({ patient_id: id }),
      listVitals({ patient_id: id }),
      listLabOrders({ patient_id: id }),
      listStaff(),
    ])
      .then(([p, appts, rxs, v, labs, staff]) => {
        setPatient(p);
        setAppointments(appts.sort((a, b) => b.date.localeCompare(a.date)));
        setPrescriptions(rxs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setVitals(v.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)));
        setLabOrders(labs.sort((a, b) => b.orderedAt.localeCompare(a.orderedAt)));
        setAllStaff(staff);
      })
      .catch(() => toast.error('Failed to load patient data'))
      .finally(() => setLoading(false));
  }, [id]);

  const assignedDoctor = useMemo(
    () => patient?.assignedDoctorId ? allStaff.find(s => s.userId === patient.assignedDoctorId || s.id === patient.assignedDoctorId) : null,
    [patient, allStaff]
  );
  const latestVital = vitals[0] ?? null;

  const tabCounts: Record<Tab, number> = {
    overview:      0,
    appointments:  appointments.length,
    prescriptions: prescriptions.length,
    vitals:        vitals.length,
    labs:          labOrders.length,
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );
  if (!patient) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-slate-500">Patient not found.</p>
      <button onClick={() => navigate('/patients')} className="btn-primary px-5 py-2 text-sm">Back to Patients</button>
    </div>
  );

  const initials  = `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  const age       = calcAge(patient.dateOfBirth);
  const bloodCls  = bloodColors[patient.bloodType] ?? bloodColors.unknown;
  const statusCls = patient.status === 'active' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                  : patient.status === 'deceased' ? 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                  : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10 max-w-6xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link to="/patients" className="hover:text-blue-600 transition-colors font-medium">Patients</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-600 dark:text-slate-300 font-semibold">{patient.firstName} {patient.lastName}</span>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="glass-card rounded-lg overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="px-8 pb-7">
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-10 mb-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-lg bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900  flex items-center justify-center text-2xl font-semibold text-blue-600 select-none">
              {initials}
            </div>
            {/* Quick actions */}
            <div className="flex gap-2 mt-12">
              <Link to="/patients"
                className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Back
              </Link>
            </div>
          </div>

          {/* Name + badges */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg uppercase tracking-wide', statusCls)}>
                  {patient.status}
                </span>
                <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1', bloodCls)}>
                  <Droplets className="w-3 h-3" /> {patient.bloodType}
                </span>
                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}, {age} yrs
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Patient ID</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white font-mono">#{patient.patientNumber}</p>
              <p className="text-xs text-slate-400 mt-0.5">Registered {fmt(patient.registeredAt)}</p>
            </div>
          </div>

          {/* Quick stat pills */}
          <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            {[
              { label: 'Appointments', value: appointments.length,  color: 'text-blue-600'    },
              { label: 'Prescriptions', value: prescriptions.filter(p => p.status === 'active').length + ' active', color: 'text-emerald-600' },
              { label: 'Lab Orders',   value: labOrders.length,     color: 'text-amber-600'   },
              { label: 'Vitals Recorded', value: vitals.length,     color: 'text-violet-600'  },
              ...(latestVital ? [{ label: 'Last BP', value: `${latestVital.bloodPressureSystolic}/${latestVital.bloodPressureDiastolic}`, color: 'text-rose-600' }] : []),
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-md px-4 py-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className={cn('text-sm font-semibold', color)}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all',
              tab === t.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            {t.icon} {t.label}
            {tabCounts[t.id] > 0 && (
              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-lg min-w-[18px] text-center',
                tab === t.id ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')}>
                {tabCounts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left column */}
              <div className="lg:col-span-2 space-y-5">
                <Card title="Personal Information" icon={<User className="w-4 h-4" />}>
                  <InfoRow label="Full Name"      value={`${patient.firstName} ${patient.lastName}`} icon={<User className="w-3.5 h-3.5" />} />
                  <InfoRow label="Date of Birth"  value={`${fmt(patient.dateOfBirth)} (${age} years old)`} icon={<Calendar className="w-3.5 h-3.5" />} />
                  <InfoRow label="Gender"         value={patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)} icon={<User className="w-3.5 h-3.5" />} />
                  <InfoRow label="Blood Type"     value={patient.bloodType} icon={<Droplets className="w-3.5 h-3.5" />} accent={bloodCls.split(' ')[0]} />
                  <InfoRow label="Address"        value={patient.address} icon={<MapPin className="w-3.5 h-3.5" />} />
                  <InfoRow label="City"           value={patient.city} icon={<MapPin className="w-3.5 h-3.5" />} />
                </Card>

                <Card title="Contact Information" icon={<Mail className="w-4 h-4" />}>
                  <InfoRow label="Email Address" value={patient.email} icon={<Mail className="w-3.5 h-3.5" />} />
                  <InfoRow label="Phone Number"  value={patient.phone} icon={<Phone className="w-3.5 h-3.5" />} />
                </Card>

                <Card title="Medical Background" icon={<Heart className="w-4 h-4" />}>
                  <div className="mb-4">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Allergies</p>
                    {patient.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {patient.allergies.map(a => (
                          <span key={a} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {a}
                          </span>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-400 italic">No known allergies</p>}
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Chronic Conditions</p>
                    {patient.chronicConditions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {patient.chronicConditions.map(c => (
                          <span key={c} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600">{c}</span>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-400 italic">No chronic conditions recorded</p>}
                  </div>
                </Card>
              </div>

              {/* Right column */}
              <div className="space-y-5">
                <Card title="Emergency Contact" icon={<PhoneIcon className="w-4 h-4" />}>
                  <InfoRow label="Contact Name"  value={patient.emergencyContactName}  icon={<User className="w-3.5 h-3.5" />} />
                  <InfoRow label="Phone Number"  value={patient.emergencyContactPhone} icon={<Phone className="w-3.5 h-3.5" />} />
                </Card>

                <Card title="Insurance" icon={<ShieldCheck className="w-4 h-4" />}>
                  <InfoRow label="Insurance Provider" value={patient.insuranceProvider} icon={<ShieldCheck className="w-3.5 h-3.5" />} />
                  <InfoRow label="Policy Number"      value={patient.insuranceNumber}   icon={<CreditCard className="w-3.5 h-3.5" />} mono />
                </Card>

                <Card title="Assigned Doctor" icon={<Stethoscope className="w-4 h-4" />}>
                  {assignedDoctor ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm font-semibold text-blue-600">
                        {assignedDoctor.firstName[0]}{assignedDoctor.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Dr. {assignedDoctor.firstName} {assignedDoctor.lastName}</p>
                        <p className="text-xs text-slate-400">{assignedDoctor.specialization || assignedDoctor.role.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No assigned doctor</p>
                  )}
                </Card>

                {/* Latest vitals snapshot */}
                {latestVital && (
                  <Card title="Latest Vitals" icon={<Activity className="w-4 h-4" />}>
                    <p className="text-[10px] text-slate-400 mb-3">{fmtTime(latestVital.recordedAt)}</p>
                    {[
                      { key: 'heartRate',             label: 'Heart Rate',    value: latestVital.heartRate,             unit: 'bpm',  icon: <Heart className="w-3.5 h-3.5" /> },
                      { key: 'bloodPressureSystolic',  label: 'Blood Pressure',value: latestVital.bloodPressureSystolic, unit: `/${latestVital.bloodPressureDiastolic} mmHg`, icon: <Activity className="w-3.5 h-3.5" /> },
                      { key: 'temperature',            label: 'Temperature',   value: latestVital.temperature,           unit: '°C',   icon: <Thermometer className="w-3.5 h-3.5" /> },
                      { key: 'oxygenSaturation',       label: 'SpO₂',          value: latestVital.oxygenSaturation,      unit: '%',    icon: <Wind className="w-3.5 h-3.5" /> },
                    ].map(({ key, label, value, unit, icon }) => {
                      const st = vitalStatus(key, value);
                      return (
                        <div key={key} className={cn('flex items-center justify-between p-2.5 rounded-lg mb-2 last:mb-0', vitalBg[st])}>
                          <div className="flex items-center gap-2">
                            <span className={vitalColor[st]}>{icon}</span>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={cn('text-sm font-semibold', vitalColor[st])}>{value}</span>
                            <span className="text-[10px] text-slate-400">{unit}</span>
                            <span className={vitalColor[st]}>{VitalIcon[st]}</span>
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={() => setTab('vitals')} className="w-full mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 transition-colors">
                      View all vitals <ExternalLink className="w-3 h-3" />
                    </button>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ── APPOINTMENTS ── */}
          {tab === 'appointments' && (
            <div className="glass-card rounded-lg overflow-hidden">
              {appointments.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                  <Calendar className="w-10 h-10 text-slate-300" />
                  <p className="font-bold text-slate-500">No appointments found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {appointments.map(appt => {
                    const s = apptStatusMeta[appt.status];
                    const doctor = allStaff.find(st => st.id === appt.doctorId || st.userId === appt.doctorId);
                    return (
                      <div key={appt.id} className="flex items-start gap-4 p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{appt.type.replace(/_/g, ' ')}</p>
                            <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg', s.bg, s.color)}>
                              {s.icon} {s.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{fmt(appt.date)} at {appt.time}</p>
                          {appt.reason && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{appt.reason}</p>}
                          {doctor && <p className="text-xs text-slate-400 mt-0.5">Dr. {doctor.firstName} {doctor.lastName}</p>}
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 dark:text-slate-600 flex-shrink-0">#{appt.appointmentNumber}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PRESCRIPTIONS ── */}
          {tab === 'prescriptions' && (
            <div className="space-y-4">
              {prescriptions.length === 0 ? (
                <div className="glass-card rounded-lg flex flex-col items-center gap-3 py-20 text-center">
                  <Pill className="w-10 h-10 text-slate-300" />
                  <p className="font-bold text-slate-500">No prescriptions found</p>
                </div>
              ) : prescriptions.map(rx => {
                const s = rxStatusMeta[rx.status];
                const doctor = allStaff.find(st => st.id === rx.doctorId || st.userId === rx.doctorId);
                return (
                  <div key={rx.id} className="glass-card rounded-lg p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono">#{rx.prescriptionNumber}</span>
                          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-lg', s.bg, s.color)}>{s.label}</span>
                        </div>
                        {rx.diagnosis && <p className="text-xs font-semibold text-slate-500 mt-1">{rx.diagnosis}</p>}
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : ''} · {fmt(rx.createdAt)}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 flex-shrink-0">Expires {fmt(rx.expiresAt)}</p>
                    </div>
                    <div className="space-y-2">
                      {rx.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                          <Pill className="w-4 h-4 text-violet-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.medicine}</p>
                            <p className="text-xs text-slate-500">{item.dosage} · {item.frequency} · {item.duration}</p>
                            {item.instructions && <p className="text-xs text-slate-400 italic">{item.instructions}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── VITALS ── */}
          {tab === 'vitals' && (
            <div className="space-y-4">
              {vitals.length === 0 ? (
                <div className="glass-card rounded-lg flex flex-col items-center gap-3 py-20 text-center">
                  <Activity className="w-10 h-10 text-slate-300" />
                  <p className="font-bold text-slate-500">No vitals recorded</p>
                </div>
              ) : vitals.map((v, idx) => (
                <div key={v.id} className="glass-card rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {idx === 0 && <span className="text-[10px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-lg">LATEST</span>}
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{fmtTime(v.recordedAt)}</span>
                    </div>
                    <span className="text-xs text-slate-400">Recorded by staff</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { key: 'heartRate',            label: 'Heart Rate',    value: v.heartRate,            unit: 'bpm',  icon: <Heart className="w-4 h-4" /> },
                      { key: 'bloodPressureSystolic', label: 'Blood Pressure',value: v.bloodPressureSystolic,unit: `/${v.bloodPressureDiastolic}`, icon: <Activity className="w-4 h-4" /> },
                      { key: 'temperature',           label: 'Temperature',   value: v.temperature,          unit: '°C',   icon: <Thermometer className="w-4 h-4" /> },
                      { key: 'oxygenSaturation',      label: 'SpO₂',          value: v.oxygenSaturation,     unit: '%',    icon: <Wind className="w-4 h-4" /> },
                      { key: 'respiratoryRate',        label: 'Resp. Rate',    value: v.respiratoryRate,      unit: '/min', icon: <Wind className="w-4 h-4" /> },
                      { label: 'Weight',  value: v.weight,  unit: 'kg',  key: 'weight',  icon: <Weight className="w-4 h-4" /> },
                      { label: 'Height',  value: v.height,  unit: 'cm',  key: 'height',  icon: <TrendingUp className="w-4 h-4" /> },
                    ].map(({ key, label, value, unit, icon }) => {
                      const st = vitalStatus(key, value);
                      return (
                        <div key={key} className={cn('p-3 rounded-md', vitalBg[st])}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn('text-xs font-bold text-slate-500', vitalColor[st])}>{icon}</span>
                            <span className={cn('text-[10px] font-semibold', vitalColor[st])}>{st !== 'normal' ? st.toUpperCase() : ''}</span>
                          </div>
                          <p className={cn('text-lg font-semibold', vitalColor[st])}>{value}<span className="text-xs font-normal ml-0.5">{unit}</span></p>
                          <p className="text-[10px] text-slate-400 font-medium">{label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── LAB ORDERS ── */}
          {tab === 'labs' && (
            <div className="space-y-4">
              {labOrders.length === 0 ? (
                <div className="glass-card rounded-lg flex flex-col items-center gap-3 py-20 text-center">
                  <FlaskConical className="w-10 h-10 text-slate-300" />
                  <p className="font-bold text-slate-500">No lab orders found</p>
                </div>
              ) : labOrders.map(lab => {
                const s = labStatusMeta[lab.status];
                const doctor = allStaff.find(st => st.id === lab.doctorId || st.userId === lab.doctorId);
                const hasResults = lab.results && lab.results.length > 0;
                return (
                  <div key={lab.id} className="glass-card rounded-lg p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold font-mono text-slate-900 dark:text-white">#{lab.labNumber}</span>
                          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-lg', s.bg, s.color)}>{s.label}</span>
                          {lab.priority !== 'routine' && (
                            <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-lg uppercase',
                              lab.priority === 'stat' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600')}>
                              {lab.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : ''} · Ordered {fmt(lab.orderedAt)}
                          {lab.completedAt ? ` · Completed ${fmt(lab.completedAt)}` : ''}
                        </p>
                      </div>
                    </div>
                    {/* Tests ordered */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {lab.tests.map(t => (
                        <span key={t} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{t}</span>
                      ))}
                    </div>
                    {/* Results */}
                    {hasResults && (
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Results</p>
                        {lab.results!.map((r, i) => (
                          <div key={i} className={cn('flex items-center justify-between p-3 rounded-md',
                            r.flag === 'critical' ? 'bg-red-50 dark:bg-red-900/20' :
                            r.flag === 'abnormal' ? 'bg-amber-50 dark:bg-amber-900/20' :
                            'bg-slate-50 dark:bg-slate-800')}>
                            <div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{r.testName}</p>
                              <p className="text-[10px] text-slate-400">Ref: {r.referenceRange} {r.unit}</p>
                            </div>
                            <div className="text-right">
                              <p className={cn('text-sm font-semibold',
                                r.flag === 'critical' ? 'text-red-600' :
                                r.flag === 'abnormal' ? 'text-amber-600' :
                                'text-emerald-600')}>
                                {r.value} <span className="text-xs font-normal">{r.unit}</span>
                              </p>
                              <span className={cn('text-[10px] font-semibold uppercase',
                                r.flag === 'critical' ? 'text-red-500' :
                                r.flag === 'abnormal' ? 'text-amber-500' :
                                'text-emerald-500')}>{r.flag}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default PatientDetailPage;
