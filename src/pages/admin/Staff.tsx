import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Search, Plus, X, Save, Users, Stethoscope,
  UserCheck, UserX, ChevronDown, Edit3, ExternalLink,
  Phone, Mail, Calendar, Eye, EyeOff, KeyRound,
  FlaskConical, Pill, RadioTower, ShieldCheck,
  Syringe, Activity, Heart, Brain, Baby, Microscope, Wind,
  ArrowLeft, UserPlus, Loader2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Staff, StaffStatus, WeekDay, Department } from '@/types';
import { listStaff, updateStaff, listDepartments, onboardStaff, resetStaffPassword, listRoles, type Role as ApiRole } from '@/lib/services';
import { ROLE_MAP } from '@/lib/mappers';

const CATEGORY_LABELS: Record<string, string> = {
  ADMIN:          'Administration & Management',
  DOCTOR:         'Doctors & Specialists',
  NURSE:          'Nursing Staff',
  RECEPTIONIST:   'Reception & Admin Support',
  PHARMACIST:     'Pharmacy',
  LAB_TECHNICIAN: 'Laboratory & Diagnostics',
  RADIOLOGIST:    'Radiology',
  PATIENT:        'Patient Portal',
};

const ROLE_GROUPS = [
  {
    group: 'Administration & Management',
    roles: [
      { value: 'admin',                    label: 'Admin' },
      { value: 'chief_medical_officer',    label: 'Chief Medical Officer (CMO)' },
      { value: 'medical_director',         label: 'Medical Director' },
      { value: 'medical_superintendent',   label: 'Medical Superintendent' },
      { value: 'coo',                      label: 'Chief Operating Officer (COO)' },
      { value: 'cfo',                      label: 'Chief Financial Officer (CFO)' },
      { value: 'hr_manager',               label: 'HR Manager' },
      { value: 'quality_manager',          label: 'Quality & Safety Manager' },
      { value: 'legal_compliance_officer', label: 'Legal & Compliance Officer' },
    ],
  },
  {
    group: 'Doctors & Specialists',
    roles: [
      { value: 'doctor',              label: 'General Practitioner (GP)' },
      { value: 'emergency_physician', label: 'Emergency Physician' },
      { value: 'surgeon',             label: 'Surgeon' },
      { value: 'trauma_surgeon',      label: 'Trauma Surgeon' },
      { value: 'anesthesiologist',    label: 'Anesthesiologist' },
      { value: 'intensivist',         label: 'Intensivist (ICU Physician)' },
      { value: 'pediatrician',        label: 'Pediatrician' },
      { value: 'cardiologist',        label: 'Cardiologist' },
      { value: 'neurologist',         label: 'Neurologist' },
      { value: 'oncologist',          label: 'Oncologist' },
      { value: 'gynecologist',        label: 'Gynecologist / Obstetrician' },
      { value: 'psychiatrist',        label: 'Psychiatrist' },
      { value: 'pathologist',         label: 'Pathologist' },
      { value: 'radiologist',         label: 'Radiologist' },
      { value: 'resident_doctor',     label: 'Resident Doctor' },
      { value: 'intern',              label: 'Intern / Medical Student' },
    ],
  },
  {
    group: 'Nursing Staff',
    roles: [
      { value: 'chief_nursing_officer',   label: 'Chief Nursing Officer (CNO)' },
      { value: 'nurse_manager',           label: 'Nurse Manager / Head Nurse' },
      { value: 'nurse',                   label: 'Registered Nurse (RN)' },
      { value: 'nurse_practitioner',      label: 'Nurse Practitioner' },
      { value: 'icu_nurse',               label: 'ICU Nurse' },
      { value: 'er_nurse',                label: 'ER Nurse' },
      { value: 'or_nurse',                label: 'OR Nurse' },
      { value: 'midwife',                 label: 'Midwife' },
      { value: 'nursing_assistant',       label: 'Nursing Assistant / CNA' },
      { value: 'infection_control_nurse', label: 'Infection Control Nurse' },
    ],
  },
  {
    group: 'Reception & Administrative Support',
    roles: [
      { value: 'receptionist',             label: 'Receptionist' },
      { value: 'admissions_officer',       label: 'Admissions Officer' },
      { value: 'medical_records_clerk',    label: 'Medical Records Clerk' },
      { value: 'billing_specialist',       label: 'Billing & Coding Specialist' },
      { value: 'patient_relations_officer',label: 'Patient Relations Officer' },
    ],
  },
  {
    group: 'Pharmacy',
    roles: [
      { value: 'pharmacist',          label: 'Pharmacist' },
      { value: 'pharmacy_technician', label: 'Pharmacy Technician' },
    ],
  },
  {
    group: 'Laboratory & Diagnostics',
    roles: [
      { value: 'lab_technician',           label: 'Lab Technician / Medical Technologist' },
      { value: 'radiologic_technologist',  label: 'Radiologic Technologist (X-ray / CT / MRI)' },
      { value: 'phlebotomist',             label: 'Phlebotomist' },
      { value: 'ecg_technician',           label: 'ECG Technician' },
      { value: 'sonographer',              label: 'Sonographer (Ultrasound)' },
      { value: 'surgical_technologist',    label: 'Surgical Technologist' },
      { value: 'sterilization_technician', label: 'Sterilization Technician (CSSD)' },
    ],
  },
  {
    group: 'Therapy & Rehabilitation',
    roles: [
      { value: 'respiratory_therapist',  label: 'Respiratory Therapist' },
      { value: 'physical_therapist',     label: 'Physical Therapist' },
      { value: 'occupational_therapist', label: 'Occupational Therapist' },
      { value: 'speech_therapist',       label: 'Speech-Language Therapist' },
    ],
  },
  {
    group: 'Support & Ancillary',
    roles: [
      { value: 'social_worker',         label: 'Social Worker' },
      { value: 'nutritionist',          label: 'Nutritionist / Dietitian' },
      { value: 'paramedic',             label: 'Paramedic / EMT' },
      { value: 'patient_care_assistant',label: 'Patient Care Assistant (PCA)' },
    ],
  },
] as const;

