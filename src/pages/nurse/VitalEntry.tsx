import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  HeartPulse, Activity, Thermometer, Droplets, Save,
  Search, X, User, Loader2, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { listPatients, getPatient, createVital, listVitals } from '@/lib/services';
import type { Patient, VitalRecord } from '@/types';

const VitalEntry: React.FC = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [patientId, setPatientId]     = useState(params.get('patientId') ?? '');
  const [search, setSearch]           = useState('');
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [patient, setPatient]         = useState<Patient | null>(null);
  const [lastVitals, setLastVitals]   = useState<VitalRecord | null>(null);
  const [saving, setSaving]           = useState(false);

  const [form, setForm] = useState({
    bloodPressureSystolic:  '',
    bloodPressureDiastolic: '',
    heartRate:              '',
    temperature:            '',
    weight:                 '',
    height:                 '',
    oxygenSaturation:       '',
    respiratoryRate:        '',
  });

  useEffect(() => { listPatients().then(setAllPatients); }, []);

  useEffect(() => {
    if (!patientId) { setPatient(null); setLastVitals(null); return; }
    Promise.all([
      getPatient(patientId).catch(() => null as unknown as Patient),
      listVitals({ patient_id: patientId }),
    ]).then(([p, vitals]) => {
      setPatient(p);
      const sorted = vitals.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
      setLastVitals(sorted[0] ?? null);
    });
  }, [patientId]);

  const searchResults = useMemo<Patient[]>(() => {
    if (patientId || !search.trim()) return [];
    const q = search.toLowerCase();
    return allPatients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.patientNumber.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [search, patientId, allPatients]);

  const set = <K extends keyof typeof form>(k: K, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!user || !patient) return;
    const required = ['bloodPressureSystolic', 'bloodPressureDiastolic', 'heartRate', 'temperature'] as const;
    if (required.some(k => !form[k])) {
      toast.error('Please fill BP, heart rate, and temperature');
      return;
    }
    setSaving(true);
    try {
      await createVital({
        patientId:              patient.id,
        recordedBy:             user.id,
        bloodPressureSystolic:  Number(form.bloodPressureSystolic),
        bloodPressureDiastolic: Number(form.bloodPressureDiastolic),
        heartRate:              Number(form.heartRate),
        temperature:            Number(form.temperature),
        weight:                 Number(form.weight)           || lastVitals?.weight || 0,
        height:                 Number(form.height)           || lastVitals?.height || 0,
        oxygenSaturation:       Number(form.oxygenSaturation) || 98,
        respiratoryRate:        Number(form.respiratoryRate)  || 16,
        recordedAt:             new Date().toISOString(),
      });
      toast.success(`Vitals recorded for ${patient.firstName} ${patient.lastName}`);
      setForm({
        bloodPressureSystolic: '', bloodPressureDiastolic: '',
        heartRate: '', temperature: '', weight: '', height: '',
        oxygenSaturation: '', respiratoryRate: '',
      });
    } catch {
      toast.error('Failed to record vitals');
    } finally {
      setSaving(false);
    }
  };

  const fieldCls    = 'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200';
  const labelCls    = 'block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1';
  const sectionTitle = 'text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">Record Vitals</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Capture patient vital signs</p>
        </div>
      </div>

      {/* Patient search (pre-selection) */}
      {!patient && (
        <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-5 max-w-lg">
          <p className={sectionTitle}>Find Patient</p>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or patient number…"
              className={`${fieldCls} pl-8`} />
          </div>
          {searchResults.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
              {searchResults.map(p => (
                <button key={p.id} onClick={() => { setPatientId(p.id); setSearch(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-slate-800 dark:text-white">{p.firstName} {p.lastName}</p>
                    <p className="text-[11px] text-slate-400">{p.patientNumber}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main form (once patient is selected) */}
      {patient && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0">

          {/* ── Left: vitals form ─────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-5">

                {/* Patient row */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-blue-700 dark:text-blue-300">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-[11px] text-blue-500">
                        {patient.patientNumber}{patient.bloodType ? ` · ${patient.bloodType}` : ''}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setPatientId(''); setSearch(''); }}
                    className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                    <X className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                </div>

                {/* Vitals grid */}
                <div>
                  <p className={sectionTitle}>Vital Signs <span className="text-red-400 normal-case font-normal">* required</span></p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>BP Systolic *</label>
                      <input type="number" value={form.bloodPressureSystolic}
                        onChange={e => set('bloodPressureSystolic', e.target.value)}
                        placeholder="120" className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>BP Diastolic *</label>
                      <input type="number" value={form.bloodPressureDiastolic}
                        onChange={e => set('bloodPressureDiastolic', e.target.value)}
                        placeholder="80" className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Heart Rate (bpm) *</label>
                      <input type="number" value={form.heartRate}
                        onChange={e => set('heartRate', e.target.value)}
                        placeholder="72" className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Temperature (°F) *</label>
                      <input type="number" step="0.1" value={form.temperature}
                        onChange={e => set('temperature', e.target.value)}
                        placeholder="98.6" className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Weight (kg)</label>
                      <input type="number" step="0.1" value={form.weight}
                        onChange={e => set('weight', e.target.value)}
                        placeholder={lastVitals?.weight ? String(lastVitals.weight) : '70'}
                        className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Height (cm)</label>
                      <input type="number" value={form.height}
                        onChange={e => set('height', e.target.value)}
                        placeholder={lastVitals?.height ? String(lastVitals.height) : '170'}
                        className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>O₂ Saturation (%)</label>
                      <input type="number" value={form.oxygenSaturation}
                        onChange={e => set('oxygenSaturation', e.target.value)}
                        placeholder="98" className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Respiratory Rate</label>
                      <input type="number" value={form.respiratoryRate}
                        onChange={e => set('respiratoryRate', e.target.value)}
                        placeholder="16" className={fieldCls} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0">
                <button onClick={handleSave} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><Save className="w-3.5 h-3.5" /> Save Vitals</>}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: context sidebar ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Last recorded */}
            <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
              <p className={sectionTitle}>Last Recorded</p>
              {lastVitals ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400">
                    {new Date(lastVitals.recordedAt).toLocaleString()}
                  </p>
                  <VRow icon={Activity}    label="BP"   value={`${lastVitals.bloodPressureSystolic}/${lastVitals.bloodPressureDiastolic}`} />
                  <VRow icon={HeartPulse}  label="HR"   value={`${lastVitals.heartRate} bpm`} />
                  <VRow icon={Thermometer} label="Temp" value={`${lastVitals.temperature}°F`} />
                  <VRow icon={Droplets}    label="SpO₂" value={`${lastVitals.oxygenSaturation}%`} />
                </div>
              ) : (
                <p className="text-[12px] text-slate-400">No previous vitals on record</p>
              )}
            </div>

            {/* Allergies warning */}
            {patient.allergies.length > 0 && (
              <div className="border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-1.5">Allergies</p>
                <p className="text-[13px] font-semibold text-red-700 dark:text-red-300">
                  {patient.allergies.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const VRow: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1.5 text-slate-500">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[11px] font-medium">{label}</span>
    </div>
    <span className="text-[13px] font-semibold text-slate-800 dark:text-white">{value}</span>
  </div>
);

export default VitalEntry;
