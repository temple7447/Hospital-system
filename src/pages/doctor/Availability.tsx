import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { listStaff, updateStaff } from '@/lib/services';
import { toast } from 'sonner';
import type { WeekDay, Staff } from '@/types';

const DAYS: { key: WeekDay; label: string; short: string }[] = [
  { key: 'monday',    label: 'Monday',    short: 'Mon' },
  { key: 'tuesday',   label: 'Tuesday',   short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday',  label: 'Thursday',  short: 'Thu' },
  { key: 'friday',    label: 'Friday',    short: 'Fri' },
  { key: 'saturday',  label: 'Saturday',  short: 'Sat' },
  { key: 'sunday',    label: 'Sunday',    short: 'Sun' },
];

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? '00' : '30';
  const hh = String(h).padStart(2, '0');
  return `${hh}:${m}`;
});

const Availability: React.FC = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [workingDays, setWorkingDays] = useState<Set<WeekDay>>(new Set());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    listStaff().then(staffList => {
      const s = staffList.find(st => st.userId === user.id || st.id === user.id) ?? null;
      if (s) {
        setStaff(s);
        setWorkingDays(new Set(s.workingDays));
        setStartTime(s.workingHours.start);
        setEndTime(s.workingHours.end);
      }
    });
  }, [user?.id]);

  const toggleDay = (day: WeekDay) => {
    setWorkingDays(prev => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    if (workingDays.size === 0) { toast.error('Select at least one working day'); return; }
    if (startTime >= endTime)   { toast.error('End time must be after start time'); return; }
    setSaving(true);
    try {
      await updateStaff(user.id, {
        workingDays:  Array.from(workingDays) as WeekDay[],
        workingHours: { start: startTime, end: endTime },
      });
      toast.success('Availability saved');
    } catch {
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const startSlot = TIME_SLOTS.indexOf(startTime);
  const endSlot   = TIME_SLOTS.indexOf(endTime);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">My Availability</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Set your working days and hours for scheduling
        </p>
      </motion.div>

      {/* Working Days */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card p-6 rounded-lg space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Working Days</h3>
            <p className="text-xs text-slate-400 font-bold">{workingDays.size} day{workingDays.size !== 1 ? 's' : ''} selected</p>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map(d => {
            const active = workingDays.has(d.key);
            return (
              <button key={d.key} onClick={() => toggleDay(d.key)}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 px-1 rounded-md font-semibold text-xs transition-all',
                  active
                    ? 'bg-blue-600 text-white '
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700',
                )}>
                <span className="text-[10px] uppercase tracking-wider">{d.short}</span>
                {active && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Working Hours */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-6 rounded-lg space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Working Hours</h3>
            <p className="text-xs text-slate-400 font-bold">{startTime} — {endTime}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Start Time</label>
            <select value={startTime} onChange={e => setStartTime(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold outline-none cursor-pointer">
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">End Time</label>
            <select value={endTime} onChange={e => setEndTime(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold outline-none cursor-pointer">
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {/* Visual time bar */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Day Overview</p>
          <div className="relative h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
            {startSlot >= 0 && endSlot > startSlot && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                style={{
                  left: `${(startSlot / TIME_SLOTS.length) * 100}%`,
                  width: `${((endSlot - startSlot) / TIME_SLOTS.length) * 100}%`,
                  originX: 0,
                }}
                className="absolute inset-y-0 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-[10px] font-semibold text-white">{startTime} — {endTime}</span>
              </motion.div>
            )}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>07:00</span><span>12:00</span><span>17:00</span><span>21:00</span>
          </div>
        </div>
      </motion.div>

      {/* Weekly schedule preview */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card p-6 rounded-lg space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">Weekly Schedule Preview</h3>
        <div className="space-y-2">
          {DAYS.map(d => {
            const active = workingDays.has(d.key);
            return (
              <div key={d.key} className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-all',
                active ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-800 opacity-50',
              )}>
                <span className={cn('text-sm font-semibold', active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-400')}>
                  {d.label}
                </span>
                <span className={cn('text-xs font-bold', active ? 'text-blue-600' : 'text-slate-400')}>
                  {active ? `${startTime} — ${endTime}` : 'Off'}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Save */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 bg-blue-600 text-white rounded-md font-semibold uppercase tracking-widest  hover:bg-blue-700 transition-all  disabled:opacity-50 flex items-center justify-center gap-2">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : <><Save className="w-4 h-4" /> Save Availability</>}
        </button>
      </motion.div>
    </div>
  );
};

export default Availability;
