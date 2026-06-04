import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, Plus, X, Save, Users, Stethoscope,
  UserCheck, UserX, ChevronDown, Filter, Edit3,
  Phone, Mail, Building2, Calendar, BadgeCheck,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Staff, StaffRole, StaffStatus, WeekDay, Department } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { listStaff, createStaff, updateStaff, listDepartments } from '@/lib/services';

const ROLES: StaffRole[] = ['DOCTOR', 'RECEPTIONIST', 'NURSE', 'ADMIN'];
const DAYS: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const today = () => new Date().toISOString().slice(0, 10);

interface StaffForm {
  firstName: string; lastName: string; email: string; phone: string;
  role: StaffRole; departmentId: string; specialization: string;
  licenseNumber: string; dateJoined: string; status: StaffStatus;
  workingDays: WeekDay[]; workingHours: { start: string; end: string };
}

const emptyForm = (): StaffForm => ({
  firstName: '', lastName: '', email: '', phone: '',
  role: 'DOCTOR', departmentId: '', specialization: '',
  licenseNumber: '', dateJoined: today(), status: 'active',
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  workingHours: { start: '08:00', end: '17:00' },
});

const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN:        { label: 'Admin',        color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  DOCTOR:       { label: 'Doctor',       color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  RECEPTIONIST: { label: 'Receptionist', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  NURSE:        { label: 'Nurse',        color: 'text-pink-600 dark:text-pink-400',     bg: 'bg-pink-50 dark:bg-pink-900/20' },
};

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  inactive:  { label: 'Inactive',  color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-800' },
  on_leave:  { label: 'On Leave',  color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
};

// ─── Modal ─────────────────────────────────────────────────────────────────────
const StaffModal: React.FC<{
  staff: Staff | null;
  departments: Department[];
  onClose: () => void;
  onSave: (form: StaffForm) => void;
}> = ({ staff, departments, onClose, onSave }) => {
  const [form, setForm] = useState<StaffForm>(staff ? {
    firstName: staff.firstName, lastName: staff.lastName, email: staff.email,
    phone: staff.phone, role: staff.role, departmentId: staff.departmentId ?? '',
    specialization: staff.specialization ?? '', licenseNumber: staff.licenseNumber ?? '',
    dateJoined: staff.dateJoined, status: staff.status,
    workingDays: staff.workingDays, workingHours: staff.workingHours,
  } : emptyForm());

  const set = <K extends keyof StaffForm>(k: K, v: StaffForm[K]) => setForm(p => ({ ...p, [k]: v }));

  const toggleDay = (day: WeekDay) =>
    set('workingDays', form.workingDays.includes(day)
      ? form.workingDays.filter(d => d !== day)
      : [...form.workingDays, day]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}
      />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10 rounded-t-3xl">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Role selection */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Role *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLES.map(r => {
                const meta = roleMeta[r];
                return (
                  <button key={r} type="button" onClick={() => set('role', r)}
                    className={cn('py-2.5 rounded-xl text-xs font-black border-2 transition-all', form.role === r ? `${meta.bg} ${meta.color} border-current` : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300')}>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            {[['First Name', 'firstName'], ['Last Name', 'lastName']].map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">{label} *</label>
                <input type="text" required value={form[key as keyof StaffForm] as string}
                  onChange={e => set(key as keyof StaffForm, e.target.value as never)}
                  className="input-field py-2.5 text-sm" placeholder={label} />
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
              <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                className="input-field py-2.5 text-sm" placeholder="staff@careflow.com" disabled={!!staff} />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Phone *</label>
              <input type="tel" required value={form.phone} onChange={e => set('phone', e.target.value)}
                className="input-field py-2.5 text-sm" placeholder="+1-555-0000" />
            </div>
          </div>

          {/* Department + specialization (DOCTOR/NURSE) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
              <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} className="input-field py-2.5 text-sm">
                <option value="">— None —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            {form.role === 'DOCTOR' && (
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Specialization</label>
                <input type="text" value={form.specialization} onChange={e => set('specialization', e.target.value)}
                  className="input-field py-2.5 text-sm" placeholder="e.g. Cardiology" />
              </div>
            )}
          </div>

          {form.role === 'DOCTOR' && (
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">License Number</label>
              <input type="text" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)}
                className="input-field py-2.5 text-sm" placeholder="LIC-00000" />
            </div>
          )}

          {/* Date joined + status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Date Joined</label>
              <input type="date" value={form.dateJoined} onChange={e => set('dateJoined', e.target.value)} className="input-field py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as StaffStatus)} className="input-field py-2.5 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>

          {/* Working hours */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Working Hours</label>
            <div className="flex items-center gap-3">
              <input type="time" value={form.workingHours.start} onChange={e => set('workingHours', { ...form.workingHours, start: e.target.value })} className="input-field py-2.5 text-sm w-32" />
              <span className="text-slate-400 font-bold">to</span>
              <input type="time" value={form.workingHours.end} onChange={e => set('workingHours', { ...form.workingHours, end: e.target.value })} className="input-field py-2.5 text-sm w-32" />
            </div>
          </div>

          {/* Working days */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Working Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all', form.workingDays.includes(day) ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200')}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-all">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 text-sm font-bold">
              <Save className="w-4 h-4" />
              {staff ? 'Save Changes' : 'Add Staff Member'}
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
  const dept = member.departmentId ? departments.find(d => d.id === member.departmentId) ?? null : null;
  const role = roleMeta[member.role];
  const status = statusMeta[member.status];
  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();

  return (
    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0', role.bg, role.color)}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {member.role === 'DOCTOR' ? 'Dr. ' : ''}{member.firstName} {member.lastName}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{member.staffNumber}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className={cn('text-[11px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wide', role.bg, role.color)}>
          {role.label}
        </span>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{dept?.name ?? '—'}</p>
        {member.specialization && <p className="text-xs text-slate-400">{member.specialization}</p>}
      </td>
      <td className="px-5 py-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Mail className="w-3 h-3" />{member.email}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone className="w-3 h-3" />{member.phone}
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className={cn('text-[11px] font-black px-2.5 py-1 rounded-xl uppercase', status.bg, status.color)}>
          {status.label}
        </span>
      </td>
      <td className="px-5 py-4">
        <p className="text-xs text-slate-500 font-medium">{member.workingHours.start} – {member.workingHours.end}</p>
        <p className="text-xs text-slate-400">{member.workingDays.map(d => d.slice(0, 3)).join(', ')}</p>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(member)} className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => onToggleStatus(member)}
            className={cn('p-2 rounded-xl transition-colors', member.status === 'active' ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600')}
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
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const refresh = useCallback(async () => {
    const [s, d] = await Promise.all([listStaff(), listDepartments()]);
    setStaffList(s);
    setDepartments(d);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const stats = useMemo(() => ({
    total:    staffList.length,
    doctors:  staffList.filter(s => s.role === 'DOCTOR').length,
    active:   staffList.filter(s => s.status === 'active').length,
    onLeave:  staffList.filter(s => s.status === 'on_leave').length,
  }), [staffList]);

  const filtered = useMemo(() => staffList.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${s.firstName} ${s.lastName} ${s.email} ${s.staffNumber}`.toLowerCase().includes(q);
    const matchRole   = roleFilter   === 'all' || s.role   === roleFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  }), [staffList, search, roleFilter, statusFilter]);

  const openAdd  = () => { setEditingStaff(null); setIsModalOpen(true); };
  const openEdit = (s: Staff) => { setEditingStaff(s); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingStaff(null); };

  const handleSave = async (form: StaffForm) => {
    if (editingStaff) {
      await updateStaff(editingStaff.id, form);
      toast.success(`${form.firstName} ${form.lastName}'s profile updated`);
    } else {
      await createStaff({ ...form, address: '', gender: 'other' as const, salary: 0, avatar: undefined, dateOfBirth: undefined });
      toast.success(`${form.firstName} ${form.lastName} added to staff`);
    }
    await refresh();
    closeModal();
  };

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
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage all hospital staff members</p>
        </div>
        <button onClick={openAdd} className="btn-primary px-5 py-2.5 flex items-center gap-2 text-sm font-bold self-start">
          <Plus className="w-4 h-4" /> Add Staff Member
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
          <div key={label} className="glass-card p-5 rounded-3xl">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center mb-3',
              color === 'blue' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
              color === 'indigo' && 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600',
              color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
              color === 'amber' && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-3xl p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name, email, or ID…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 py-2.5 text-sm w-full" />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field py-2.5 pl-3 pr-8 text-sm appearance-none cursor-pointer">
                <option value="all">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{roleMeta[r].label}</option>)}
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

        {/* Results count */}
        <p className="text-xs font-bold text-slate-400 mt-3">
          Showing {filtered.length} of {staffList.length} staff members
        </p>
      </div>

      {/* Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                {['Staff Member', 'Role', 'Department', 'Contact', 'Status', 'Schedule', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400 font-medium">
                    No staff members match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map(member => (
                  <StaffRow key={member.id} member={member} departments={departments} onEdit={openEdit} onToggleStatus={handleToggleStatus} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <StaffModal staff={editingStaff} departments={departments} onClose={closeModal} onSave={handleSave} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StaffPage;