const ROLES: Array<{ value: string; label: string }> = ROLE_GROUPS.flatMap(g => [...g.roles]);
type StaffRoleValue = string;

const ROLE_CATEGORY_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  admin:                    { icon: ShieldCheck, color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  chief_medical_officer:    { icon: ShieldCheck, color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  medical_director:         { icon: ShieldCheck, color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  medical_superintendent:   { icon: ShieldCheck, color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  coo:                      { icon: ShieldCheck, color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  cfo:                      { icon: ShieldCheck, color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  hr_manager:               { icon: Users,       color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  quality_manager:          { icon: ShieldCheck, color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  legal_compliance_officer: { icon: ShieldCheck, color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  doctor:                   { icon: Stethoscope, color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  surgeon:                  { icon: Activity,    color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  trauma_surgeon:           { icon: Activity,    color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20' },
  anesthesiologist:         { icon: Syringe,     color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  intensivist:              { icon: Activity,    color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  emergency_physician:      { icon: Activity,    color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20' },
  pediatrician:             { icon: Baby,        color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  cardiologist:             { icon: Heart,       color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  neurologist:              { icon: Brain,       color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  oncologist:               { icon: Microscope,  color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  gynecologist:             { icon: Stethoscope, color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  psychiatrist:             { icon: Brain,       color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  pathologist:              { icon: Microscope,  color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  radiologist:              { icon: RadioTower,  color: 'text-cyan-600',    bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  resident_doctor:          { icon: Stethoscope, color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  intern:                   { icon: Stethoscope, color: 'text-slate-600',   bg: 'bg-slate-100 dark:bg-slate-800' },
  chief_nursing_officer:    { icon: UserCheck,   color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-900/20' },
  nurse_manager:            { icon: UserCheck,   color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-900/20' },
  nurse:                    { icon: UserCheck,   color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-900/20' },
  nurse_practitioner:       { icon: UserCheck,   color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-900/20' },
  icu_nurse:                { icon: Activity,    color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-900/20' },
  er_nurse:                 { icon: Activity,    color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-900/20' },
  or_nurse:                 { icon: UserCheck,   color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-900/20' },
  midwife:                  { icon: Baby,        color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-900/20' },
  nursing_assistant:        { icon: UserCheck,   color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-900/20' },
  infection_control_nurse:  { icon: ShieldCheck, color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-900/20' },
  receptionist:             { icon: Users,       color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  admissions_officer:       { icon: Users,       color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  medical_records_clerk:    { icon: Users,       color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  billing_specialist:       { icon: Users,       color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  patient_relations_officer:{ icon: Users,       color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  pharmacist:               { icon: Pill,        color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/20' },
  pharmacy_technician:      { icon: Pill,        color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/20' },
  lab_technician:           { icon: FlaskConical,color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  radiologic_technologist:  { icon: RadioTower,  color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  phlebotomist:             { icon: Syringe,     color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ecg_technician:           { icon: Activity,    color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  sonographer:              { icon: Activity,    color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  surgical_technologist:    { icon: Activity,    color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  sterilization_technician: { icon: FlaskConical,color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  respiratory_therapist:    { icon: Wind,        color: 'text-teal-600',    bg: 'bg-teal-50 dark:bg-teal-900/20' },
  physical_therapist:       { icon: Activity,    color: 'text-teal-600',    bg: 'bg-teal-50 dark:bg-teal-900/20' },
  occupational_therapist:   { icon: Activity,    color: 'text-teal-600',    bg: 'bg-teal-50 dark:bg-teal-900/20' },
  speech_therapist:         { icon: Activity,    color: 'text-teal-600',    bg: 'bg-teal-50 dark:bg-teal-900/20' },
  social_worker:            { icon: Users,       color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-900/20' },
  nutritionist:             { icon: Activity,    color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-900/20' },
  paramedic:                { icon: Activity,    color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20' },
  patient_care_assistant:   { icon: UserCheck,   color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-900/20' },
};

const DEFAULT_ROLE_META = { icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' };

function getRoleMeta(role: string) {
  return ROLE_CATEGORY_META[role.toLowerCase()] ?? DEFAULT_ROLE_META;
}
function getRoleLabel(role: string): string {
  const found = ROLES.find(r => r.value === role.toLowerCase());
  return found?.label ?? role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const DAYS: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'Active',   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  inactive: { label: 'Inactive', color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-800' },
  on_leave: { label: 'On Leave', color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
};

const isDoctorRole = (role: string) => ROLE_MAP[role.toLowerCase()] === 'DOCTOR';

const SPECIALIZATION_ROLES = new Set([
  'radiologist','lab_technician','radiologic_technologist',
  'nurse','nurse_practitioner','pharmacist','respiratory_therapist',
  'physical_therapist','occupational_therapist','speech_therapist',
]);

const LICENSE_ROLES = new Set([
  'pharmacist','nurse','nurse_practitioner','midwife',
  'radiologist','lab_technician','respiratory_therapist',
  'physical_therapist','occupational_therapist','speech_therapist',
]);

// Shared style vars
const fieldCls    = 'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200';
const labelCls    = 'block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1';
const sectionTitle = 'text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3';

// ─── Staff Row ─────────────────────────────────────────────────────────────────
const StaffRow: React.FC<{
  member: Staff;
  onEdit: (s: Staff) => void;
  onToggleStatus: (s: Staff) => void;
}> = ({ member, onEdit, onToggleStatus }) => {
  const navigate = useNavigate();
  const roleKey = member.role.toLowerCase();
  const roleDisplay = getRoleMeta(roleKey);
  const roleLabel = getRoleLabel(roleKey);
  const status = statusMeta[member.status];
  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
  const RoleIcon = roleDisplay.icon;
  const isDoctor = isDoctorRole(roleKey);

  return (
    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-md flex items-center justify-center text-xs font-semibold shadow-sm shrink-0', roleDisplay.bg, roleDisplay.color)}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {isDoctor ? 'Dr. ' : ''}{member.firstName} {member.lastName}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{member.staffNumber}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1.5 w-fit', roleDisplay.bg, roleDisplay.color)}>
          <RoleIcon className="w-3 h-3" /> {roleLabel}
        </span>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{member.departmentName ?? '—'}</p>
        {member.specialization && <p className="text-xs text-slate-400">{member.specialization}</p>}
      </td>
      <td className="px-5 py-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Mail className="w-3 h-3" />{member.email || '—'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone className="w-3 h-3" />{member.phone || '—'}
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-lg uppercase', status.bg, status.color)}>
          {status.label}
        </span>
      </td>
      <td className="px-5 py-4">
        <p className="text-xs text-slate-500 font-medium">{member.workingHours.start} – {member.workingHours.end}</p>
        <p className="text-xs text-slate-400">{member.workingDays.map(d => d.slice(0, 3)).join(', ')}</p>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => navigate(`/admin/staff/${member.id}`)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors" title="View Profile">
            <ExternalLink className="w-4 h-4" />
          </button>
          <button onClick={() => onEdit(member)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => onToggleStatus(member)}
            className={cn('p-2 rounded-lg transition-colors', member.status === 'active'
              ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500'
              : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600')}
            title={member.status === 'active' ? 'Deactivate' : 'Activate'}>
            {member.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
        </div>
      </td>
    </tr>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const StaffPage: React.FC = () => {
  const [staffList, setStaffList]       = useState<Staff[]>([]);
  const [departments, setDepartments]   = useState<Department[]>([]);
  const [activeRoles, setActiveRoles]   = useState<ApiRole[]>([]);
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [view, setView]                 = useState<'list' | 'onboard' | 'edit'>('list');
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [saving, setSaving]             = useState(false);

  // Onboard form
  const [onboard, setOnboard] = useState({
    username: '', password: '',
    role: '' as string,
    firstName: '', lastName: '', email: '', phone: '',
    departmentId: '', specialization: '', licenseNumber: '',
    dateJoined: new Date().toISOString().slice(0, 10), status: 'active' as StaffStatus,
    workingDays: ['monday','tuesday','wednesday','thursday','friday'] as WeekDay[],
    workingHours: { start: '08:00', end: '17:00' },
  });
  const [showOnboardPass, setShowOnboardPass] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    departmentId: '', specialization: '', licenseNumber: '',
    dateJoined: '', status: 'active' as StaffStatus,
    workingDays: [] as WeekDay[], workingHours: { start: '08:00', end: '17:00' },
  });
  const [resetPass, setResetPass]   = useState('');
  const [showReset, setShowReset]   = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);

  const refresh = useCallback(async () => {
    const [s, d, r] = await Promise.all([listStaff({ limit: 500 }), listDepartments({ onlyActive: true }), listRoles({ is_active: 1 })]);
    setStaffList(s);
    setDepartments(d);
    setActiveRoles(r);
    setOnboard(prev => ({ ...prev, role: prev.role || r[0]?.name || '' }));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const stats = useMemo(() => ({
    total:   staffList.length,
    doctors: staffList.filter(s => isDoctorRole(s.role)).length,
    active:  staffList.filter(s => s.status === 'active').length,
    onLeave: staffList.filter(s => s.status === 'on_leave').length,
  }), [staffList]);

  const filtered = useMemo(() => staffList.filter(s => {
    const q = search.toLowerCase();
    return (
      (!q || `${s.firstName} ${s.lastName} ${s.email} ${s.staffNumber}`.toLowerCase().includes(q)) &&
      (roleFilter === 'all' || s.role.toLowerCase() === roleFilter) &&
      (statusFilter === 'all' || s.status === statusFilter)
    );
  }), [staffList, search, roleFilter, statusFilter]);

  const openEdit = (s: Staff) => {
    setEditingStaff(s);
    setEditForm({
      firstName: s.firstName, lastName: s.lastName,
      email: s.email, phone: s.phone,
      departmentId: s.departmentId ?? '',
      specialization: s.specialization ?? '',
      licenseNumber: s.licenseNumber ?? '',
      dateJoined: s.dateJoined,
      status: s.status,
      workingDays: s.workingDays,
      workingHours: s.workingHours,
    });
    setResetPass('');
    setShowReset(false);
    setView('edit');
  };

  const handleToggleStatus = async (member: Staff) => {
    const next: StaffStatus = member.status === 'active' ? 'inactive' : 'active';
    await updateStaff(member.id, { status: next });
    toast.success(`${member.firstName} ${member.lastName} marked as ${next}`);
    await refresh();
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboard.username || !onboard.password || !onboard.firstName || !onboard.lastName) {
      toast.error('Username, password, first name and last name are required');
      return;
    }
    if (onboard.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const result = await onboardStaff({
        username: onboard.username, password: onboard.password,
        role: onboard.role.toLowerCase(),
        first_name: onboard.firstName, last_name: onboard.lastName,
        email: onboard.email || undefined, phone: onboard.phone || undefined,
        department_id: onboard.departmentId || undefined,
        specialization: onboard.specialization || undefined,
        license_number: onboard.licenseNumber || undefined,
        working_days: onboard.workingDays,
        working_hours_start: onboard.workingHours.start,
        working_hours_end: onboard.workingHours.end,
        date_joined: onboard.dateJoined, status: onboard.status,
      });
      toast.success(`${result.full_name} onboarded — Staff ID: ${result.staff_number}`);
      await refresh();
      setView('list');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to onboard staff');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setSaving(true);
    try {
      await updateStaff(editingStaff.id, {
        firstName: editForm.firstName, lastName: editForm.lastName,
        email: editForm.email, phone: editForm.phone,
        departmentId: editForm.departmentId || undefined,
        specialization: editForm.specialization || undefined,
        licenseNumber: editForm.licenseNumber || undefined,
        dateJoined: editForm.dateJoined, status: editForm.status,
        workingDays: editForm.workingDays, workingHours: editForm.workingHours,
      });
      if (resetPass) {
        await resetStaffPassword(editingStaff.id, resetPass);
        toast.success('Password reset successfully');
      }
      toast.success(`${editForm.firstName} ${editForm.lastName} updated`);
      await refresh();
      setView('list');
      setEditingStaff(null);
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const setO = <K extends keyof typeof onboard>(k: K, v: typeof onboard[K]) =>
    setOnboard(p => ({ ...p, [k]: v }));
  const setE = <K extends keyof typeof editForm>(k: K, v: typeof editForm[K]) =>
    setEditForm(p => ({ ...p, [k]: v }));

  const toggleDay = (day: WeekDay, isEdit = false) => {
    if (isEdit) {
      setE('workingDays', editForm.workingDays.includes(day)
        ? editForm.workingDays.filter(d => d !== day)
        : [...editForm.workingDays, day]);
    } else {
      setO('workingDays', onboard.workingDays.includes(day)
        ? onboard.workingDays.filter(d => d !== day)
        : [...onboard.workingDays, day]);
    }
  };

  // ── Onboard view ─────────────────────────────────────────────────────────────
  if (view === 'onboard') {
    const selectedRoleMeta = getRoleMeta(onboard.role);
    const SelectedRoleIcon = selectedRoleMeta.icon;
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setView('list')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">Onboard New Staff</h1>
            <p className="text-[13px] text-slate-400">Creates a login account + staff profile</p>
          </div>
        </div>

        <form onSubmit={handleOnboardSubmit} className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0">
          {/* Left 2/5: Role + credentials */}
          <div className="lg:col-span-2 space-y-4">
            {/* Role summary card */}
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
              <p className={sectionTitle}>Role</p>
              {activeRoles.length === 0 ? (
                <div className="mb-3 text-[12px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-md px-3 py-2">
                  No active roles — enable roles in <strong>Admin → Roles</strong> first.
                </div>
              ) : (
                <select value={onboard.role}
                  onChange={e => setO('role', e.target.value)}
                  className={fieldCls + ' mb-3'}>
                  {Object.entries(
                    activeRoles.reduce<Record<string, ApiRole[]>>((acc, r) => {
                      (acc[r.category] = acc[r.category] || []).push(r);
                      return acc;
                    }, {})
                  ).map(([cat, roles]) => (
                    <optgroup key={cat} label={CATEGORY_LABELS[cat] ?? cat}>
                      {roles.map(r => <option key={r.name} value={r.name}>{r.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              )}
              <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', selectedRoleMeta.bg)}>
                <SelectedRoleIcon className={cn('w-4 h-4 shrink-0', selectedRoleMeta.color)} />
                <span className={cn('text-[12px] font-semibold', selectedRoleMeta.color)}>
                  {getRoleLabel(onboard.role)}
                </span>
              </div>
            </div>

            {/* Login credentials */}
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
              <p className={sectionTitle}>Login Credentials</p>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Username *</label>
                  <input type="text" required value={onboard.username}
                    onChange={e => setO('username', e.target.value)}
                    placeholder="e.g. dr.smith" className={fieldCls} autoComplete="off" />
                </div>
                <div>
                  <label className={labelCls}>Temporary Password *</label>
                  <div className="relative">
                    <input type={showOnboardPass ? 'text' : 'password'} required
                      value={onboard.password} onChange={e => setO('password', e.target.value)}
                      placeholder="Min. 6 characters" className={fieldCls + ' pr-9'}
                      autoComplete="new-password" />
                    <button type="button" onClick={() => setShowOnboardPass(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showOnboardPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Working schedule */}
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
              <p className={sectionTitle}>Schedule</p>
              <div className="mb-3">
                <label className={labelCls}>Working Hours</label>
                <div className="flex items-center gap-2">
                  <input type="time" value={onboard.workingHours.start}
                    onChange={e => setO('workingHours', { ...onboard.workingHours, start: e.target.value })}
                    className={fieldCls + ' flex-1'} />
                  <span className="text-[11px] text-slate-400 font-medium">to</span>
                  <input type="time" value={onboard.workingHours.end}
                    onChange={e => setO('workingHours', { ...onboard.workingHours, end: e.target.value })}
                    className={fieldCls + ' flex-1'} />
                </div>
              </div>
              <label className={labelCls}>Working Days</label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map(day => (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={cn('px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-all',
                      onboard.workingDays.includes(day)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200')}>
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 3/5: Personal info */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <p className={sectionTitle}>Personal Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>First Name *</label>
                    <input type="text" required value={onboard.firstName}
                      onChange={e => setO('firstName', e.target.value)}
                      placeholder="First name" className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name *</label>
                    <input type="text" required value={onboard.lastName}
                      onChange={e => setO('lastName', e.target.value)}
                      placeholder="Last name" className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={onboard.email}
                      onChange={e => setO('email', e.target.value)}
                      placeholder="staff@hospital.com" className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input type="tel" value={onboard.phone}
                      onChange={e => setO('phone', e.target.value)}
                      placeholder="+1-555-0000" className={fieldCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Department</label>
                    <select value={onboard.departmentId}
                      onChange={e => setO('departmentId', e.target.value)} className={fieldCls}>
                      <option value="">— None —</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  {(isDoctorRole(onboard.role) || SPECIALIZATION_ROLES.has(onboard.role)) && (
                    <div>
                      <label className={labelCls}>Specialization</label>
                      <input type="text" value={onboard.specialization}
                        onChange={e => setO('specialization', e.target.value)}
                        placeholder="e.g. Cardiology" className={fieldCls} />
                    </div>
                  )}
                </div>

                {(isDoctorRole(onboard.role) || LICENSE_ROLES.has(onboard.role)) && (
                  <div>
                    <label className={labelCls}>License Number</label>
                    <input type="text" value={onboard.licenseNumber}
                      onChange={e => setO('licenseNumber', e.target.value)}
                      placeholder="LIC-00000" className={fieldCls} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Date Joined</label>
                    <input type="date" value={onboard.dateJoined}
                      onChange={e => setO('dateJoined', e.target.value)} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select value={onboard.status}
                      onChange={e => setO('status', e.target.value as StaffStatus)} className={fieldCls}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                <button type="button" onClick={() => setView('list')}
                  className="flex-1 py-2.5 rounded border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…</>
                    : <><Save className="w-3.5 h-3.5" /> Create Account & Profile</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ── Edit view ─────────────────────────────────────────────────────────────────
  if (view === 'edit' && editingStaff) {
    const meta = getRoleMeta(editingStaff.role);
    const metaLabel = getRoleLabel(editingStaff.role);
    const MetaIcon = meta.icon;
    const initials = `${editingStaff.firstName[0]}${editingStaff.lastName[0]}`.toUpperCase();

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setView('list'); setEditingStaff(null); }}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0', meta.bg, meta.color)}>
            {initials}
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">
              Edit Staff Member
            </h1>
            <p className="text-[13px] text-slate-400">{editingStaff.firstName} {editingStaff.lastName} · {editingStaff.staffNumber}</p>
          </div>
        </div>

        <form onSubmit={handleEditSubmit} className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0">
          {/* Left 2/5: Staff summary + schedule + password reset */}
          <div className="lg:col-span-2 space-y-4">
            {/* Profile card */}
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
              <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg mb-3', meta.bg)}>
                <MetaIcon className={cn('w-4 h-4 shrink-0', meta.color)} />
                <span className={cn('text-[12px] font-semibold', meta.color)}>{metaLabel}</span>
              </div>
              <div className="space-y-1.5 text-[12px] text-slate-500">
                <p><span className="font-medium text-slate-700 dark:text-slate-300">Staff #:</span> {editingStaff.staffNumber}</p>
                <p><span className="font-medium text-slate-700 dark:text-slate-300">Joined:</span> {editingStaff.dateJoined}</p>
              </div>
            </div>

            {/* Working schedule */}
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
              <p className={sectionTitle}>Schedule</p>
              <div className="mb-3">
                <label className={labelCls}>Working Hours</label>
                <div className="flex items-center gap-2">
                  <input type="time" value={editForm.workingHours.start}
                    onChange={e => setE('workingHours', { ...editForm.workingHours, start: e.target.value })}
                    className={fieldCls + ' flex-1'} />
                  <span className="text-[11px] text-slate-400 font-medium">to</span>
                  <input type="time" value={editForm.workingHours.end}
                    onChange={e => setE('workingHours', { ...editForm.workingHours, end: e.target.value })}
                    className={fieldCls + ' flex-1'} />
                </div>
              </div>
              <label className={labelCls}>Working Days</label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map(day => (
                  <button key={day} type="button" onClick={() => toggleDay(day, true)}
                    className={cn('px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-all',
                      editForm.workingDays.includes(day)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200')}>
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Password reset */}
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
              <button type="button" onClick={() => setShowReset(v => !v)}
                className="flex items-center gap-2 text-[12px] font-semibold text-amber-600 hover:text-amber-500 transition-colors">
                <KeyRound className="w-3.5 h-3.5" />
                {showReset ? 'Cancel password reset' : 'Reset login password'}
              </button>
              {showReset && (
                <div className="mt-3 relative">
                  <input type={showEditPass ? 'text' : 'password'} value={resetPass}
                    onChange={e => setResetPass(e.target.value)}
                    className={fieldCls + ' pr-9'} placeholder="New password (min. 6 chars)"
                    autoComplete="new-password" />
                  <button type="button" onClick={() => setShowEditPass(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showEditPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right 3/5: Editable fields */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <p className={sectionTitle}>Staff Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>First Name *</label>
                    <input type="text" required value={editForm.firstName}
                      onChange={e => setE('firstName', e.target.value)} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name *</label>
                    <input type="text" required value={editForm.lastName}
                      onChange={e => setE('lastName', e.target.value)} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={editForm.email}
                      onChange={e => setE('email', e.target.value)} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input type="tel" value={editForm.phone}
                      onChange={e => setE('phone', e.target.value)} className={fieldCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Department</label>
                    <select value={editForm.departmentId}
                      onChange={e => setE('departmentId', e.target.value)} className={fieldCls}>
                      <option value="">— None —</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      {editingStaff?.departmentId && !departments.find(d => d.id === editingStaff.departmentId) && editingStaff.departmentName && (
                        <option value={editingStaff.departmentId}>{editingStaff.departmentName} (inactive)</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Specialization</label>
                    <input type="text" value={editForm.specialization}
                      onChange={e => setE('specialization', e.target.value)}
                      placeholder="e.g. Cardiology" className={fieldCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>License Number</label>
                  <input type="text" value={editForm.licenseNumber}
                    onChange={e => setE('licenseNumber', e.target.value)}
                    placeholder="LIC-00000" className={fieldCls} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Date Joined</label>
                    <input type="date" value={editForm.dateJoined}
                      onChange={e => setE('dateJoined', e.target.value)} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select value={editForm.status}
                      onChange={e => setE('status', e.target.value as StaffStatus)} className={fieldCls}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_leave">On Leave</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                <button type="button" onClick={() => { setView('list'); setEditingStaff(null); }}
                  className="flex-1 py-2.5 rounded border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">Staff Management</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Onboard professionals and manage their accounts</p>
        </div>
        <button onClick={() => setView('onboard')}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Onboard Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: stats.total,   icon: Users,       color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Doctors',     value: stats.doctors,  icon: Stethoscope, color: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Active',      value: stats.active,   icon: UserCheck,   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'On Leave',    value: stats.onLeave,  icon: Calendar,    color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4 rounded-lg">
            <div className={cn('w-9 h-9 rounded-md flex items-center justify-center mb-2', bg, color)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Search by name, email, or staff ID…" value={search}
              onChange={e => setSearch(e.target.value)}
              className={fieldCls + ' pl-9'} />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                className={fieldCls + ' pr-8 appearance-none cursor-pointer'}>
                <option value="all">All Roles</option>
                {Object.entries(
                  activeRoles.reduce<Record<string, ApiRole[]>>((acc, r) => {
                    (acc[r.category] = acc[r.category] || []).push(r);
                    return acc;
                  }, {})
                ).map(([cat, roles]) => (
                  <optgroup key={cat} label={CATEGORY_LABELS[cat] ?? cat}>
                    {roles.map(r => <option key={r.name} value={r.name}>{r.label}</option>)}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className={fieldCls + ' pr-8 appearance-none cursor-pointer'}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <p className="text-[11px] font-medium text-slate-400 mt-3">
          Showing {filtered.length} of {staffList.length} staff members
        </p>
      </div>

      {/* Table */}
      <div className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                {['Staff Member', 'Role', 'Department', 'Contact', 'Status', 'Schedule', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400 text-[13px] font-medium">
                    {staffList.length === 0 ? 'No staff yet. Click "Onboard Staff" to get started.' : 'No staff members match your filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map(member => (
                  <StaffRow key={member.id} member={member}
                    onEdit={openEdit} onToggleStatus={handleToggleStatus} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffPage;
