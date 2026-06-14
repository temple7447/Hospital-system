import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  BookOpen, Search, User, X, CheckCircle2, Send, Clock, Loader2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { listPatients, listNursingTasks, createNursingTask } from '@/lib/services';
import type { Patient, NursingTask } from '@/types';

const TOPICS = [
  { key: 'malaria',      label: 'Malaria Prevention & Treatment' },
  { key: 'hypertension', label: 'Hypertension Management' },
  { key: 'art',          label: 'HIV/ART Adherence' },
  { key: 'tb',           label: 'TB Awareness & Compliance' },
  { key: 'medication',   label: 'Medication Compliance' },
  { key: 'nutrition',    label: 'Nutrition & Diet' },
  { key: 'diabetes',     label: 'Diabetes Self-Management' },
  { key: 'wound',        label: 'Wound Care at Home' },
  { key: 'hygiene',      label: 'Hand Hygiene & Infection Prevention' },
  { key: 'immunisation', label: 'Immunisation & Vaccination' },
  { key: 'antenatal',    label: 'Antenatal / Maternal Health' },
  { key: 'other',        label: 'Other (specify in notes)' },
] as const;

type TopicKey = typeof TOPICS[number]['key'];

const today = () => new Date().toISOString().split('T')[0];

const PatientEducation: React.FC = () => {
  const { user } = useAuth();

  const [allPatients, setAllPatients]   = useState<Patient[]>([]);
  const [patient, setPatient]           = useState<Patient | null>(null);
  const [search, setSearch]             = useState('');
  const [topics, setTopics]             = useState<Set<TopicKey>>(new Set());
  const [noteText, setNoteText]         = useState('');
  const [saving, setSaving]             = useState(false);
  const [todaySessions, setToday]       = useState<NursingTask[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    listPatients().then(setAllPatients);
    if (!user) return;
    listNursingTasks({ nurse_id: user.id, date: today() })
      .then(tasks => {
        setToday(tasks.filter(t => t.type === 'assessment' && t.description.startsWith('Patient Education:')));
        setLoadingSessions(false);
      });
  }, [user?.id]);

  const results = useMemo<Patient[]>(() => {
    if (patient || !search.trim()) return [];
    const q = search.toLowerCase();
    return allPatients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.patientNumber.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [search, patient, allPatients]);

  const toggle = (key: TopicKey) =>
    setTopics(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleSubmit = async () => {
    if (!user || !patient || topics.size === 0) return;
    const topicLabels = TOPICS.filter(t => topics.has(t.key)).map(t => t.label);
    setSaving(true);
    try {
      await createNursingTask({
        patientId:   patient.id,
        nurseId:     user.id,
        type:        'assessment',
        description: `Patient Education: ${topicLabels.join(', ')}`,
        scheduledAt: new Date().toISOString(),
        status:      'completed',
        completedAt: new Date().toISOString(),
        notes:       noteText.trim() || undefined,
      });
      toast.success(`Education session recorded for ${patient.firstName} ${patient.lastName}`);
      // refresh today's sessions
      const updated = await listNursingTasks({ nurse_id: user.id, date: today() });
      setToday(updated.filter(t => t.type === 'assessment' && t.description.startsWith('Patient Education:')));
      // reset form
      setPatient(null);
      setSearch('');
      setTopics(new Set());
      setNoteText('');
    } catch {
      toast.error('Failed to record session');
    } finally {
      setSaving(false);
    }
  };

  const patientName = (id: string) => {
    const p = allPatients.find(x => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
  };

  const fieldCls = 'w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Patient Education</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Record health education sessions given to patients and their families
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─ Form ─ */}
        <div className="lg:col-span-2 space-y-5">

          {/* Patient search */}
          <div className="glass-card rounded-lg p-5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Select Patient</p>
            {!patient ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or patient number…"
                    className={`${fieldCls} pl-10`}
                  />
                </div>
                {results.length > 0 && (
                  <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    {results.map(p => (
                      <button key={p.id}
                        onClick={() => { setPatient(p); setSearch(''); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-slate-400">{p.patientNumber}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-xs text-blue-400">{patient.patientNumber}</p>
                  </div>
                </div>
                <button onClick={() => setPatient(null)}
                  className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  <X className="w-3.5 h-3.5 text-blue-400" />
                </button>
              </div>
            )}
          </div>

          {/* Topics */}
          <div className="glass-card rounded-lg p-5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Topics Covered <span className="text-red-400 normal-case font-normal">(select all that apply)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TOPICS.map(t => {
                const selected = topics.has(t.key);
                return (
                  <button key={t.key} onClick={() => toggle(t.key)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left',
                      selected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <div className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                      selected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600')}>
                      {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="glass-card rounded-lg p-5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Additional Notes (optional)</p>
            <textarea
              rows={4}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="e.g. Patient and daughter were educated on correct malaria drug dosage and importance of completing the full course. Demonstrated correct LLIN usage. Patient verbalized understanding…"
              className={`${fieldCls} resize-none`}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !patient || topics.size === 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Send className="w-4 h-4" /> Record Education Session</>
            }
          </button>
        </div>

        {/* ─ Today's sessions ─ */}
        <div className="glass-card rounded-lg p-5 self-start">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Today's Sessions</p>
          </div>

          {loadingSessions ? (
            <p className="text-xs text-slate-400 font-medium">Loading…</p>
          ) : todaySessions.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium italic">No sessions recorded yet today.</p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map(session => (
                <div key={session.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">
                    {patientName(session.patientId)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {session.description.replace('Patient Education: ', '')}
                  </p>
                  {session.notes && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">{session.notes}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    {session.completedAt && new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PatientEducation;
