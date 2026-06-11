import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Clock,
  BadgeCheck, Building2, Stethoscope, KeyRound, User,
  ShieldCheck, Eye, EyeOff, Save, Loader2, UserX, UserCheck,
  Syringe, Activity, Heart, Brain, Baby, Microscope, Wind,
  FlaskConical, Pill, RadioTower, Users, ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Staff, StaffStatus, Department } from '@/types';
import { getStaff, updateStaff, listDepartments } from '@/lib/services';
import { resetStaffPassword } from '@/lib/services/staffService';

// ─── Re-use role helpers from Staff page ──────────────────────────────────────
const ROLE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }> = {
  admin:                    { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20',   label: 'Admin' },
  chief_medical_officer:    { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20',   label: 'Chief Medical Officer' },
  medical_director:         { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20',   label: 'Medical Director' },
  medical_superintendent:   { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20',   label: 'Medical Superintendent' },
  coo:                      { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20',   label: 'Chief Operating Officer' },
  cfo:                      { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20',   label: 'Chief Financial Officer' },
  hr_manager:               { icon: Users,       color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20',   label: 'HR Manager' },
  quality_manager:          { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20',   label: 'Quality Manager' },
  legal_compliance_officer: { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20',   label: 'Legal & Compliance Officer' },
  doctor:                   { icon: Stethoscope, color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20',       label: 'Doctor' },
  surgeon:                  { icon: Activity,    color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20',       label: 'Surgeon' },
  trauma_surgeon:           { icon: Activity,    color: 'text-red-600',      bg: 'bg-red-50 dark:bg-red-900/20',         label: 'Trauma Surgeon' },
  anesthesiologist:         { icon: Syringe,     color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20',       label: 'Anesthesiologist' },
  intensivist:              { icon: Activity,    color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20',       label: 'Intensivist' },
  emergency_physician:      { icon: Activity,    color: 'text-red-600',      bg: 'bg-red-50 dark:bg-red-900/20',         label: 'Emergency Physician' },
  pediatrician:             { icon: Baby,        color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20',       label: 'Pediatrician' },
  cardiologist:             { icon: Heart,       color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20',       label: 'Cardiologist' },
  neurologist:              { icon: Brain,       color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20',       label: 'Neurologist' },
  oncologist:               { icon: Microscope,  color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20',       label: 'Oncologist' },
  gynecologist:             { icon: Stethoscope, color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20',       label: 'Gynecologist' },
  psychiatrist:             { icon: Brain,       color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20',       label: 'Psychiatrist' },
  pathologist:              { icon: Microscope,  color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20',       label: 'Pathologist' },
  radiologist:              { icon: RadioTower,  color: 'text-cyan-600',     bg: 'bg-cyan-50 dark:bg-cyan-900/20',       label: 'Radiologist' },
  resident_doctor:          { icon: Stethoscope, color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20',       label: 'Resident Doctor' },
  intern:                   { icon: Stethoscope, color: 'text-slate-600',    bg: 'bg-slate-100 dark:bg-slate-800',       label: 'Intern' },
  chief_nursing_officer:    { icon: UserCheck,   color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20',       label: 'Chief Nursing Officer' },
  nurse_manager:            { icon: UserCheck,   color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20',       label: 'Nurse Manager' },
  nurse:                    { icon: UserCheck,   color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20',       label: 'Registered Nurse' },
  nurse_practitioner:       { icon: UserCheck,   color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20',       label: 'Nurse Practitioner' },
  icu_nurse:                { icon: Activity,    color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20',       label: 'ICU Nurse' },
  er_nurse:                 { icon: Activity,    color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20',       label: 'ER Nurse' },
  or_nurse:                 { icon: UserCheck,   color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20',       label: 'OR Nurse' },
  midwife:                  { icon: Baby,        color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20',       label: 'Midwife' },
  nursing_assistant:        { icon: UserCheck,   color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20',       label: 'Nursing Assistant' },
  infection_control_nurse:  { icon: ShieldCheck, color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20',       label: 'Infection Control Nurse' },
  receptionist:             { icon: Users,       color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Receptionist' },
  admissions_officer:       { icon: Users,       color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Admissions Officer' },
  medical_records_clerk:    { icon: Users,       color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Medical Records Clerk' },
  billing_specialist:       { icon: Users,       color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Billing Specialist' },
  patient_relations_officer:{ icon: Users,       color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Patient Relations Officer' },
  pharmacist:               { icon: Pill,        color: 'text-violet-600',   bg: 'bg-violet-50 dark:bg-violet-900/20',   label: 'Pharmacist' },
  pharmacy_technician:      { icon: Pill,        color: 'text-violet-600',   bg: 'bg-violet-50 dark:bg-violet-900/20',   label: 'Pharmacy Technician' },
  lab_technician:           { icon: FlaskConical,color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20',     label: 'Lab Technician' },
  radiologic_technologist:  { icon: RadioTower,  color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20',     label: 'Radiologic Technologist' },
  phlebotomist:             { icon: Syringe,     color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20',     label: 'Phlebotomist' },
  ecg_technician:           { icon: Activity,    color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20',     label: 'ECG Technician' },
  sonographer:              { icon: Activity,    color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20',     label: 'Sonographer' },
  surgical_technologist:    { icon: Activity,    color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20',     label: 'Surgical Technologist' },
  sterilization_technician: { icon: FlaskConical,color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20',     label: 'Sterilization Technician' },
  respiratory_therapist:    { icon: Wind,        color: 'text-teal-600',     bg: 'bg-teal-50 dark:bg-teal-900/20',       label: 'Respiratory Therapist' },
  physical_therapist:       { icon: Activity,    color: 'text-teal-600',     bg: 'bg-teal-50 dark:bg-teal-900/20',       label: 'Physical Therapist' },
  occupational_therapist:   { icon: Activity,    color: 'text-teal-600',     bg: 'bg-teal-50 dark:bg-teal-900/20',       label: 'Occupational Therapist' },
  speech_therapist:         { icon: Activity,    color: 'text-teal-600',     bg: 'bg-teal-50 dark:bg-teal-900/20',       label: 'Speech Therapist' },
  social_worker:            { icon: Users,       color: 'text-orange-600',   bg: 'bg-orange-50 dark:bg-orange-900/20',   label: 'Social Worker' },
  nutritionist:             { icon: Activity,    color: 'text-orange-600',   bg: 'bg-orange-50 dark:bg-orange-900/20',   label: 'Nutritionist' },
  paramedic:                { icon: Activity,    color: 'text-red-600',      bg: 'bg-red-50 dark:bg-red-900/20',         label: 'Paramedic' },
  patient_care_assistant:   { icon: UserCheck,   color: 'text-orange-600',   bg: 'bg-orange-50 dark:bg-orange-900/20',   label: 'Patient Care Assistant' },
};

const DEFAULT_META = { icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Staff' };

function getRoleMeta(role: string) {
  return ROLE_META[role?.toLowerCase()] ?? { ...DEFAULT_META, label: role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'Staff' };
}

const DOCTOR_ROLES = new Set([
  'doctor','surgeon','trauma_surgeon','anesthesiologist','intensivist',
  'emergency_physician','pediatrician','cardiologist','neurologist','radiologist',
  'oncologist','gynecologist','psychiatrist','pathologist','resident_doctor','intern',
]);

const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const statusMeta: Record<StaffStatus, { label: string; color: string; bg: string; dot: string }> = {
  active:   { label: 'Active',   color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500' },
  inactive: { label: 'Inactive', color: 'text-slate-500',                         bg: 'bg-slate-100 dark:bg-slate-800',        dot: 'bg-slate-400'  },
  on_leave: { label: 'On Leave', color: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20',      dot: 'bg-amber-500'  },
};

// ─── Detail field component ───────────────────────────────────────────────────
const Field: React.FC<{ label: string; value?: string | null; icon?: React.ReactNode; mono?: boolean }> = ({ label, value, icon, mono }) => (
  <div>
    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <div className="flex items-center gap-2">
      {icon && <span className="text-slate-400 flex-shrink-0">{icon}</span>}
      <p className={cn('text-sm font-semibold text-slate-800 dark:text-slate-200', mono && 'font-mono', !value && 'text-slate-400 italic')}>
        {value || 'Not provided'}
      </p>
    </div>
  </div>
);

// ─── Section card ─────────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="glass-card rounded-lg p-6">
    <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
      <span className="text-blue-500">{icon}</span>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const StaffProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<(Staff & { account?: { id: string; username: string; role: string; created_at: string } | null }) | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Password reset state
  const [showReset, setShowReset] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Status toggle state
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      (getStaff as (id: string) => Promise<Staff & { account?: { id: string; username: string; role: string; created_at: string } | null }>)(id),
      listDepartments(),
    ])
      .then(([s, d]) => { setStaff(s); setDepartments(d); })
      .catch(() => toast.error('Failed to load staff profile'))
      .finally(() => setLoading(false));
  }, [id]);

  const department = staff?.departmentId ? departments.find(d => d.id === staff.departmentId) : null;
  const roleMeta   = staff ? getRoleMeta(staff.role) : DEFAULT_META;
  const RoleIcon   = roleMeta.icon;
  const status     = staff ? (statusMeta[staff.status] ?? statusMeta.inactive) : statusMeta.inactive;
  const isDoctor   = staff ? DOCTOR_ROLES.has(staff.role.toLowerCase()) : false;
  const initials   = staff ? `${staff.firstName[0]}${staff.lastName[0]}`.toUpperCase() : '';

  const handleResetPassword = async () => {
    if (!staff || !newPass || newPass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setResetting(true);
    try {
      await resetStaffPassword(staff.id, newPass);
      toast.success('Password reset successfully');
      setShowReset(false);
      setNewPass('');
    } catch {
      toast.error('Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!staff) return;
    const newStatus: StaffStatus = staff.status === 'active' ? 'inactive' : 'active';
    setTogglingStatus(true);
    try {
      await updateStaff(staff.id, { status: newStatus });
      setStaff(prev => prev ? { ...prev, status: newStatus } : prev);
      toast.success(`Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500 font-medium">Staff member not found.</p>
        <button onClick={() => navigate('/admin/staff')} className="btn-primary px-5 py-2 text-sm">
          Back to Staff
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link to="/admin/staff" className="hover:text-blue-600 transition-colors font-medium">Staff</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-600 dark:text-slate-300 font-semibold">{staff.firstName} {staff.lastName}</span>
      </div>

      {/* ── Hero card ─────────────────────────────────────────── */}
      <div className="glass-card rounded-lg overflow-hidden">
        {/* Color band */}
        <div className={cn('h-24 w-full bg-gradient-to-r', roleMeta.color === 'text-blue-600' ? 'from-blue-500 to-blue-700'
          : roleMeta.color === 'text-pink-600' ? 'from-pink-500 to-rose-600'
          : roleMeta.color === 'text-purple-600' ? 'from-purple-500 to-violet-700'
          : roleMeta.color === 'text-emerald-600' ? 'from-emerald-500 to-green-700'
          : roleMeta.color === 'text-violet-600' ? 'from-violet-500 to-purple-700'
          : roleMeta.color === 'text-amber-600' ? 'from-amber-500 to-orange-600'
          : roleMeta.color === 'text-cyan-600' ? 'from-cyan-500 to-teal-600'
          : roleMeta.color === 'text-teal-600' ? 'from-teal-500 to-emerald-600'
          : roleMeta.color === 'text-red-600' ? 'from-red-500 to-rose-700'
          : roleMeta.color === 'text-orange-600' ? 'from-orange-500 to-amber-600'
          : 'from-blue-500 to-blue-700')} />

        <div className="px-8 pb-8">
          {/* Avatar overlapping the band */}
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className={cn('w-20 h-20 rounded-lg flex items-center justify-center text-2xl font-semibold text-white  border-4 border-white dark:border-slate-900', roleMeta.bg, roleMeta.color.replace('text-', 'bg-').replace('-600', '-600'))}>
              <div className={cn('w-full h-full rounded-lg flex items-center justify-center text-2xl font-semibold', roleMeta.bg)}>
                <span className={roleMeta.color}>{initials}</span>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 mt-12">
              <button
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                className={cn('px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all disabled:opacity-50',
                  staff.status === 'active'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100'
                    : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100')}
              >
                {staff.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                {togglingStatus ? 'Updating…' : staff.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <Link to="/admin/staff"
                className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Back to Staff
              </Link>
            </div>
          </div>

          {/* Name + identifiers */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {isDoctor ? 'Dr. ' : ''}{staff.firstName} {staff.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg', roleMeta.bg, roleMeta.color)}>
                  <RoleIcon className="w-3.5 h-3.5" /> {roleMeta.label}
                </span>
                <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg', status.bg, status.color)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                  {status.label}
                </span>
                {department && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <Building2 className="w-3.5 h-3.5" /> {department.name}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Staff ID</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white font-mono">{staff.staffNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Contact Information */}
          <Section title="Contact Information" icon={<Mail className="w-4 h-4" />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email Address" value={staff.email} icon={<Mail className="w-3.5 h-3.5" />} />
              <Field label="Phone Number"  value={staff.phone} icon={<Phone className="w-3.5 h-3.5" />} />
              <Field label="Address" value={staff.address} icon={<MapPin className="w-3.5 h-3.5" />} />
              <Field label="Gender"  value={staff.gender ? staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1) : null} icon={<User className="w-3.5 h-3.5" />} />
              <Field label="Date of Birth" value={staff.dateOfBirth} icon={<Calendar className="w-3.5 h-3.5" />} />
            </div>
          </Section>

          {/* Employment Details */}
          <Section title="Employment Details" icon={<BadgeCheck className="w-4 h-4" />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Department"     value={department?.name} icon={<Building2 className="w-3.5 h-3.5" />} />
              <Field label="Specialization" value={staff.specialization} icon={<Stethoscope className="w-3.5 h-3.5" />} />
              <Field label="License Number" value={staff.licenseNumber} icon={<BadgeCheck className="w-3.5 h-3.5" />} mono />
              <Field label="Date Joined"    value={staff.dateJoined} icon={<Calendar className="w-3.5 h-3.5" />} />
              <Field label="Salary"
                value={staff.salary != null ? `$${staff.salary.toLocaleString()}` : null}
                icon={<Activity className="w-3.5 h-3.5" />} />
            </div>
          </Section>

          {/* Schedule */}
          <Section title="Work Schedule" icon={<Clock className="w-4 h-4" />}>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Working Hours</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {staff.workingHours.start} – {staff.workingHours.end}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Working Days</p>
              {staff.workingDays.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => {
                    const active = staff.workingDays.includes(day as never);
                    return (
                      <span key={day}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize',
                          active ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                        {DAY_SHORT[day]}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Not specified</p>
              )}
            </div>
          </Section>

        </div>

        {/* Column 2 (sidebar) */}
        <div className="space-y-6">

          {/* Login Account */}
          <Section title="Login Account" icon={<ShieldCheck className="w-4 h-4" />}>
            {staff.account ? (
              <>
                <Field label="Username" value={staff.account.username} icon={<User className="w-3.5 h-3.5" />} mono />
                <Field label="Account Role" value={staff.account.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} icon={<ShieldCheck className="w-3.5 h-3.5" />} />
                <Field label="Account Created" value={staff.account.created_at?.slice(0, 10)} icon={<Calendar className="w-3.5 h-3.5" />} />

                {/* Reset password */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowReset(v => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-500 transition-colors">
                    <KeyRound className="w-3.5 h-3.5" />
                    {showReset ? 'Cancel' : 'Reset Password'}
                  </button>
                  {showReset && (
                    <div className="mt-3 space-y-2">
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={newPass}
                          onChange={e => setNewPass(e.target.value)}
                          placeholder="New password (min. 6 chars)"
                          className="input-field py-2 text-sm pr-10"
                          autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowPass(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button onClick={handleResetPassword} disabled={resetting}
                        className="w-full btn-primary py-2 flex items-center justify-center gap-1.5 text-xs font-bold disabled:opacity-50">
                        <Save className="w-3.5 h-3.5" />
                        {resetting ? 'Resetting…' : 'Confirm Reset'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No login account</p>
                <p className="text-xs text-slate-400 mt-1">This staff record was created without a user account.</p>
              </div>
            )}
          </Section>

          {/* Quick stats */}
          <div className="glass-card rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Quick Info</h3>
            {[
              { label: 'Staff Number', value: staff.staffNumber, mono: true },
              { label: 'Status',       value: status.label },
              { label: 'Role',         value: roleMeta.label },
              { label: 'Date Joined',  value: staff.dateJoined || '—' },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-xs font-bold text-slate-400">{label}</span>
                <span className={cn('text-xs font-semibold text-slate-700 dark:text-slate-300', mono && 'font-mono')}>{value}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

    </motion.div>
  );
};

export default StaffProfilePage;
