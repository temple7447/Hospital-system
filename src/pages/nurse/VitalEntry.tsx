import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { HeartPulse, Activity, Thermometer, Droplets, Save, Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { listPatients, getPatient, createVital, listVitals } from '@/lib/services';
import type { Patient, VitalRecord } from '@/types';

const VitalEntry: React.FC = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const initialPatientId = params.get('patientId') ?? '';
  const [patientId, setPatientId] = useState(initialPatientId);
  const [search, setSearch] = useState('');
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [lastVitals, setLastVitals] = useState<VitalRecord | null>(null);

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

  useEffect(() => {
    listPatients().then(setAllPatients);
  }, []);

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

  const results = useMemo<Patient[]>(() => {
    if (patientId || !search) return [];
    const q = search.toLowerCase();
    return allPatients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.patientNumber.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [search, patientId, allPatients]);

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!user || !patient) return;
    const required = ['bloodPressureSystolic', 'bloodPressureDiastolic', 'heartRate', 'temperature'] as const;
    if (required.some(k => !form[k])) {
      toast.error('Please fill BP, heart rate, and temperature');
      return;
    }
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
    setForm({ bloodPressureSystolic: '', bloodPressureDiastolic: '', heartRate: '', temperature: '', weight: '', height: '', oxygenSaturation: '', respiratoryRate: '' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Record Vitals</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Capture patient vital signs</p>
      </div>

      {!patient ? (
        <div className="glass-card rounded-3xl p-6 max-w-2xl">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Find patient</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" autoFocus placeholder="Search by name or patient number…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 py-3 text-sm w-full" />
          </div>
          {results.length > 0 && (
            <div className="mt-3 space-y-1 border border-slate-100 dark:border-slate-800 rounded-2xl p-2">
              {results.map(p => (
                <button key={p.id} onClick={() => { setPatientId(p.id); setSearch(''); }}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-slate-500 font-medium">{p.patientNumber}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Patient</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</p>
                <p className="text-xs text-slate-500 font-medium">{patient.patientNumber} · {patient.bloodType}</p>
              </div>
              <button onClick={() => setPatientId('')} className="text-xs font-black text-blue-600 hover:text-blue-700">Change</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">BP Systolic</label>
                <input type="number" value={form.bloodPressureSystolic} onChange={e => set('bloodPressureSystolic', e.target.value)}
                  placeholder="120" className="input-field py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">BP Diastolic</label>
                <input type="number" value={form.bloodPressureDiastolic} onChange={e => set('bloodPressureDiastolic', e.target.value)}
                  placeholder="80" className="input-field py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Heart Rate (bpm)</label>
                <input type="number" value={form.heartRate} onChange={e => set('heartRate', e.target.value)}
                  placeholder="72" className="input-field py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Temperature (°F)</label>
                <input type="number" step="0.1" value={form.temperature} onChange={e => set('temperature', e.target.value)}
                  placeholder="98.6" className="input-field py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Weight (kg)</label>
                <input type="number" step="0.1" value={form.weight} onChange={e => set('weight', e.target.value)}
                  placeholder="70" className="input-field py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Height (cm)</label>
                <input type="number" value={form.height} onChange={e => set('height', e.target.value)}
                  placeholder="170" className="input-field py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">O₂ Saturation (%)</label>
                <input type="number" value={form.oxygenSaturation} onChange={e => set('oxygenSaturation', e.target.value)}
                  placeholder="98" className="input-field py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Respiratory Rate</label>
                <input type="number" value={form.respiratoryRate} onChange={e => set('respiratoryRate', e.target.value)}
                  placeholder="16" className="input-field py-2.5 text-sm" />
              </div>
            </div>

            <button onClick={handleSave}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm font-bold">
              <Save className="w-4 h-4" /> Save Vitals
            </button>
          </div>

          <div className="space-y-4">
            <div className="glass-card rounded-3xl p-5">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Last Recorded</p>
              {lastVitals ? (
                <div className="space-y-2 text-sm">
                  <p className="text-xs text-slate-400 font-medium">{new Date(lastVitals.recordedAt).toLocaleString()}</p>
                  <Row icon={Activity}    label="BP"    value={`${lastVitals.bloodPressureSystolic}/${lastVitals.bloodPressureDiastolic}`} />
                  <Row icon={HeartPulse}  label="HR"    value={`${lastVitals.heartRate} bpm`} />
                  <Row icon={Thermometer} label="Temp"  value={`${lastVitals.temperature}°F`} />
                  <Row icon={Droplets}    label="SpO₂"  value={`${lastVitals.oxygenSaturation}%`} />
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">No previous vitals</p>
              )}
            </div>

            {patient.allergies.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-5">
                <p className="text-xs font-black text-red-600 uppercase tracking-wider mb-2">Allergies</p>
                <p className="text-sm font-bold text-red-700 dark:text-red-300">{patient.allergies.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const Row: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2 text-slate-500">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs font-bold">{label}</span>
    </div>
    <span className="font-black text-slate-900 dark:text-white">{value}</span>
  </div>
);

export default VitalEntry;
