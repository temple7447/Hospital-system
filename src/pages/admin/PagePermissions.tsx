import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, ToggleLeft, ToggleRight, AlertCircle, ShieldOff, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { usePermissions } from '@/context/PermissionsContext';
import { PAGE_REGISTRY, hasPagePermission } from '@/lib/pageRegistry';
import type { PagePermissions } from '@/lib/pageRegistry';
import { toast } from 'sonner';

const ROLE_GROUPS: { role: string; label: string; color: string }[] = [
  { role: 'DOCTOR',        label: 'Doctor',          color: 'blue'   },
  { role: 'NURSE',         label: 'Nurse',           color: 'emerald'},
  { role: 'RECEPTIONIST',  label: 'Receptionist',    color: 'purple' },
  { role: 'PHARMACIST',    label: 'Pharmacist',      color: 'amber'  },
  { role: 'LAB_TECHNICIAN',label: 'Lab Technician',  color: 'cyan'   },
  { role: 'RADIOLOGIST',   label: 'Radiologist',     color: 'rose'   },
];

const COLOR_CLASSES: Record<string, { active: string; badge: string }> = {
  blue:    { active: 'bg-blue-600 text-white border-blue-600',       badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
  emerald: { active: 'bg-emerald-600 text-white border-emerald-600', badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' },
  purple:  { active: 'bg-purple-600 text-white border-purple-600',   badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
  amber:   { active: 'bg-amber-500 text-white border-amber-500',     badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
  cyan:    { active: 'bg-cyan-600 text-white border-cyan-600',       badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600' },
  rose:    { active: 'bg-rose-600 text-white border-rose-600',       badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' },
};

const PagePermissionsPage: React.FC = () => {
  const { permissions, updatePermissions } = usePermissions();
  const [local, setLocal] = useState<PagePermissions>({});
  const [saving, setSaving] = useState(false);
  const [activeRole, setActiveRole] = useState('DOCTOR');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const init: PagePermissions = {};
    for (const { role } of ROLE_GROUPS) {
      init[role] = {};
      PAGE_REGISTRY.filter(p => p.roles.includes(role)).forEach(page => {
        init[role][page.key] = hasPagePermission(permissions, role, page.key);
      });
    }
    setLocal(init);
    setDirty(false);
  }, [permissions]);

  const toggle = (role: string, pageKey: string) => {
    setLocal(prev => ({
      ...prev,
      [role]: { ...prev[role], [pageKey]: !prev[role]?.[pageKey] },
    }));
    setDirty(true);
  };

  const setAll = (role: string, value: boolean) => {
    const updated = { ...local };
    updated[role] = {};
    PAGE_REGISTRY.filter(p => p.roles.includes(role)).forEach(p => { updated[role][p.key] = value; });
    setLocal(updated);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePermissions(local);
      toast.success('Page permissions saved successfully');
      setDirty(false);
    } catch {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const activePages = PAGE_REGISTRY.filter(p => p.roles.includes(activeRole));
  const activePerms = local[activeRole] || {};
  const enabledCount = activePages.filter(p => activePerms[p.key] !== false).length;
  const activeGroup = ROLE_GROUPS.find(r => r.role === activeRole)!;
  const colors = COLOR_CLASSES[activeGroup.color];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Page Access Control</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Control which pages each role can access. Admins always have full access.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving || !dirty}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 disabled:opacity-50 transition-all self-start whitespace-nowrap">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : dirty ? 'Save Changes' : 'All Saved'}
        </button>
      </motion.div>

      {/* Role tabs */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-2">
        {ROLE_GROUPS.map(({ role, label, color }) => {
          const pages = PAGE_REGISTRY.filter(p => p.roles.includes(role));
          const enabled = pages.filter(p => (local[role]?.[p.key] ?? true)).length;
          const isActive = activeRole === role;
          const cls = COLOR_CLASSES[color];
          return (
            <button key={role} onClick={() => setActiveRole(role)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all border',
                isActive ? cls.active : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
              )}>
              {label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded font-bold',
                isActive ? 'bg-white/20 text-white' : cls.badge,
              )}>
                {enabled}/{pages.length}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Pages list */}
      <motion.div key={activeRole} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{activeGroup.label} Pages</h3>
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              {enabledCount} of {activePages.length} pages enabled
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAll(activeRole, true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Enable all
            </button>
            <span className="text-slate-200 dark:text-slate-700">|</span>
            <button onClick={() => setAll(activeRole, false)}
              className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors">
              Disable all
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activePages.map(page => {
            const enabled = activePerms[page.key] !== false;
            return (
              <div key={page.key}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    'w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-colors',
                    enabled ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-800',
                  )}>
                    {enabled
                      ? <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      : <ShieldOff className="w-4 h-4 text-slate-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-sm font-semibold', enabled ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600')}>
                      {page.label}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{page.description}</p>
                    <p className="text-[10px] font-mono text-slate-300 dark:text-slate-700 mt-0.5">{page.path}</p>
                  </div>
                </div>
                <button onClick={() => toggle(activeRole, page.key)}
                  className={cn('shrink-0 ml-4 transition-colors', enabled ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 dark:text-slate-600 hover:text-slate-400')}>
                  {enabled
                    ? <ToggleRight className="w-9 h-9" />
                    : <ToggleLeft className="w-9 h-9" />
                  }
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Unsaved changes notice */}
      {dirty && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300 text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          You have unsaved changes. Click Save Changes to apply them.
        </motion.div>
      )}

      {/* Info box */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">How this works</p>
        <p>Disabled pages are hidden from the sidebar and blocked at the route level. Users who navigate to a blocked page are redirected to the Unauthorized page.</p>
        <p>Admin accounts are never restricted — this only applies to the role selected above.</p>
        <p>Changes take effect immediately after saving. Active sessions will be restricted on their next navigation.</p>
      </div>
    </div>
  );
};

export default PagePermissionsPage;
