import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  User, Mail, Phone, MapPin, Calendar, Shield, Building2,
  Stethoscope, Edit3, Save, X, BadgeCheck, Clock, Heart,
  AlertTriangle, FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getPatient, updatePatient, getStaff, updateStaff, listDepartments, listStaff } from '@/lib/services';
import { cn } from '@/utils/cn';
import type { Staff, Patient, Department } from '@/types';

type ProfileMode = 'view' | 'edit';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] as const;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="glass-card rounded-3xl overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-semibold text-slate-900 dark:text-white">{value || <span className="text-slate-400 italic font-normal">Not set</span>}</p>
  </div>
);

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, type = 'text', placeholder, disabled }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="input-field py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
    />
  </div>
);

// ─── Staff Profile ─────────────────────────────────────────────────────────────
const StaffProfile: React.FC<{ staff: Staff; deptName?: string; mode: ProfileMode; onSave: (data: Partial<Staff>) => void }> = ({ staff, deptName, mode, onSave }) => {
  const [form, setForm] = useState({
    firstName: staff.firstName,
    lastName: staff.lastName,
    phone: staff.phone,
    address: staff.address ?? '',
  });
  const dept = deptName ? { name: deptName } : null;

  const handleSave = () => onSave(form);

  if (mode === 'edit') {
    return (
      <div className="space-y-6">
        <Section title="Personal Information" icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="First Name" value={form.firstName} onChange={v => setForm(p => ({ ...p, firstName: v }))} />
            <InputField label="Last Name"  value={form.lastName}  onChange={v => setForm(p => ({ ...p, lastName: v }))} />
            <InputField label="Phone"  value={form.phone}   onChange={v => setForm(p => ({ ...p, phone: v }))}   type="tel" />
            <InputField label="Address" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} />
            <InputField label="Email (read-only)" value={staff.email} onChange={() => {}} disabled />
          </div>
        </Section>
        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary px-6 py-2.5 flex items-center gap-2 text-sm font-bold">
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section title="Personal Information" icon={User}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Full Name"   value={`${staff.firstName} ${staff.lastName}`} />
          <Field label="Email"       value={staff.email} />
          <Field label="Phone"       value={staff.phone} />
          <Field label="Address"     value={staff.address} />
          <Field label="Date Joined" value={new Date(staff.dateJoined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
          <Field label="Status"      value={
            <span className={cn('text-xs font-black px-2.5 py-1 rounded-full uppercase', staff.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : staff.status === 'on_leave' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20')}>
              {staff.status.replace('_', ' ')}
            </span>
          } />
        </div>
      </Section>

      {staff.role === 'DOCTOR' && (
        <Section title="Professional Details" icon={Stethoscope}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Staff ID"       value={staff.staffNumber} />
            <Field label="Department"     value={dept?.name} />
            <Field label="Specialization" value={staff.specialization} />
            <Field label="License No."    value={staff.licenseNumber} />
          </div>
        </Section>
      )}

      {staff.role !== 'DOCTOR' && (
        <Section title="Employment Details" icon={Building2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Staff ID"   value={staff.staffNumber} />
            <Field label="Role"       value={staff.role.charAt(0) + staff.role.slice(1).toLowerCase()} />
            {dept && <Field label="Department" value={dept.name} />}
          </div>
        </Section>
      )}

      <Section title="Working Schedule" icon={Clock}>
        <div className="space-y-3">
          <Field label="Hours" value={`${staff.workingHours.start} – ${staff.workingHours.end}`} />
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Working Days</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <span key={day} className={cn('px-3 py-1 rounded-xl text-xs font-bold capitalize', staff.workingDays.includes(day) ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                  {day.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

// ─── Patient Profile ───────────────────────────────────────────────────────────
const PatientProfile: React.FC<{ patient: Patient; assignedDoctorName?: string; mode: ProfileMode; onSave: (data: Partial<Patient>) => void }> = ({ patient, assignedDoctorName, mode, onSave }) => {
  const [form, setForm] = useState({
    firstName: patient.firstName,
    lastName: patient.lastName,
    phone: patient.phone,
    address: patient.address,
    city: patient.city,
    emergencyContactName: patient.emergencyContactName,
    emergencyContactPhone: patient.emergencyContactPhone,
  });
  const assignedDoctor = assignedDoctorName ? { firstName: assignedDoctorName, lastName: '' } : null;
  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  const handleSave = () => onSave(form);

  if (mode === 'edit') {
    return (
      <div className="space-y-6">
        <Section title="Personal Information" icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="First Name" value={form.firstName} onChange={v => setForm(p => ({ ...p, firstName: v }))} />
            <InputField label="Last Name"  value={form.lastName}  onChange={v => setForm(p => ({ ...p, lastName: v }))} />
            <InputField label="Phone"  value={form.phone}  onChange={v => setForm(p => ({ ...p, phone: v }))} type="tel" />
            <InputField label="City"   value={form.city}   onChange={v => setForm(p => ({ ...p, city: v }))} />
            <div className="sm:col-span-2">
              <InputField label="Address" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} />
            </div>
            <InputField label="Email (read-only)" value={patient.email} onChange={() => {}} disabled />
          </div>
        </Section>
        <Section title="Emergency Contact" icon={AlertTriangle}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Contact Name"  value={form.emergencyContactName}  onChange={v => setForm(p => ({ ...p, emergencyContactName: v }))} />
            <InputField label="Contact Phone" value={form.emergencyContactPhone} onChange={v => setForm(p => ({ ...p, emergencyContactPhone: v }))} type="tel" />
          </div>
        </Section>
        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary px-6 py-2.5 flex items-center gap-2 text-sm font-bold">
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section title="Personal Information" icon={User}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Full Name"      value={`${patient.firstName} ${patient.lastName}`} />
          <Field label="Patient ID"     value={patient.patientNumber} />
          <Field label="Email"          value={patient.email} />
          <Field label="Phone"          value={patient.phone} />
          <Field label="Date of Birth"  value={patient.dateOfBirth ? `${new Date(patient.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} (${age} yrs)` : undefined} />
          <Field label="Gender"         value={patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)} />
          <Field label="Address"        value={`${patient.address}, ${patient.city}`} />
          <Field label="Registered"     value={new Date(patient.registeredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
        </div>
      </Section>

      <Section title="Medical Information" icon={Heart}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Blood Type" value={
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-black">
              {patient.bloodType}
            </span>
          } />
          <Field label="Assigned Doctor" value={assignedDoctorName ?? 'Not assigned'} />
          <Field label="Insurance" value={patient.insuranceProvider ? `${patient.insuranceProvider} (${patient.insuranceNumber})` : 'None / Self-pay'} />
          <Field label="Status" value={
            <span className={cn('text-xs font-black px-2.5 py-1 rounded-full uppercase', patient.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 text-slate-500')}>
              {patient.status}
            </span>
          } />
        </div>

        {patient.chronicConditions.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Chronic Conditions</p>
            <div className="flex flex-wrap gap-2">
              {patient.chronicConditions.map(c => (
                <span key={c} className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold">{c}</span>
              ))}
            </div>
          </div>
        )}

        {patient.allergies.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Allergies</p>
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map(a => (
                <span key={a} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">{a}</span>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Emergency Contact" icon={AlertTriangle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Name"  value={patient.emergencyContactName} />
          <Field label="Phone" value={patient.emergencyContactPhone} />
        </div>
      </Section>
    </div>
  );
};

// ─── Main Profile Page ─────────────────────────────────────────────────────────
const Profile: React.FC = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<ProfileMode>('view');
  const [record, setRecord] = useState<Staff | Patient | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const isPatient = user?.role === 'PATIENT';

  useEffect(() => {
    if (!user) return;
    const loadRecord = isPatient
      ? getPatient(user.id)
      : getStaff(user.id);
    Promise.all([loadRecord, listDepartments(), listStaff()])
      .then(([rec, depts, staff]) => {
        setRecord(rec as Staff | Patient);
        setDepartments(depts);
        setAllStaff(staff);
      })
      .catch(() => {});
  }, [user, isPatient]);

  const handleSave = async (data: Partial<Staff | Patient>) => {
    if (!user || !record) return;
    try {
      if (isPatient) {
        await updatePatient(user.id, data as Partial<Patient>);
      } else {
        await updateStaff(user.id, data as Partial<Staff>);
      }
      setRecord(prev => prev ? { ...prev, ...data } : prev);
      setMode('view');
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  if (!record || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const roleColors: Record<string, string> = {
    ADMIN: 'from-violet-500 to-purple-600',
    DOCTOR: 'from-blue-500 to-blue-700',
    RECEPTIONIST: 'from-emerald-500 to-teal-600',
    NURSE: 'from-pink-500 to-rose-600',
    PATIENT: 'from-amber-500 to-orange-600',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">View and manage your personal information</p>
        </div>
        {mode === 'view' ? (
          <button onClick={() => setMode('edit')} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:border-blue-500/40 hover:text-blue-600 transition-all shadow-sm">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <button onClick={() => setMode('view')} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-500 hover:text-red-500 transition-all shadow-sm">
            <X className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>

      {/* Avatar card */}
      <div className="glass-card rounded-3xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${roleColors[user.role] ?? 'from-blue-500 to-blue-700'} flex items-center justify-center text-white text-3xl font-black shadow-xl flex-shrink-0`}>
          {initials}
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{user.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{user.email}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
            <span className={cn('text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider text-white bg-gradient-to-r', roleColors[user.role] ?? 'from-blue-500 to-blue-600')}>
              {user.role}
            </span>
            {!isPatient && (record as Staff).staffNumber && (
              <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl">
                {(record as Staff).staffNumber}
              </span>
            )}
            {isPatient && (record as Patient).patientNumber && (
              <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl">
                {(record as Patient).patientNumber}
              </span>
            )}
          </div>
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Verified Account</span>
        </div>
      </div>

      {/* Role-specific profile */}
      {isPatient
        ? <PatientProfile
            patient={record as Patient}
            assignedDoctorName={(() => {
              const s = allStaff.find(x => x.id === (record as Patient).assignedDoctorId);
              return s ? `Dr. ${s.firstName} ${s.lastName}` : undefined;
            })()}
            mode={mode} onSave={handleSave}
          />
        : <StaffProfile
            staff={record as Staff}
            deptName={departments.find(d => d.id === (record as Staff).departmentId)?.name}
            mode={mode} onSave={handleSave}
          />
      }

      {/* Account security section */}
      <Section title="Account & Security" icon={Shield}>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Email Address</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">Verified</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Password</p>
                <p className="text-xs text-slate-500">Last changed never (demo mode)</p>
              </div>
            </div>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors">
              Change
            </button>
          </div>
        </div>
      </Section>
    </motion.div>
  );
};

export default Profile;
