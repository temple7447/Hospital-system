import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Activity, CheckCircle2, Clock, ChevronDown, ChevronUp, Pill, HeartPulse, Bandage, Stethoscope, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { listNursingTasks, updateNursingTask, listPatients } from '@/lib/services';
import type { NursingTask, NursingTaskType, NursingTaskStatus, Patient } from '@/types';

const TYPE_CFG: Record<NursingTaskType, { label: string; icon: React.ElementType; color: string }> = {
  medication: { label: 'Medication', icon: Pill,         color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
  vitals:     { label: 'Vitals',     icon: HeartPulse,   color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' },
  wound_care: { label: 'Wound Care', icon: Bandage,      color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' },
  assessment: { label: 'Assessment', icon: Stethoscope,  color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20' },
  other:      { label: 'Other',      icon: Sparkles,     color: 'bg-slate-100 text-slate-600 dark:bg-slate-800' },
};

const STATUS_FILTERS: { value: NursingTaskStatus | 'all'; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
];

const NurseTasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<NursingTask[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState<NursingTaskStatus | 'all'>('pending');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const refresh = async () => {
    if (!user) return;
    const t = await listNursingTasks({ nurse_id: user.id });
    setTasks(t);
  };

  useEffect(() => {
    if (!user) return;
    Promise.all([
      listNursingTasks({ nurse_id: user.id }),
      listPatients(),
    ]).then(([t, pats]) => {
      setTasks(t);
      setAllPatients(pats);
    });
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter(t => t.status === filter);
  }, [tasks, filter]);

  const counts = useMemo(() => ({
    pending:     tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed:   tasks.filter(t => t.status === 'completed').length,
  }), [tasks]);

  const start = async (id: string) => {
    if (!user) return;
    await updateNursingTask(id, { status: 'in_progress' });
    await refresh();
  };

  const complete = async (task: NursingTask) => {
    if (!user) return;
    await updateNursingTask(task.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      notes: notes || task.notes,
    });
    toast.success('Task completed');
    setExpanded(null);
    setNotes('');
    await refresh();
  };

  const skip = async (task: NursingTask) => {
    if (!user) return;
    await updateNursingTask(task.id, { status: 'skipped' });
    toast.success('Task skipped');
    await refresh();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Nursing Tasks</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Medication administration, vitals & assessments</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Pending"     value={counts.pending}     icon={Clock}        color="amber" />
        <Stat label="In Progress" value={counts.in_progress} icon={Activity}     color="blue" />
        <Stat label="Completed"   value={counts.completed}   icon={CheckCircle2} color="emerald" />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={cn('px-4 py-2 rounded-xl text-xs font-black transition-all',
              filter === f.value ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200')}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center text-slate-400 font-medium">No tasks match filter.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => {
            const patient = allPatients.find(p => p.id === task.patientId);
            const cfg = TYPE_CFG[task.type];
            const Icon = cfg.icon;
            const isExpanded = expanded === task.id;
            const overdue = task.status === 'pending' && new Date(task.scheduledAt) < new Date();

            return (
              <motion.div key={task.id} layout
                className={cn('glass-card rounded-3xl overflow-hidden',
                  task.status === 'completed' && 'opacity-60',
                  overdue && 'ring-2 ring-amber-400')}>
                <button onClick={() => setExpanded(isExpanded ? null : task.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-left">
                  <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', cfg.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 dark:text-white truncate">{task.description}</p>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'} · {cfg.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <StatusPill status={task.status} />
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                    {task.notes && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Notes</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{task.notes}</p>
                      </div>
                    )}
                    {task.status !== 'completed' && task.status !== 'skipped' && (
                      <>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                          placeholder="Notes for this task (optional)…"
                          className="input-field py-3 text-sm w-full resize-none" />
                        <div className="flex gap-2">
                          {task.status === 'pending' && (
                            <button onClick={() => start(task.id)}
                              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-colors">
                              Start
                            </button>
                          )}
                          <button onClick={() => complete(task)}
                            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-colors">
                            Mark Complete
                          </button>
                          <button onClick={() => skip(task)}
                            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-colors">
                            Skip
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

const Stat: React.FC<{ label: string; value: number; icon: React.ElementType; color: 'amber' | 'blue' | 'emerald' }> = ({ label, value, icon: Icon, color }) => (
  <div className="glass-card p-4 rounded-2xl">
    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2',
      color === 'amber'   && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
      color === 'blue'    && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
      color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    )}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
  </div>
);

const StatusPill: React.FC<{ status: NursingTaskStatus }> = ({ status }) => {
  const cfg = {
    pending:     { color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',   label: 'Pending' },
    in_progress: { color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',      label: 'In Progress' },
    completed:   { color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20', label: 'Done' },
    skipped:     { color: 'bg-slate-100 text-slate-500 dark:bg-slate-800',     label: 'Skipped' },
  }[status];
  return <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide shrink-0', cfg.color)}>{cfg.label}</span>;
};

export default NurseTasks;
