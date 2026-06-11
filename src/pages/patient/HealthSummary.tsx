import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Droplets, Thermometer, Activity, Weight,
  Wind, TrendingUp, TrendingDown, Minus, AlertTriangle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { listVitals } from '@/lib/services';
import type { VitalRecord } from '@/types';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface RangeConfig {
  label: string;
  unit: string;
  icon: React.ElementType;
  color: string;
  normal: [number, number];
  getValue: (v: VitalRecord) => number | null;
  chartKey: string;
}

const METRICS: RangeConfig[] = [
  {
    label: 'Heart Rate', unit: 'bpm', icon: Heart, color: '#ef4444', normal: [60, 100], chartKey: 'heartRate',
    getValue: v => v.heartRate,
  },
  {
    label: 'Systolic BP', unit: 'mmHg', icon: Droplets, color: '#3b82f6', normal: [90, 120], chartKey: 'systolic',
    getValue: v => v.bloodPressureSystolic,
  },
  {
    label: 'Temperature', unit: '°C', icon: Thermometer, color: '#f59e0b', normal: [36.1, 37.2], chartKey: 'temperature',
    getValue: v => v.temperature,
  },
  {
    label: 'O₂ Saturation', unit: '%', icon: Wind, color: '#10b981', normal: [95, 100], chartKey: 'oxygenSaturation',
    getValue: v => v.oxygenSaturation,
  },
  {
    label: 'Weight', unit: 'kg', icon: Weight, color: '#8b5cf6', normal: [0, Infinity], chartKey: 'weight',
    getValue: v => v.weight,
  },
];

function trendIcon(values: number[]) {
  if (values.length < 2) return Minus;
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  if (last > prev + 0.5) return TrendingUp;
  if (last < prev - 0.5) return TrendingDown;
  return Minus;
}

function isAbnormal(value: number, normal: [number, number]) {
  return value < normal[0] || value > normal[1];
}

const HealthSummary: React.FC = () => {
  const { user } = useAuth();
  const [vitals, setVitals] = useState<VitalRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    listVitals({ patient_id: user.id })
      .then(vs => setVitals([...vs].reverse())) // oldest first for charts
      .catch(() => {});
  }, [user]);

  const chartData = useMemo(() =>
    vitals.map(v => ({
      date:             fmtDate(v.recordedAt),
      heartRate:        v.heartRate,
      systolic:         v.bloodPressureSystolic,
      diastolic:        v.bloodPressureDiastolic,
      temperature:      v.temperature,
      oxygenSaturation: v.oxygenSaturation,
      weight:           v.weight,
    })),
    [vitals]);

  const latest = vitals[vitals.length - 1] ?? null;

  const riskFlags = useMemo(() => {
    if (!latest) return [];
    const flags: string[] = [];
    if (latest.heartRate < 60 || latest.heartRate > 100) flags.push(`Heart rate ${latest.heartRate} bpm (abnormal)`);
    if (latest.bloodPressureSystolic > 130) flags.push(`High blood pressure ${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic} mmHg`);
    if (latest.bloodPressureSystolic < 90)  flags.push(`Low blood pressure ${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic} mmHg`);
    if (latest.temperature > 37.5)          flags.push(`Elevated temperature ${latest.temperature}°C`);
    if (latest.oxygenSaturation < 95)       flags.push(`Low O₂ saturation ${latest.oxygenSaturation}%`);
    return flags;
  }, [latest]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Health Summary</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {vitals.length > 0
            ? `${vitals.length} readings · latest ${fmtDate(vitals[vitals.length - 1].recordedAt)}`
            : 'No vitals recorded yet'}
        </p>
      </motion.div>

      {vitals.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card p-16 rounded-lg text-center">
          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">No vital records yet</p>
          <p className="text-slate-400 text-sm mt-1">Ask your doctor to record vitals during your next visit.</p>
        </motion.div>
      ) : (
        <>
          {/* Risk flags */}
          {riskFlags.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="font-semibold text-red-700 dark:text-red-400">Risk Indicators</h3>
              </div>
              <ul className="space-y-1.5">
                {riskFlags.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-500 font-bold mt-3">Please consult your doctor about these readings.</p>
            </motion.div>
          )}

          {/* Latest vitals cards */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {latest && METRICS.filter(m => m.getValue(latest) !== null).map((m, i) => {
              const val    = m.getValue(latest)!;
              const abnorm = m.normal[1] !== Infinity && isAbnormal(val, m.normal);
              const values = vitals.map(v => m.getValue(v)).filter((v): v is number => v !== null);
              const Trend  = trendIcon(values);
              return (
                <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  className={cn('glass-card p-5 rounded-md', abnorm && 'ring-2 ring-red-400/30')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${m.color}20` }}>
                      <m.icon className="w-5 h-5" style={{ color: m.color }} />
                    </div>
                    <div className={cn('flex items-center gap-1', abnorm ? 'text-red-500' : 'text-slate-400')}>
                      <Trend className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {val} <span className="text-sm font-bold text-slate-400">{m.unit}</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{m.label}</p>
                  {abnorm && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase bg-red-50 dark:bg-red-900/20 text-red-600">
                      Out of range
                    </span>
                  )}
                  {!abnorm && m.normal[1] !== Infinity && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                      Normal
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Charts */}
          {chartData.length > 1 && (
            <div className="space-y-6">
              {[
                { title: 'Heart Rate',             key: 'heartRate',        color: '#ef4444', refLow: 60,   refHigh: 100,  unit: 'bpm' },
                { title: 'Blood Pressure (Systolic)',key: 'systolic',        color: '#3b82f6', refLow: 90,   refHigh: 130,  unit: 'mmHg' },
                { title: 'Temperature',             key: 'temperature',      color: '#f59e0b', refLow: 36.1, refHigh: 37.5, unit: '°C' },
                { title: 'O₂ Saturation',           key: 'oxygenSaturation', color: '#10b981', refLow: 95,   refHigh: 100,  unit: '%' },
              ].map((c, i) => (
                <motion.div key={c.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="glass-card p-6 rounded-lg">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{c.title}</h3>
                  <p className="text-xs text-slate-400 font-bold mb-5">
                    Normal: {c.refLow}–{c.refHigh} {c.unit}
                  </p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip
                          formatter={(v: number) => [`${v} ${c.unit}`, c.title]}
                          contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, border: 'none', fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <ReferenceLine y={c.refLow}  stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} />
                        <ReferenceLine y={c.refHigh} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />
                        <Line type="monotone" dataKey={c.key} stroke={c.color} strokeWidth={2.5}
                          dot={{ r: 4, fill: c.color, strokeWidth: 0 }}
                          activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HealthSummary;
