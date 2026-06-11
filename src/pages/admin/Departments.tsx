import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Building2, BedDouble, Edit3, Save, X, Plus,
  Stethoscope, TrendingUp, AlertTriangle, Palette,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Department, Staff, Room } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { listDepartments, createDepartment, updateDepartment, listStaff, listRooms } from '@/lib/services';

const PRESET_COLORS = [
  '#3B82F6','#8B5CF6','#EC4899','#10B981','#F59E0B',
  '#EF4444','#06B6D4','#F97316','#6366F1','#14B8A6',
];

// ─── Department Form Modal ─────────────────────────────────────────────────────
const DeptModal: React.FC<{
  mode: 'create' | 'edit';
  initial?: Partial<Department>;
  doctors: Staff[];
  onClose: () => void;
  onSave: (data: Partial<Department>) => Promise<void>;
}> = ({ mode, initial = {}, doctors, onClose, onSave }) => {
  const [form, setForm] = useState({
    name:          initial.name          ?? '',
    description:   initial.description   ?? '',
    headDoctorId:  initial.headDoctorId  ?? '',
    floor:         initial.floor         ?? '',
    totalBeds:     initial.totalBeds     ?? 0,
    availableBeds: initial.availableBeds ?? 0,
    color:         initial.color         ?? PRESET_COLORS[0],
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.availableBeds) > Number(form.totalBeds)) {
      toast.error('Available beds cannot exceed total beds');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, totalBeds: Number(form.totalBeds), availableBeds: Number(form.availableBeds) });
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
        className="relative bg-white dark:bg-slate-900 rounded-lg  w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${form.color}20` }}>
              <Building2 className="w-4 h-4" style={{ color: form.color }} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {mode === 'create' ? 'New Department' : 'Edit Department'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department Name *</label>
            <input type="text" required value={form.name} onChange={e => set('name', e.target.value)}
              className="input-field py-2.5 text-sm" placeholder="e.g. Cardiology" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              className="input-field py-2.5 text-sm resize-none" placeholder="Brief description of this department" />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Department Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={cn('w-7 h-7 rounded-lg transition-all', form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105')}
                  style={{ backgroundColor: c }} />
              ))}
              <label className="w-7 h-7 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-all border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center" title="Custom color">
                <input type="color" value={form.color} onChange={e => set('color', e.target.value)} className="opacity-0 absolute" />
                <Palette className="w-3.5 h-3.5 text-slate-400" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Floor / Location</label>
              <input type="text" value={form.floor} onChange={e => set('floor', e.target.value)}
                className="input-field py-2.5 text-sm" placeholder="e.g. 3rd Floor, Block B" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Head of Department</label>
              <select value={form.headDoctorId} onChange={e => set('headDoctorId', e.target.value)} className="input-field py-2.5 text-sm">
                <option value="">— Unassigned —</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Total Beds</label>
              <input type="number" min={0} value={form.totalBeds}
                onChange={e => set('totalBeds', Number(e.target.value))} className="input-field py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Available Beds</label>
              <input type="number" min={0} max={form.totalBeds} value={form.availableBeds}
                onChange={e => set('availableBeds', Number(e.target.value))} className="input-field py-2.5 text-sm" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-md border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : mode === 'create' ? 'Create Department' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Department Card ───────────────────────────────────────────────────────────
