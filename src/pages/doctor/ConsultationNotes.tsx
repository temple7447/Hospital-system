import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  FileText, Plus, Search, X, ChevronDown, ChevronUp,
  Save, Loader2, Calendar, ArrowLeft,
} from 'lucide-react';
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
  const { user }         = useAuth();
  const [searchParams]   = useSearchParams();
  const [notes, setNotes]     = useState<ConsultationNote[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [apts, setApts]       = useState<Appointment[]>([]);
  const [search, setSearch]   = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState<NoteFormState>({ ...EMPTY });
  const [editId, setEditId]         = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [n, pats, appointments] = await Promise.all([
      listConsultationNotes({ doctor_id: user.id }),
      listPatients(),
      listAppointments({ doctor_id: user.id }),
    ]);
    setNotes(n.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setPatients(pats);
    setApts(appointments);
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

  const closeForm = () => { setShowForm(false); setForm({ ...EMPTY }); setEditId(null); };

  const fieldCls     = 'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200';
  const labelCls     = 'block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1';
  const sectionTitle = 'text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3';

  /* ── Form view ──────────────────────────────────────────────────────────── */
  if (showForm) {
    const selPatient = getPatient(form.patientId);
    const selApt     = getApt(form.appointmentId);

    return (
      <div className="h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={closeForm}
            className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-[15px] font-semibold text-slate-800 dark:text-white">
            {editId ? 'Edit SOAP Note' : 'New SOAP Note'}
          </span>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0">

          {/* ── Left: context ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4 overflow-y-auto">
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
              <p className={sectionTitle}>Patient & Appointment</p>

              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Patient *</label>
                  <select value={form.patientId}
                    onChange={e => setForm(f => ({ ...f, patientId: e.target.value, appointmentId: '' }))}
                    className={fieldCls}>
                    <option value="">Select patient…</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName} · {p.patientNumber}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Appointment *</label>
                  <select value={form.appointmentId}
                    onChange={e => setForm(f => ({ ...f, appointmentId: e.target.value }))}
                    disabled={!form.patientId}
                    className={`${fieldCls} disabled:opacity-40`}>
                    <option value="">Select appointment…</option>
                    {availableApts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.date} {a.time} — {a.type.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  {form.patientId && availableApts.length === 0 && (
                    <p className="text-[11px] text-amber-500 mt-1">No completed or in-progress appointments for this patient</p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary card */}
            {selPatient && (
              <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
                <p className={sectionTitle}>Summary</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white text-[12px] font-semibold shrink-0">
                    {selPatient.firstName[0]}{selPatient.lastName[0]}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-white">
                      {selPatient.firstName} {selPatient.lastName}
                    </p>
                    <p className="text-[11px] text-slate-400">{selPatient.patientNumber}</p>
                  </div>
                </div>
                {selApt && (
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {selApt.date} · {selApt.time} · {selApt.type.replace('_', ' ')}
                  </div>
                )}
              </div>
            )}

            {/* Cancel */}
            <button onClick={closeForm}
              className="w-full py-2 border border-slate-200 dark:border-slate-700 rounded text-[13px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
          </div>

          {/* ── Right: SOAP fields ──────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <p className={sectionTitle}>SOAP Notes</p>
                {SOAP_FIELDS.map(f => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label}</label>
                    <textarea value={form[f.key]} rows={3}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.hint}
                      className={`${fieldCls} resize-none`} />
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0">
                <button onClick={handleSubmit} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><Save className="w-3.5 h-3.5" /> {editId ? 'Update Note' : 'Save Note'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── List view ──────────────────────────────────────────────────────────── */
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">Consultation Notes</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">SOAP notes · {notes.length} total</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm({ ...EMPTY }); setEditId(null); }}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Note
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search notes by patient or assessment…"
          className="w-full pl-8 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-blue-500" />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
            <X className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {filtered.length === 0 ? (
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-16 text-center">
            <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-[13px] text-slate-400">
              {search ? 'No notes match your search' : 'No consultation notes yet'}
            </p>
          </div>
        ) : filtered.map(note => {
          const p        = getPatient(note.patientId);
          const apt      = getApt(note.appointmentId);
          const expanded = expandedId === note.id;
          return (
            <div key={note.id} className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
              <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left"
                onClick={() => setExpandedId(expanded ? null : note.id)}>
                <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-white">
                    {p ? `${p.firstName} ${p.lastName}` : '—'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {note.assessment || 'No assessment recorded'}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3" /> {fmtDate(note.createdAt)}
                    </span>
                    {apt && (
                      <span className="text-[10px] text-slate-400 capitalize">
                        {apt.type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  {expanded
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                      {SOAP_FIELDS.map(f => note[f.key] && (
                        <div key={f.key} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700/50">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
                          <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">{note[f.key]}</p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">
                          Last updated {fmtDate(note.updatedAt)} · {fmtTime(note.updatedAt)}
                        </span>
                        <button onClick={() => handleEdit(note)}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded text-[11px] font-medium hover:bg-blue-100 transition-colors">
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
    </div>
  );
};

export default ConsultationNotes;
