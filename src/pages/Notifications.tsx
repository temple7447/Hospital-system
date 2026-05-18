import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Calendar, FlaskConical, Pill, Receipt,
  Settings, AlertTriangle, CheckCheck, X, Circle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import type { Notification, NotificationType } from '@/types';

const TYPE_CFG: Record<NotificationType, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  appointment:  { icon: Calendar,      bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-600',    label: 'Appointment' },
  lab_result:   { icon: FlaskConical,  bg: 'bg-purple-50 dark:bg-purple-900/20',text: 'text-purple-600',  label: 'Lab Result' },
  prescription: { icon: Pill,          bg: 'bg-emerald-50 dark:bg-emerald-900/20',text:'text-emerald-600', label: 'Prescription' },
  billing:      { icon: Receipt,       bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-600',   label: 'Billing' },
  system:       { icon: Settings,      bg: 'bg-slate-100 dark:bg-slate-800',    text: 'text-slate-500',   label: 'System' },
  alert:        { icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-600',     label: 'Alert' },
};

function fmtRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');

  const load = () => {
    if (user) setNotifications(db.notifications.getByUser(user.id));
  };

  useEffect(() => { load(); }, [user]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (filter === 'unread' && n.read) return false;
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      return true;
    });
  }, [notifications, filter, typeFilter]);

  const markRead = (id: string) => {
    db.notifications.markRead(id);
    load();
  };

  const markAllRead = () => {
    if (user) { db.notifications.markAllRead(user.id); load(); }
  };

  const deleteNotif = (id: string) => {
    db.notifications.delete(id);
    load();
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-xs font-black">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {notifications.length} total · {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </motion.div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3">
        {/* Read/unread toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1">
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                filter === f ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500')}>
              {f === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as NotificationType | 'all')}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none cursor-pointer text-slate-600 dark:text-slate-300">
          <option value="all">All Types</option>
          {(Object.keys(TYPE_CFG) as NotificationType[]).map(t => (
            <option key={t} value={t}>{TYPE_CFG[t].label}</option>
          ))}
        </select>

        {typeFilter !== 'all' && (
          <button onClick={() => setTypeFilter('all')}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-all flex items-center gap-2">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <AnimatePresence>
            {filtered.map((n, i) => {
              const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.system;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    'glass-card rounded-2xl p-4 flex items-start gap-4 transition-all',
                    !n.read && 'ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-900/10'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                    <cfg.icon className={cn('w-5 h-5', cfg.text)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-black leading-snug', n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white')}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.read && (
                          <button onClick={() => markRead(n.id)} title="Mark read"
                            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-all">
                            <Circle className="w-3 h-3 fill-current" />
                          </button>
                        )}
                        <button onClick={() => deleteNotif(n.id)} title="Dismiss"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase', cfg.bg, cfg.text)}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{fmtRelative(n.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default Notifications;