const DeptCard: React.FC<{
  dept: Department;
  allStaff: Staff[];
  allRooms: Room[];
  onEdit: (d: Department) => void;
}> = ({ dept, allStaff, allRooms, onEdit }) => {
  const occupancy = dept.totalBeds > 0 ? ((dept.totalBeds - dept.availableBeds) / dept.totalBeds) * 100 : 0;
  const hod = dept.headDoctorId ? allStaff.find(s => s.id === dept.headDoctorId) ?? null : null;
  const staffCount = allStaff.filter(s => s.departmentId === dept.id).length;
  const rooms = allRooms.filter(r => r.departmentId === dept.id);

  const barColor =
    occupancy >= 90 ? 'bg-red-500' :
    occupancy >= 70 ? 'bg-amber-500' :
    'bg-emerald-500';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card rounded-lg overflow-hidden group transition-all duration-300"
    >
      {/* Color band */}
      <div className="h-2 w-full" style={{ backgroundColor: dept.color }} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: `${dept.color}20` }}>
              <Building2 className="w-5 h-5" style={{ color: dept.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-tight">{dept.name}</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">{dept.floor} Floor</p>
            </div>
          </div>
          <button onClick={() => onEdit(dept)}
            className="p-2 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all opacity-0 group-hover:opacity-100">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-5 leading-relaxed line-clamp-2">
          {dept.description}
        </p>

        {/* Bed occupancy */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5" /> Bed Occupancy
            </span>
            <span className={cn('text-xs font-semibold', occupancy >= 90 ? 'text-red-600' : occupancy >= 70 ? 'text-amber-600' : 'text-emerald-600')}>
              {Math.round(occupancy)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${occupancy}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn('h-full rounded-full', barColor)}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-slate-400 font-medium">{dept.totalBeds - dept.availableBeds} occupied</span>
            <span className="text-[10px] text-slate-400 font-medium">{dept.availableBeds} available / {dept.totalBeds} total</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{staffCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Staff</p>
          </div>
          <div className="text-center border-x border-slate-100 dark:border-slate-800">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{rooms.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rooms</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{dept.availableBeds}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Free Beds</p>
          </div>
        </div>

        {/* HOD */}
        {hod && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Stethoscope className="w-3 h-3 text-blue-600" />
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              HOD: Dr. {hod.firstName} {hod.lastName}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const DOCTOR_ROLES = new Set([
  'doctor','surgeon','trauma_surgeon','anesthesiologist','intensivist',
  'emergency_physician','pediatrician','cardiologist','neurologist','radiologist',
  'oncologist','gynecologist','psychiatrist','pathologist','resident_doctor','intern',
]);

// ─── Main Page ─────────────────────────────────────────────────────────────────
const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const refresh = useCallback(async () => {
    const [d, s, r] = await Promise.all([listDepartments(), listStaff(), listRooms()]);
    setDepartments(d);
    setAllStaff(s);
    setAllRooms(r);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const doctors = useMemo(
    () => allStaff.filter(s => DOCTOR_ROLES.has(s.role.toLowerCase()) && s.status === 'active'),
    [allStaff]
  );

  const totalBeds     = departments.reduce((s, d) => s + d.totalBeds, 0);
  const availableBeds = departments.reduce((s, d) => s + d.availableBeds, 0);
  const occupiedBeds  = totalBeds - availableBeds;
  const overloaded    = departments.filter(d => d.totalBeds > 0 && (d.totalBeds - d.availableBeds) / d.totalBeds >= 0.9).length;

  const handleCreate = async (data: Partial<Department>) => {
    await createDepartment(data);
    toast.success(`${data.name} department created`);
    await refresh();
    setModal(null);
  };

  const handleEdit = async (data: Partial<Department>) => {
    if (!editingDept) return;
    await updateDepartment(editingDept.id, data);
    toast.success('Department updated');
    await refresh();
    setModal(null);
    setEditingDept(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Departments</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Monitor and manage all hospital departments</p>
        </div>
        <button onClick={() => setModal('create')}
          className="btn-primary px-5 py-2.5 flex items-center gap-2 text-sm font-bold flex-shrink-0">
          <Plus className="w-4 h-4" /> New Department
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Departments', value: departments.length, icon: Building2,     color: 'blue'    },
          { label: 'Total Beds',  value: totalBeds,           icon: BedDouble,     color: 'indigo'  },
          { label: 'Occupied',    value: occupiedBeds,        icon: TrendingUp,    color: 'amber'   },
          { label: 'Overloaded',  value: overloaded,          icon: AlertTriangle, color: 'red'     },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5 rounded-lg">
            <div className={cn('w-10 h-10 rounded-md flex items-center justify-center mb-3',
              color === 'blue'   && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
              color === 'indigo' && 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600',
              color === 'amber'  && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
              color === 'red'    && 'bg-red-50 dark:bg-red-900/20 text-red-600',
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Overall capacity bar */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Overall Hospital Capacity</h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">{occupiedBeds} of {totalBeds} beds occupied across all departments</p>
          </div>
          <span className={cn('text-2xl font-semibold', totalBeds > 0 && occupiedBeds / totalBeds >= 0.9 ? 'text-red-600' : occupiedBeds / totalBeds >= 0.7 ? 'text-amber-600' : 'text-emerald-600')}>
            {totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}%
          </span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn('h-full rounded-full', totalBeds > 0 && occupiedBeds / totalBeds >= 0.9 ? 'bg-red-500' : occupiedBeds / totalBeds >= 0.7 ? 'bg-amber-500' : 'bg-emerald-500')}
          />
        </div>
        {/* Per-department mini bars */}
        <div className="mt-6 space-y-3">
          {departments.map(d => {
            const pct = d.totalBeds > 0 ? ((d.totalBeds - d.availableBeds) / d.totalBeds) * 100 : 0;
            return (
              <div key={d.id} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-32 truncate">{d.name}</span>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                </div>
                <span className="text-[10px] font-semibold text-slate-400 w-8 text-right">{Math.round(pct)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Department cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {departments.length === 0 ? (
          <div className="col-span-full glass-card rounded-lg p-16 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">No departments yet</p>
              <p className="text-sm text-slate-400 mt-1">Create your first department to get started</p>
            </div>
            <button onClick={() => setModal('create')} className="btn-primary px-6 py-2.5 flex items-center gap-2 text-sm font-bold">
              <Plus className="w-4 h-4" /> Create Department
            </button>
          </div>
        ) : (
          departments.map(dept => (
            <DeptCard key={dept.id} dept={dept} allStaff={allStaff} allRooms={allRooms}
              onEdit={d => { setEditingDept(d); setModal('edit'); }} />
          ))
        )}
      </div>

      <AnimatePresence>
        {modal === 'create' && (
          <DeptModal mode="create" doctors={doctors} onClose={() => setModal(null)} onSave={handleCreate} />
        )}
        {modal === 'edit' && editingDept && (
          <DeptModal mode="edit" initial={editingDept} doctors={doctors}
            onClose={() => { setModal(null); setEditingDept(null); }} onSave={handleEdit} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DepartmentsPage;
