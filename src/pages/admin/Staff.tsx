import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, Plus, X, Save, Users, Stethoscope,
  UserCheck, UserX, ChevronDown, Edit3, ExternalLink,
  Phone, Mail, Calendar, Eye, EyeOff, KeyRound,
  FlaskConical, Pill, RadioTower, ShieldCheck,
  Syringe, Activity, Heart, Brain, Baby, Microscope, Wind,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Staff, StaffStatus, WeekDay, Department } from '@/types';
import { listStaff, updateStaff, listDepartments, onboardStaff, resetStaffPassword } from '@/lib/services';

// All supported roles grouped by category
const ROLE_GROUPS = [
  {
    group: 'Administration & Management',
    roles: [
      { value: 'admin',                   label: 'Admin' },
      { value: 'chief_medical_officer',   label: 'Chief Medical Officer (CMO)' },
      { value: 'medical_director',        label: 'Medical Director' },
      { value: 'medical_superintendent',  label: 'Medical Superintendent' },
      { value: 'coo',                     label: 'Chief Operating Officer (COO)' },
      { value: 'cfo',                     label: 'Chief Financial Officer (CFO)' },
      { value: 'hr_manager',              label: 'HR Manager' },
      { value: 'quality_manager',         label: 'Quality & Safety Manager' },
      { value: 'legal_compliance_officer',label: 'Legal & Compliance Officer' },
    ],
  },
  {
    group: 'Doctors & Specialists',
    roles: [
      { value: 'doctor',            label: 'General Practitioner (GP)' },
      { value: 'emergency_physician',label: 'Emergency Physician' },
      { value: 'surgeon',           label: 'Surgeon' },
      { value: 'trauma_surgeon',    label: 'Trauma Surgeon' },
      { value: 'anesthesiologist',  label: 'Anesthesiologist' },
      { value: 'intensivist',       label: 'Intensivist (ICU Physician)' },
      { value: 'pediatrician',      label: 'Pediatrician' },
      { value: 'cardiologist',      label: 'Cardiologist' },
      { value: 'neurologist',       label: 'Neurologist' },
      { value: 'oncologist',        label: 'Oncologist' },
      { value: 'gynecologist',      label: 'Gynecologist / Obstetrician' },
      { value: 'psychiatrist',      label: 'Psychiatrist' },
      { value: 'pathologist',       label: 'Pathologist' },
      { value: 'radiologist',       label: 'Radiologist' },
      { value: 'resident_doctor',   label: 'Resident Doctor' },
      { value: 'intern',            label: 'Intern / Medical Student' },
    ],
  },
  {
    group: 'Nursing Staff',
    roles: [
      { value: 'chief_nursing_officer', label: 'Chief Nursing Officer (CNO)' },
      { value: 'nurse_manager',         label: 'Nurse Manager / Head Nurse' },
      { value: 'nurse',                 label: 'Registered Nurse (RN)' },
      { value: 'nurse_practitioner',    label: 'Nurse Practitioner' },
      { value: 'icu_nurse',             label: 'ICU Nurse' },
      { value: 'er_nurse',              label: 'ER Nurse' },
      { value: 'or_nurse',              label: 'OR Nurse' },
      { value: 'midwife',               label: 'Midwife' },
      { value: 'nursing_assistant',     label: 'Nursing Assistant / CNA' },
      { value: 'infection_control_nurse',label: 'Infection Control Nurse' },
    ],
  },
  {
    group: 'Reception & Administrative Support',
    roles: [
      { value: 'receptionist',           label: 'Receptionist' },
      { value: 'admissions_officer',     label: 'Admissions Officer' },
      { value: 'medical_records_clerk',  label: 'Medical Records Clerk' },
      { value: 'billing_specialist',     label: 'Billing & Coding Specialist' },
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
      { value: 'lab_technician',          label: 'Lab Technician / Medical Technologist' },
      { value: 'radiologic_technologist', label: 'Radiologic Technologist (X-ray / CT / MRI)' },
      { value: 'phlebotomist',            label: 'Phlebotomist' },
      { value: 'ecg_technician',          label: 'ECG Technician' },
      { value: 'sonographer',             label: 'Sonographer (Ultrasound)' },
      { value: 'surgical_technologist',   label: 'Surgical Technologist' },
      { value: 'sterilization_technician',label: 'Sterilization Technician (CSSD)' },
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
      { value: 'social_worker',        label: 'Social Worker' },
      { value: 'nutritionist',         label: 'Nutritionist / Dietitian' },
      { value: 'paramedic',            label: 'Paramedic / EMT' },
      { value: 'patient_care_assistant',label: 'Patient Care Assistant (PCA)' },
    ],
  },
] as const;

