import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ClipboardList, HeartPulse, AlertTriangle, CheckCircle2,
  Clock, Send, ChevronDown, ChevronUp, Activity, Thermometer,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import {
  listPatients, listStaff, listAppointments,
  listNursingTasks, createNursingTask, listVitals,
} from '@/lib/services';
import type { Patient, NursingTask, VitalRecord } from '@/types';

const today = () => new Date().toISOString().split('T')[0];

const ShiftHandover: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients]     = useState<Patient[]>([]);
  const [tasks, setTasks]           = useState<NursingTask[]>([]);
  const [vitals, setVitals]         = useState<VitalRecord[]>([]);
  const [pastHandovers, setPast]    = useState<NursingTask[]>([]);
  const [notes, setNotes]           = useState<Record<string, string>>({});
  const [saving, setSaving]         = useState<Record<string, boolean>>({});
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [allPatients, staffList, apts, allTasks, allVitals] = await Promise.all([
        listPatients(),
        listStaff(),
        listAppointments(),
        listNursingTasks({ nurse_id: user.id }),
        listVitals(),
      ]);

      const nurse = staffList.find(s => s.userId === user.id || s.id === user.id);
      let deptPatients = allPatients;
      if (nurse?.departmentId) {
        const ids = new Set(
          apts.filter(a => a.departmentId === nurse.departmentId).map(a => a.patientId)
        );
        deptPatients = allPatients.filter(p => ids.has(p.id));
      }

      setPatients(deptPatients);
      setTasks(allTasks.filter(t => t.status === 'pending' || t.status === 'in_progress'));
      setVitals(allVitals);
      setPast(
        allTasks.filter(t =>
          t.type === 'other' &&
          t.description.startsWith('HANDOVER:') &&
          t.scheduledAt.startsWith(today())
        )
      );
      setLoading(false);
    })();
  }, [user?.id]);

  const latestVital = (patientId: string) =>
    vitals
      .filter(v => v.patientId === patientId)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? null;

  const pendingTasks = (patientId: string) =>
    tasks.filter(t => t.patientId === patientId);

  const handoverFor = (patientId: string) =>
    pastHandovers.filter(t => t.patientId === patientId);

  const handleSubmit = async (patient: Patient) => {
    const note = notes[patient.id]?.trim();
    if (!note || !user) return;
    setSaving(prev => ({ ...prev, [patient.id]: true }));
    try {
      await createNursingTask({
        patientId:   patient.id,
        nurseId:     user.id,
        type:        'other',
        description: `HANDOVER: ${note}`,
        scheduledAt: new Date().toISOString(),
        status:      'completed',
        completedAt: new Date().toISOString(),
        notes:       note,
      });
      toast.success(`Handover saved for ${patient.firstName} ${patient.lastName}`);
      setNotes(prev => ({ ...prev, [patient.id]: '' }));
      // refresh past handovers
      const updated = await listNursingTasks({ nurse_id: user.id });
      setPast(
        updated.filter(t =>
          t.type === 'other' &&
          t.description.startsWith('HANDOVER:') &&
          t.scheduledAt.startsWith(today())
        )
      );
    } catch {
      toast.error('Failed to save handover');
    } finally {
      setSaving(prev => ({ ...prev, [patient.id]: false }));
    }
  };

  const submitted = useMemo(
    () => new Set(pastHandovers.map(t => t.patientId)),
    [pastHandovers]
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
      Loading ward patients…
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Shift Handover</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Document patient status for the incoming shift — {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Ward Patients"    value={patients.length}              color="blue"    icon={ClipboardList} />
        <Stat label="Pending Tasks"    value={tasks.length}                 color="amber"   icon={Clock} />
        <Stat label="Handovers Done"   value={submitted.size}               color="emerald" icon={CheckCircle2} />
      </div>

      {patients.length === 0 && (
        <div className="glass-card rounded-lg p-16 text-center text-slate-400 font-medium">
          No patients assigned to your department.
        </div>
      )}

      <div className="space-y-3">
        {patients.map(p => {
          const vr      = latestVital(p.id);
          const pending = pendingTasks(p.id);
          const done    = submitted.has(p.id);
          const isOpen  = expanded === p.id;
          const prevHO  = handoverFor(p.id);

          return (
            <div key={p.id} className={cn('glass-card rounded-lg overflow-hidden', done && 'ring-1 ring-emerald-400/50')}>
              {/* Header row */}
              <button
                onClick={() => setExpanded(isOpen ? null : p.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-left"
              >
                <div className={cn('w-11 h-11 rounded-md flex items-center justify-center shrink-0 text-white font-semibold text-sm',
                  p.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500')}>
                  {p.firstName[0]}{p.lastName[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {p.patientNumber} · {p.bloodType}
                    {p.allergies.length > 0 && (
                      <span className="ml-2 text-red-500">⚠ {p.allergies.join(', ')}</span>
                    )}
                  </p>
                </div>

                {/* Quick vitals */}
                {vr && (
                  <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 shrink-0">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {vr.bloodPressureSystolic}/{vr.bloodPressureDiastolic}
                    </span>
                    <span className="flex items-center gap-1">
                      <HeartPulse className="w-3 h-3" />
                      {vr.heartRate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3" />
                      {vr.temperature}°
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  {pending.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20">
                      {pending.length} pending
                    </span>
                  )}
                  {done && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
                      Handed over
                    </span>
                  )}
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Expanded panel */}
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4"
                >
                  {/* Allergies alert */}
                  {p.allergies.length > 0 && (
                    <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">Allergies</p>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">{p.allergies.join(', ')}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pending tasks */}
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Pending Tasks</p>
                      {pending.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No pending tasks</p>
                      ) : (
                        <div className="space-y-1.5">
                          {pending.map(t => (
                            <div key={t.id} className="flex items-center gap-2 text-xs">
                              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300 truncate">{t.description}</span>
                              <span className="ml-auto text-slate-400 shrink-0">
                                {new Date(t.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Last vitals */}
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Last Vitals</p>
                      {vr ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { label: 'BP', value: `${vr.bloodPressureSystolic}/${vr.bloodPressureDiastolic} mmHg` },
                            { label: 'HR', value: `${vr.heartRate} bpm` },
                            { label: 'Temp', value: `${vr.temperature}°F` },
                            { label: 'SpO₂', value: `${vr.oxygenSaturation}%` },
                          ].map(row => (
                            <div key={row.label} className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-center">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{row.label}</p>
                              <p className="text-xs font-semibold text-slate-800 dark:text-white mt-0.5">{row.value}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No vitals recorded today</p>
                      )}
                    </div>
                  </div>

                  {/* Previous handovers today */}
                  {prevHO.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Earlier Handover Notes Today</p>
                      <div className="space-y-2">
                        {prevHO.map(ho => (
                          <div key={ho.id} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <p className="text-xs text-slate-700 dark:text-slate-300">{ho.notes || ho.description.replace('HANDOVER: ', '')}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {ho.completedAt && new Date(ho.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Handover note input */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Handover Note for Incoming Shift</p>
                    <textarea
                      rows={3}
                      value={notes[p.id] ?? ''}
                      onChange={e => setNotes(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="e.g. Patient stable, BP trending high — monitor every 2hrs. IV line on right hand, due for next round of Paracetamol at 14:00…"
                      className="input-field py-2.5 text-sm w-full resize-none"
                    />
                    <button
                      onClick={() => handleSubmit(p)}
                      disabled={saving[p.id] || !(notes[p.id]?.trim())}
                      className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {saving[p.id] ? 'Saving…' : 'Submit Handover Note'}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

const Stat: React.FC<{ label: string; value: number; color: 'blue' | 'amber' | 'emerald'; icon: React.ElementType }> = ({ label, value, color, icon: Icon }) => (
  <div className="glass-card p-4 rounded-lg">
    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2',
      color === 'blue'    && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
      color === 'amber'   && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
      color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    )}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
  </div>
);

export default ShiftHandover;
