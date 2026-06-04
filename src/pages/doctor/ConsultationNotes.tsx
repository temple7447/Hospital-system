import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  FileText, Plus, Search, X, ChevronDown, ChevronUp,
  Save, Loader2, Calendar,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import {
  listConsultationNotes, createConsultationNote, updateConsultationNote,
  listPatients, listAppointments,
} from '@/lib/services';
import { toast } from 'sonner';
import type { ConsultationNote, Patient, Appointment } from '@/types';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

interface NoteFormState {
  patientId: string;
  appointmentId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

const EMPTY: NoteFormState = { patientId: '', appointmentId: '', subjective: '', objective: '', assessment: '', plan: '' };

const SOAP_FIELDS: { key: keyof Pick<NoteFormState, 'subjective'|'objective'|'assessment'|'plan'>; label: string; hint: string }[] = [
  { key: 'subjective',  label: 'S — Subjective',  hint: "Patient's reported symptoms and complaints" },
  { key: 'objective',   label: 'O — Objective',   hint: 'Measurable findings: vitals, physical exam, labs' },
  { key: 'assessment',  label: 'A — Assessment',  hint: 'Diagnosis or differential diagnoses' },
  { key: 'plan',        label: 'P — Plan',        hint: 'Treatment plan, medications, follow-up instructions' },
];

const ConsultationNotes: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState<ConsultationNote[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [apts, setApts] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NoteFormState>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [notes, pats, apts] = await Promise.all([
      listConsultationNotes({ doctor_id: user.id }),
      listPatients(),
      listAppointments({ doctor_id: user.id }),
    ]);
    setNotes(notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setPatients(pats);
    setApts(apts);
  };

  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    const pid = searchParams.get('patientId');
    const aid = searchParams.get('appointmentId');
    if (pid || aid) {
      setForm(f => ({ ...f, patientId: pid ?? '', appointmentId: aid ?? '' }));
      setShowForm(true);
    }
  }, [searchParams]);

  const getPatient = (id: string) => patients.find(p => p.id === id);
  const getApt     = (id: string) => apts.find(a => a.id === id);

  const availableApts = useMemo(() =>
    apts.filter(a => a.patientId === form.patientId && (a.status === 'completed' || a.status === 'in_progress')),
    [apts, form.patientId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const t = search.toLowerCase();
    return notes.filter(n => {
      const p = getPatient(n.patientId);
      return (p ? `${p.firstName} ${p.lastName}`.toLowerCase().includes(t) : false) ||
        n.assessment.toLowerCase().includes(t) ||
        n.subjective.toLowerCase().includes(t);
    });
  }, [notes, search, patients]);

  const handleSubmit = async () => {
    if (!user || !form.patientId || !form.appointmentId) {
      toast.error('Select a patient and appointment');
      return;
    }
    if (!form.subjective.trim() && !form.assessment.trim()) {
      toast.error('Fill in at least Subjective and Assessment');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateConsultationNote(editId, {
          subjective: form.subjective,
          objective:  form.objective,
          assessment: form.assessment,
          plan:       form.plan,
        });
        toast.success('Note updated');
      } else {
        await createConsultationNote({
          patientId:     form.patientId,
          doctorId:      user.id,
          appointmentId: form.appointmentId,
          subjective:    form.subjective,
          objective:     form.objective,
          assessment:    form.assessment,
          plan:          form.plan,
        });
        toast.success('Note saved');
      }
      await load();
      setShowForm(false);
      setForm({ ...EMPTY });
      setEditId(null);
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (note: ConsultationNote) => {
    setForm({
      patientId:     note.patientId,
      appointmentId: note.appointmentId,
      subjective:    note.subjective,
      objective:     note.objective,
      assessment:    note.assessment,
      plan:          note.plan,
    });
    setEditId(note.id);
    setShowForm(true);
    setExpandedId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Consultation Notes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            SOAP notes · {notes.length} total
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setForm({ ...EMPTY }); setEditId(null); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 self-start">
          <Plus className="w-4 h-4" /> New Note
        </button>
      </motion.div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white">
                {editId ? 'Edit Note' : 'New SOAP Note'}
              </h3>
              <button onClick={() => { setShowForm(false); setForm({ ...EMPTY }); setEditId(null); }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</label>
                  <select value={form.patientId}
                    onChange={e => setForm(f => ({ ...f, patientId: e.target.value, appointmentId: '' }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none cursor-pointer">
                    <option value="">Select patient…</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName} · {p.patientNumber}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appointment</label>
                  <select value={form.appointmentId}
                    onChange={e => setForm(f => ({ ...f, appointmentId: e.target.value }))}
                    disabled={!form.patientId}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none cursor-pointer disabled:opacity-40">
                    <option value="">Select appointment…</option>
                    {availableApts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.date} {a.time} — {a.type.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {SOAP_FIELDS.map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</label>
                  <textarea value={form[f.key]} rows={3}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.hint}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400" />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowForm(false); setForm({ ...EMPTY }); setEditId(null); }}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><Save className="w-3.5 h-3.5" /> {editId ? 'Update Note' : 'Save Note'}</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search notes by patient or assessment…"
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Notes list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">
            {search ? 'No notes match your search' : 'No consultation notes yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => {
            const patient  = getPatient(note.patientId);
            const apt      = getApt(note.appointmentId);
            const expanded = expandedId === note.id;
            return (
              <div key={note.id} className="glass-card rounded-2xl overflow-hidden">
                <button className="w-full flex items-center gap-4 p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all text-left"
                  onClick={() => setExpandedId(expanded ? null : note.id)}>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {patient ? `${patient.firstName} ${patient.lastName}` : '—'}
                    </p>
                    <p className="text-xs text-slate-400 font-bold mt-0.5 truncate">
                      {note.assessment || 'No assessment recorded'}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                        <Calendar className="w-3 h-3" /> {fmtDate(note.createdAt)}
                      </span>
                      {apt && (
                        <span className="text-[10px] text-slate-400 font-bold capitalize">
                          {apt.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                        {SOAP_FIELDS.map(f => note[f.key] && (
                          <div key={f.key} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{note[f.key]}</p>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-400 font-bold">
                            Last updated {fmtDate(note.updatedAt)} · {fmtTime(note.updatedAt)}
                          </span>
                          <button onClick={() => handleEdit(note)}
                            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all">
                            Edit Note
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConsultationNotes;