// Flat list for filter dropdown and roleMeta lookup
const ROLES = ROLE_GROUPS.flatMap(g => g.roles);
type StaffRoleValue = typeof ROLES[number]['value'];

// Icon & color per category (used for display badges)
const ROLE_CATEGORY_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  admin:                    { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20' },
  chief_medical_officer:    { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20' },
  medical_director:         { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20' },
  medical_superintendent:   { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20' },
  coo:                      { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20' },
  cfo:                      { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20' },
  hr_manager:               { icon: Users,       color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20' },
  quality_manager:          { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20' },
  legal_compliance_officer: { icon: ShieldCheck, color: 'text-purple-600',   bg: 'bg-purple-50 dark:bg-purple-900/20' },
  doctor:                   { icon: Stethoscope, color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  surgeon:                  { icon: Activity,    color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  trauma_surgeon:           { icon: Activity,    color: 'text-red-600',      bg: 'bg-red-50 dark:bg-red-900/20' },
  anesthesiologist:         { icon: Syringe,     color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  intensivist:              { icon: Activity,    color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  emergency_physician:      { icon: Activity,    color: 'text-red-600',      bg: 'bg-red-50 dark:bg-red-900/20' },
  pediatrician:             { icon: Baby,        color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  cardiologist:             { icon: Heart,       color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  neurologist:              { icon: Brain,       color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  oncologist:               { icon: Microscope,  color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  gynecologist:             { icon: Stethoscope, color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  psychiatrist:             { icon: Brain,       color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  pathologist:              { icon: Microscope,  color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  radiologist:              { icon: RadioTower,  color: 'text-cyan-600',     bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  resident_doctor:          { icon: Stethoscope, color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  intern:                   { icon: Stethoscope, color: 'text-slate-600',    bg: 'bg-slate-100 dark:bg-slate-800' },
  chief_nursing_officer:    { icon: UserCheck,   color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20' },
  nurse_manager:            { icon: UserCheck,   color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20' },
  nurse:                    { icon: UserCheck,   color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20' },
  nurse_practitioner:       { icon: UserCheck,   color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20' },
  icu_nurse:                { icon: Activity,    color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20' },
  er_nurse:                 { icon: Activity,    color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20' },
  or_nurse:                 { icon: UserCheck,   color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20' },
  midwife:                  { icon: Baby,        color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20' },
  nursing_assistant:        { icon: UserCheck,   color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20' },
  infection_control_nurse:  { icon: ShieldCheck, color: 'text-pink-600',     bg: 'bg-pink-50 dark:bg-pink-900/20' },
  receptionist:             { icon: Users,       color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  admissions_officer:       { icon: Users,       color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  medical_records_clerk:    { icon: Users,       color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  billing_specialist:       { icon: Users,       color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  patient_relations_officer:{ icon: Users,       color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  pharmacist:               { icon: Pill,        color: 'text-violet-600',   bg: 'bg-violet-50 dark:bg-violet-900/20' },
  pharmacy_technician:      { icon: Pill,        color: 'text-violet-600',   bg: 'bg-violet-50 dark:bg-violet-900/20' },
  lab_technician:           { icon: FlaskConical,color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20' },
  radiologic_technologist:  { icon: RadioTower,  color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20' },
  phlebotomist:             { icon: Syringe,     color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ecg_technician:           { icon: Activity,    color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20' },
  sonographer:              { icon: Activity,    color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20' },
  surgical_technologist:    { icon: Activity,    color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20' },
  sterilization_technician: { icon: FlaskConical,color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20' },
  respiratory_therapist:    { icon: Wind,        color: 'text-teal-600',     bg: 'bg-teal-50 dark:bg-teal-900/20' },
  physical_therapist:       { icon: Activity,    color: 'text-teal-600',     bg: 'bg-teal-50 dark:bg-teal-900/20' },
  occupational_therapist:   { icon: Activity,    color: 'text-teal-600',     bg: 'bg-teal-50 dark:bg-teal-900/20' },
  speech_therapist:         { icon: Activity,    color: 'text-teal-600',     bg: 'bg-teal-50 dark:bg-teal-900/20' },
  social_worker:            { icon: Users,       color: 'text-orange-600',   bg: 'bg-orange-50 dark:bg-orange-900/20' },
  nutritionist:             { icon: Activity,    color: 'text-orange-600',   bg: 'bg-orange-50 dark:bg-orange-900/20' },
  paramedic:                { icon: Activity,    color: 'text-red-600',      bg: 'bg-red-50 dark:bg-red-900/20' },
  patient_care_assistant:   { icon: UserCheck,   color: 'text-orange-600',   bg: 'bg-orange-50 dark:bg-orange-900/20' },
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

const DOCTOR_ROLES_SET = new Set([
  'doctor','surgeon','trauma_surgeon','anesthesiologist','intensivist',
  'emergency_physician','pediatrician','cardiologist','neurologist','radiologist',
  'oncologist','gynecologist','psychiatrist','pathologist','resident_doctor','intern',
]);

// ─── Onboard Modal ─────────────────────────────────────────────────────────────
interface OnboardForm {
  username: string; password: string;
  role: string;
  firstName: string; lastName: string; email: string; phone: string;
  departmentId: string; specialization: string; licenseNumber: string;
  dateJoined: string; status: StaffStatus;
  workingDays: WeekDay[]; workingHours: { start: string; end: string };
}

const emptyOnboard = (): OnboardForm => ({
  username: '', password: '',
  role: 'doctor',
  firstName: '', lastName: '', email: '', phone: '',
  departmentId: '', specialization: '', licenseNumber: '',
  dateJoined: new Date().toISOString().slice(0, 10), status: 'active',
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  workingHours: { start: '08:00', end: '17:00' },
});

const OnboardModal: React.FC<{
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ departments, onClose, onSaved }) => {
  const [form, setForm] = useState<OnboardForm>(emptyOnboard());
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof OnboardForm>(k: K, v: OnboardForm[K]) => setForm(p => ({ ...p, [k]: v }));

  const toggleDay = (day: WeekDay) =>
    set('workingDays', form.workingDays.includes(day)
      ? form.workingDays.filter(d => d !== day)
      : [...form.workingDays, day]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.firstName || !form.lastName) {
      toast.error('Username, password, first name and last name are required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const result = await onboardStaff({
        username: form.username,
        password: form.password,
        role: form.role.toLowerCase() as string,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        department_id: form.departmentId || undefined,
        specialization: form.specialization || undefined,
        license_number: form.licenseNumber || undefined,
        working_days: form.workingDays,
        working_hours_start: form.workingHours.start,
        working_hours_end: form.workingHours.end,
        date_joined: form.dateJoined,
        status: form.status,
      });
      toast.success(`${result.full_name} onboarded — Staff ID: ${result.staff_number}`);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to onboard staff';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-900 rounded-lg  w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Onboard New Staff</h2>
            <p className="text-xs text-slate-500 mt-0.5">Creates a login account + staff profile</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Role *</label>
            <select
              required
              value={form.role}
              onChange={e => set('role', e.target.value as StaffRoleValue)}
              className="input-field py-2.5 pr-10 text-sm appearance-none cursor-pointer"
            >
              {ROLE_GROUPS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.roles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Login credentials */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-4 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Login Credentials</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Username *</label>
                <input type="text" required value={form.username} onChange={e => set('username', e.target.value)}
                  className="input-field py-2.5 text-sm" placeholder="e.g. dr.smith" autoComplete="off" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Temporary Password *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required value={form.password}
                    onChange={e => set('password', e.target.value)}
                    className="input-field py-2.5 text-sm pr-10" placeholder="Min. 6 characters" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            {[['First Name', 'firstName'], ['Last Name', 'lastName']].map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label} *</label>
                <input type="text" required value={form[key as keyof OnboardForm] as string}
                  onChange={e => set(key as keyof OnboardForm, e.target.value as never)}
                  className="input-field py-2.5 text-sm" placeholder={label} />
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="input-field py-2.5 text-sm" placeholder="staff@hospital.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                className="input-field py-2.5 text-sm" placeholder="+1-555-0000" />
            </div>
          </div>

          {/* Department + specialization */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
              <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} className="input-field py-2.5 text-sm">
                <option value="">— None —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            {[...DOCTOR_ROLES_SET,'radiologist','lab_technician','radiologic_technologist',
              'nurse','nurse_practitioner','pharmacist','respiratory_therapist',
              'physical_therapist','occupational_therapist','speech_therapist'].includes(form.role) && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Specialization</label>
                <input type="text" value={form.specialization} onChange={e => set('specialization', e.target.value)}
                  className="input-field py-2.5 text-sm" placeholder="e.g. Cardiology" />
              </div>
            )}
          </div>

          {[...DOCTOR_ROLES_SET,'pharmacist','nurse','nurse_practitioner','midwife',
            'radiologist','lab_technician','respiratory_therapist','physical_therapist',
            'occupational_therapist','speech_therapist'].includes(form.role) && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">License Number</label>
              <input type="text" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)}
                className="input-field py-2.5 text-sm" placeholder="LIC-00000" />
            </div>
          )}

          {/* Date + status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date Joined</label>
              <input type="date" value={form.dateJoined} onChange={e => set('dateJoined', e.target.value)} className="input-field py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as StaffStatus)} className="input-field py-2.5 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Working hours */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Working Hours</label>
            <div className="flex items-center gap-3">
              <input type="time" value={form.workingHours.start} onChange={e => set('workingHours', { ...form.workingHours, start: e.target.value })} className="input-field py-2.5 text-sm w-32" />
              <span className="text-slate-400 font-bold">to</span>
              <input type="time" value={form.workingHours.end} onChange={e => set('workingHours', { ...form.workingHours, end: e.target.value })} className="input-field py-2.5 text-sm w-32" />
            </div>
          </div>

          {/* Working days */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Working Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all',
                    form.workingDays.includes(day) ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200')}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-md border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Creating…' : 'Create Account & Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Edit Modal ────────────────────────────────────────────────────────────────
interface EditForm {
  firstName: string; lastName: string; email: string; phone: string;
  departmentId: string; specialization: string; licenseNumber: string;
  dateJoined: string; status: StaffStatus;
  workingDays: WeekDay[]; workingHours: { start: string; end: string };
}

const EditModal: React.FC<{
  staff: Staff;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ staff, departments, onClose, onSaved }) => {
  const [form, setForm] = useState<EditForm>({
    firstName: staff.firstName, lastName: staff.lastName,
    email: staff.email, phone: staff.phone,
    departmentId: staff.departmentId ?? '',
    specialization: staff.specialization ?? '',
    licenseNumber: staff.licenseNumber ?? '',
    dateJoined: staff.dateJoined,
    status: staff.status,
    workingDays: staff.workingDays,
    workingHours: staff.workingHours,
  });
  const [resetPass, setResetPass] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof EditForm>(k: K, v: EditForm[K]) => setForm(p => ({ ...p, [k]: v }));
  const toggleDay = (day: WeekDay) =>
    set('workingDays', form.workingDays.includes(day)
      ? form.workingDays.filter(d => d !== day)
      : [...form.workingDays, day]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStaff(staff.id, {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone,
        departmentId: form.departmentId || undefined,
        specialization: form.specialization || undefined,
        licenseNumber: form.licenseNumber || undefined,
        dateJoined: form.dateJoined, status: form.status,
        workingDays: form.workingDays, workingHours: form.workingHours,
      });
      if (resetPass) {
        await resetStaffPassword(staff.id, resetPass);
        toast.success('Password reset successfully');
      }
      toast.success(`${form.firstName} ${form.lastName} updated`);
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const meta = getRoleMeta(staff.role);
  const metaLabel = getRoleLabel(staff.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-900 rounded-lg  w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Edit Staff Member</h2>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-lg', meta.bg, meta.color)}>{metaLabel}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            {[['First Name', 'firstName'], ['Last Name', 'lastName']].map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label} *</label>
                <input type="text" required value={form[key as keyof EditForm] as string}
                  onChange={e => set(key as keyof EditForm, e.target.value as never)}
                  className="input-field py-2.5 text-sm" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field py-2.5 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
              <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} className="input-field py-2.5 text-sm">
                <option value="">— None —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Specialization</label>
              <input type="text" value={form.specialization} onChange={e => set('specialization', e.target.value)} className="input-field py-2.5 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date Joined</label>
              <input type="date" value={form.dateJoined} onChange={e => set('dateJoined', e.target.value)} className="input-field py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as StaffStatus)} className="input-field py-2.5 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Working Hours</label>
            <div className="flex items-center gap-3">
              <input type="time" value={form.workingHours.start} onChange={e => set('workingHours', { ...form.workingHours, start: e.target.value })} className="input-field py-2.5 text-sm w-32" />
              <span className="text-slate-400 font-bold">to</span>
              <input type="time" value={form.workingHours.end} onChange={e => set('workingHours', { ...form.workingHours, end: e.target.value })} className="input-field py-2.5 text-sm w-32" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Working Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all',
                    form.workingDays.includes(day) ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200')}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Password */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <button type="button" onClick={() => setShowReset(v => !v)}
              className="flex items-center gap-2 text-xs font-semibold text-amber-600 hover:text-amber-500 transition-colors">
              <KeyRound className="w-4 h-4" />
              {showReset ? 'Cancel password reset' : 'Reset login password'}
            </button>
            {showReset && (
              <div className="mt-3 relative">
                <input type={showPass ? 'text' : 'password'} value={resetPass}
                  onChange={e => setResetPass(e.target.value)}
                  className="input-field py-2.5 text-sm pr-10" placeholder="New password (min. 6 chars)" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-md border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Staff Row ─────────────────────────────────────────────────────────────────
const StaffRow: React.FC<{
  member: Staff;
  departments: Department[];
  onEdit: (s: Staff) => void;
  onToggleStatus: (s: Staff) => void;
}> = ({ member, departments, onEdit, onToggleStatus }) => {
  const navigate = useNavigate();
  const dept = member.departmentId ? departments.find(d => d.id === member.departmentId) ?? null : null;
  const roleKey = member.role.toLowerCase();
  const roleDisplay = getRoleMeta(roleKey);
  const roleLabel = getRoleLabel(roleKey);
  const status = statusMeta[member.status];
  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
  const RoleIcon = roleDisplay.icon;
  const isDoctor = DOCTOR_ROLES_SET.has(roleKey);

  return (
    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-md flex items-center justify-center text-xs font-semibold shadow-sm flex-shrink-0', roleDisplay.bg, roleDisplay.color)}>
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
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{dept?.name ?? '—'}</p>
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
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modal, setModal] = useState<'onboard' | 'edit' | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const refresh = useCallback(async () => {
    const [s, d] = await Promise.all([listStaff(), listDepartments()]);
    setStaffList(s);
    setDepartments(d);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const stats = useMemo(() => ({
    total:    staffList.length,
    doctors:  staffList.filter(s => DOCTOR_ROLES_SET.has(s.role.toLowerCase())).length,
    active:   staffList.filter(s => s.status === 'active').length,
    onLeave:  staffList.filter(s => s.status === 'on_leave').length,
  }), [staffList]);

  const filtered = useMemo(() => staffList.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${s.firstName} ${s.lastName} ${s.email} ${s.staffNumber}`.toLowerCase().includes(q);
    const matchRole   = roleFilter === 'all' || s.role.toLowerCase() === roleFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  }), [staffList, search, roleFilter, statusFilter]);

  const openEdit = (s: Staff) => { setEditingStaff(s); setModal('edit'); };

  const handleToggleStatus = async (member: Staff) => {
    const next: StaffStatus = member.status === 'active' ? 'inactive' : 'active';
    await updateStaff(member.id, { status: next });
    toast.success(`${member.firstName} ${member.lastName} marked as ${next}`);
    await refresh();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Staff Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Onboard professionals and manage their accounts</p>
        </div>
        <button onClick={() => setModal('onboard')} className="btn-primary px-5 py-2.5 flex items-center gap-2 text-sm font-bold self-start">
          <Plus className="w-4 h-4" /> Onboard Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff',  value: stats.total,   icon: Users,       color: 'blue'    },
          { label: 'Doctors',      value: stats.doctors,  icon: Stethoscope, color: 'indigo'  },
          { label: 'Active',       value: stats.active,   icon: UserCheck,   color: 'emerald' },
          { label: 'On Leave',     value: stats.onLeave,  icon: Calendar,    color: 'amber'   },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5 rounded-lg">
            <div className={cn('w-10 h-10 rounded-md flex items-center justify-center mb-3',
              color === 'blue' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
              color === 'indigo' && 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600',
              color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
              color === 'amber' && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-lg p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name, email, or staff ID…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 py-2.5 text-sm w-full" />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field py-2.5 pl-3 pr-8 text-sm appearance-none cursor-pointer">
                <option value="all">All Roles</option>
                {ROLE_GROUPS.map(g => (
                  <optgroup key={g.group} label={g.group}>
                    {g.roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-2.5 pl-3 pr-8 text-sm appearance-none cursor-pointer">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-400 mt-3">
          Showing {filtered.length} of {staffList.length} staff members
        </p>
      </div>

      {/* Table */}
      <div className="glass-card rounded-lg overflow-hidden">
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
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400 font-medium">
                    {staffList.length === 0 ? 'No staff yet. Click "Onboard Staff" to get started.' : 'No staff members match your filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map(member => (
                  <StaffRow key={member.id} member={member} departments={departments}
                    onEdit={openEdit} onToggleStatus={handleToggleStatus} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'onboard' && (
          <OnboardModal departments={departments} onClose={() => setModal(null)} onSaved={refresh} />
        )}
        {modal === 'edit' && editingStaff && (
          <EditModal staff={editingStaff} departments={departments}
            onClose={() => { setModal(null); setEditingStaff(null); }} onSaved={refresh} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StaffPage;
