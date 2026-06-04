import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Search, X, Download, User,
  Plus, Edit2, Trash2, LogIn, FileText, Activity,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/lib/api';
import type { AuditLog, Staff, Patient } from '@/types';
import { listStaff, listPatients } from '@/lib/services';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_CFG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  CREATE: { label: 'Create', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', icon: Plus },
  UPDATE: { label: 'Update', bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-600',    icon: Edit2 },
  DELETE: { label: 'Delete', bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-600',     icon: Trash2 },
  LOGIN:  { label: 'Login',  bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-500',   icon: LogIn },
};

function getActionCfg(action: string) {
  return ACTION_CFG[action.toUpperCase()] ?? { label: action, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500', icon: Activity };
}

const RESOURCE_LABELS: Record<string, string> = {
  patient: 'Patient',
  staff: 'Staff',
  appointment: 'Appointment',
  invoice: 'Invoice',
  inventory: 'Inventory',
  prescription: 'Prescription',
  lab_order: 'Lab Order',
  department: 'Department',
  room: 'Room',
};

const DATE_RANGES = [
  { label: 'Today',      value: 'today' },
  { label: 'This Week',  value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time',   value: 'all' },
];

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtDate(d: string) {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function dateGroup(timestamp: string) {
  return new Date(timestamp).toISOString().split('T')[0];
}

function inRange(timestamp: string, range: string): boolean {
  const d = new Date(timestamp);
  const now = new Date();
  if (range === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (range === 'week') {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    return d >= cutoff;
  }
  if (range === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  return true;
}

// ─── Log Entry ────────────────────────────────────────────────────────────────

interface LogEntryProps {
  log: AuditLog;
  actorName: string;
  actorRole: string;
}

const LogEntry: React.FC<LogEntryProps> = ({ log, actorName, actorRole }) => {
  const actionCfg = getActionCfg(log.action);
  const resourceLabel = RESOURCE_LABELS[log.resource] ?? log.resource;

  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      {/* Action icon */}
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5', actionCfg.bg)}>
        <actionCfg.icon className={cn('w-3.5 h-3.5', actionCfg.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase', actionCfg.bg, actionCfg.text)}>
            {actionCfg.label}
          </span>
          <span className="text-xs font-black text-slate-700 dark:text-slate-300">{resourceLabel}</span>
          {log.resourceId && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {log.resourceId.slice(0, 8)}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{log.details}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3 text-slate-300" />
            <span className="text-[10px] font-bold text-slate-400">{actorName}</span>
          </div>
          {actorRole && (
            <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
              {actorRole}
            </span>
          )}
        </div>
      </div>

      {/* Time */}
      <span className="text-[10px] font-bold text-slate-400 shrink-0 mt-1">{fmtTime(log.timestamp)}</span>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  const loadData = useCallback(async () => {
    const [logsData, staffData, patientsData] = await Promise.all([
      api.get<{ logs: AuditLog[] }>('/audit-logs').then(r => r.logs ?? []).catch(() => [] as AuditLog[]),
      listStaff(),
      listPatients(),
    ]);
    setLogs(logsData);
    setStaff(staffData);
    setPatients(patientsData);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getActorName = (userId: string, role: string): string => {
    if (role === 'PATIENT') {
      const p = patients.find(x => x.id === userId);
      return p ? `${p.firstName} ${p.lastName}` : 'Unknown Patient';
    }
    const s = staff.find(x => x.id === userId);
    return s ? `${s.firstName} ${s.lastName}` : 'System';
  };

  const allResources = useMemo(() => {
    const set = new Set(logs.map(l => l.resource));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (!inRange(log.timestamp, dateRange)) return false;
      if (actionFilter !== 'all' && log.action.toUpperCase() !== actionFilter) return false;
      if (resourceFilter !== 'all' && log.resource !== resourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = getActorName(log.userId, log.userRole).toLowerCase();
        if (!log.details.toLowerCase().includes(q) && !name.includes(q) && !log.resource.toLowerCase().includes(q) && !log.action.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [logs, dateRange, actionFilter, resourceFilter, search, staff, patients]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, AuditLog[]>();
    filtered.forEach(log => {
      const key = dateGroup(log.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const handleExport = () => {
    const header = 'Timestamp,Action,Resource,ResourceId,Details,UserId,UserRole';
    const rows = filtered.map(l =>
      [l.timestamp, l.action, l.resource, l.resourceId, `"${l.details}"`, l.userId, l.userRole].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Audit Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''} · {logs.length} total
          </p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-5 py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95 self-start">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['CREATE', 'UPDATE', 'DELETE', 'LOGIN'] as const).map(action => {
          const cfg = getActionCfg(action);
          const count = logs.filter(l => l.action.toUpperCase() === action).length;
          return (
            <div key={action} className="glass-card p-5 rounded-2xl flex items-center gap-4">
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', cfg.bg)}>
                <cfg.icon className={cn('w-5 h-5', cfg.text)} />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 dark:text-white">{count}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Date range tabs */}
        <div className="flex gap-2 flex-wrap">
          {DATE_RANGES.map(r => (
            <button key={r.value} onClick={() => setDateRange(r.value)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                dateRange === r.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-300'
              )}>
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-52 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search user, action or details..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>

          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none cursor-pointer text-slate-600 dark:text-slate-300">
            <option value="all">All Actions</option>
            {Object.keys(ACTION_CFG).map(a => <option key={a} value={a}>{ACTION_CFG[a].label}</option>)}
          </select>

          <select value={resourceFilter} onChange={e => setResourceFilter(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none cursor-pointer text-slate-600 dark:text-slate-300">
            <option value="all">All Resources</option>
            {allResources.map(r => <option key={r} value={r}>{RESOURCE_LABELS[r] ?? r}</option>)}
          </select>

          {(search || actionFilter !== 'all' || resourceFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setActionFilter('all'); setResourceFilter('all'); }}
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-all flex items-center gap-2">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Log timeline */}
      {grouped.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">No audit events found</p>
          <p className="text-slate-400 text-xs mt-1">Try expanding the date range</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, dateLogs]) => (
            <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-black text-slate-600 dark:text-slate-300">{fmtDate(date)}</span>
                </div>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{dateLogs.length} event{dateLogs.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="glass-card rounded-3xl px-5 divide-y divide-slate-100 dark:divide-slate-800">
                {dateLogs.map(log => (
                  <LogEntry
                    key={log.id}
                    log={log}
                    actorName={getActorName(log.userId, log.userRole)}
                    actorRole={log.userRole}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
