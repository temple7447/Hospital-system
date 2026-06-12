import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ShieldCheck, Plus, Power, Trash2, X, Search,
  Loader2, Lock, Pencil, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { listRoles, createRole, updateRole, deleteRole, type Role } from '@/lib/services';

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'ADMIN',          label: 'Administration',   color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  { value: 'DOCTOR',         label: 'Doctors',          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'NURSE',          label: 'Nursing',          color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  { value: 'RECEPTIONIST',   label: 'Reception',        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'PHARMACIST',     label: 'Pharmacy',         color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 'LAB_TECHNICIAN', label: 'Lab & Diagnostics',color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
  { value: 'RADIOLOGIST',    label: 'Radiology',        color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { value: 'PATIENT',        label: 'Patient Portal',   color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
];

const catInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) ?? { label: cat, color: 'bg-slate-100 text-slate-700' };

// ─── Add / Edit Role Modal ────────────────────────────────────────────────────

const RoleModal: React.FC<{
  mode: 'add' | 'edit';
  initial?: Role;
  onClose: () => void;
  onSaved: () => void;
}> = ({ mode, initial, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name:        initial?.name        ?? '',
    label:       initial?.label       ?? '',
    category:    initial?.category    ?? 'DOCTOR',
    description: initial?.description ?? '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.label.trim()) {
      toast.error('Name and label are required');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'add') {
        await createRole({ name: form.name.trim(), label: form.label.trim(), category: form.category, description: form.description.trim() || undefined });
        toast.success(`Role "${form.label}" created`);
      } else if (initial) {
        await updateRole(initial.id, { label: form.label.trim(), description: form.description.trim() || undefined });
        toast.success('Role updated');
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[13px] outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200';
  const labelCls = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {mode === 'add' ? 'Add New Role' : 'Edit Role'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'add' && (
            <div>
              <label className={labelCls}>Role Name (machine name)</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. senior_doctor" className={inputCls} />
              <p className="text-[11px] text-slate-400 mt-1">Lowercase letters, numbers, underscores only</p>
            </div>
          )}

          <div>
            <label className={labelCls}>Display Label</label>
            <input value={form.label} onChange={e => set('label', e.target.value)}
              placeholder="e.g. Senior Doctor" className={inputCls} />
          </div>

          {mode === 'add' && (
            <div>
              <label className={labelCls}>Dashboard Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Determines which dashboard staff with this role see</p>
            </div>
          )}

          <div>
            <label className={labelCls}>Description <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} placeholder="Brief description of this role..."
              className={cn(inputCls, 'resize-none')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-md text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-md text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : (mode === 'add' ? 'Create Role' : 'Save Changes')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Role Row ─────────────────────────────────────────────────────────────────

const RoleRow: React.FC<{
  role: Role;
  onToggle: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  toggling: boolean;
}> = ({ role, onToggle, onEdit, onDelete, toggling }) => {
  const cat = catInfo(role.category);
  const active = role.is_active === 1;

  return (
    <motion.div layout
      className={cn(
        'flex items-center gap-4 px-4 py-3 rounded-lg border transition-all',
        active
          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 opacity-60'
      )}>
      {/* Toggle */}
      <button onClick={() => onToggle(role)} disabled={toggling}
        className={cn(
          'w-9 h-5 rounded-full relative transition-colors shrink-0',
          active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
          toggling && 'opacity-50 cursor-not-allowed'
        )}>
        <span className={cn(
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all',
          active ? 'left-[18px]' : 'left-0.5'
        )} />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{role.label}</span>
          <code className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
            {role.name}
          </code>
          {role.is_system === 1 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
              <Lock className="w-2.5 h-2.5" /> System
            </span>
          )}
        </div>
        {role.description && (
          <p className="text-[12px] text-slate-400 mt-0.5 truncate">{role.description}</p>
        )}
      </div>

      {/* Category badge */}
      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline-block shrink-0', cat.color)}>
        {cat.label}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(role)}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-colors"
          title="Edit label">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {role.is_system === 0 && (
          <button onClick={() => onDelete(role)}
            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
            title="Delete role">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Roles: React.FC = () => {
  const [roles, setRoles]           = useState<Role[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [toggling, setToggling]     = useState<string>('');
  const [collapsed, setCollapsed]   = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      setRoles(await listRoles());
    } catch {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (role: Role) => {
    setToggling(role.id);
    try {
      await updateRole(role.id, { is_active: role.is_active === 1 ? 0 : 1 });
      setRoles(prev => prev.map(r => r.id === role.id ? { ...r, is_active: r.is_active === 1 ? 0 : 1 } : r));
      toast.success(`"${role.label}" ${role.is_active === 1 ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update role');
    } finally {
      setToggling('');
    }
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete the "${role.label}" role? This cannot be undone.`)) return;
    try {
      await deleteRole(role.id);
      setRoles(prev => prev.filter(r => r.id !== role.id));
      toast.success(`"${role.label}" deleted`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return roles.filter(r => {
      if (filterCat && r.category !== filterCat) return false;
      if (filterActive === 'active' && r.is_active !== 1) return false;
      if (filterActive === 'inactive' && r.is_active !== 0) return false;
      if (q && !r.name.includes(q) && !r.label.toLowerCase().includes(q) && !(r.description?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [roles, search, filterCat, filterActive]);

  const grouped = useMemo(() => {
    const map: Record<string, Role[]> = {};
    for (const r of filtered) {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    }
    return map;
  }, [filtered]);

  const totalActive   = roles.filter(r => r.is_active === 1).length;
  const totalInactive = roles.filter(r => r.is_active === 0).length;
  const totalCustom   = roles.filter(r => r.is_system === 0).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" /> Role Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {totalActive} active · {totalInactive} inactive · {totalCustom} custom
          </p>
        </div>
        <button onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Roles',   value: totalActive,   color: 'text-emerald-600' },
          { label: 'Inactive Roles', value: totalInactive, color: 'text-slate-400' },
          { label: 'Custom Roles',   value: totalCustom,   color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search roles…"
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[12px] font-semibold">
          {(['all', 'active', 'inactive'] as const).map(v => (
            <button key={v} onClick={() => setFilterActive(v)}
              className={cn(
                'px-3 py-2 capitalize transition-colors',
                filterActive === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Role Groups */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No roles match your search</p>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.filter(c => grouped[c.value]?.length).map(cat => {
            const isCollapsed = collapsed[cat.value];
            return (
              <div key={cat.value} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setCollapsed(p => ({ ...p, [cat.value]: !p[cat.value] }))}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full', cat.color)}>
                      {cat.label}
                    </span>
                    <span className="text-[12px] text-slate-400 font-medium">
                      {grouped[cat.value].length} role{grouped[cat.value].length !== 1 ? 's' : ''} ·{' '}
                      {grouped[cat.value].filter(r => r.is_active === 1).length} active
                    </span>
                  </div>
                  {isCollapsed
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronUp className="w-4 h-4 text-slate-400" />}
                </button>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-2">
                        {grouped[cat.value].map(role => (
                          <RoleRow key={role.id} role={role}
                            onToggle={handleToggle}
                            onEdit={r => { setEditTarget(r); setShowModal(true); }}
                            onDelete={handleDelete}
                            toggling={toggling === role.id} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <RoleModal
            mode={editTarget ? 'edit' : 'add'}
            initial={editTarget ?? undefined}
            onClose={() => { setShowModal(false); setEditTarget(null); }}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Roles;
