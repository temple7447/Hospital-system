import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FlaskConical, Save, ArrowLeft, AlertTriangle, Loader2,
  Plus, Trash2, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { getLabOrder, updateLabOrder, getPatient, getStaff } from '@/lib/services';
import type { LabOrder, LabResultField, LabTestResult, ResultFlag, Patient, Staff } from '@/types';

// ─── Nigerian hospital test presets ─────────────────────────────────────────
const PRESETS: Record<string, string[]> = {
  'fbc':                    ['WBC', 'RBC', 'Haemoglobin', 'Haematocrit (PCV)', 'MCV', 'MCH', 'MCHC', 'Platelets', 'Neutrophils (%)', 'Lymphocytes (%)', 'Monocytes (%)', 'Eosinophils (%)', 'Basophils (%)'],
  'full blood count':       ['WBC', 'RBC', 'Haemoglobin', 'Haematocrit (PCV)', 'MCV', 'MCH', 'MCHC', 'Platelets', 'Neutrophils (%)', 'Lymphocytes (%)', 'Monocytes (%)', 'Eosinophils (%)', 'Basophils (%)'],
  'cbc':                    ['WBC', 'RBC', 'Haemoglobin', 'Haematocrit', 'MCV', 'MCH', 'MCHC', 'Platelets'],
  'lft':                    ['Total Protein', 'Albumin', 'Globulin', 'A/G Ratio', 'Total Bilirubin', 'Direct Bilirubin', 'Indirect Bilirubin', 'ALT (SGPT)', 'AST (SGOT)', 'ALP', 'GGT'],
  'liver function':         ['Total Protein', 'Albumin', 'Globulin', 'A/G Ratio', 'Total Bilirubin', 'Direct Bilirubin', 'Indirect Bilirubin', 'ALT (SGPT)', 'AST (SGOT)', 'ALP', 'GGT'],
  'rft':                    ['Urea', 'Creatinine', 'eGFR', 'Sodium', 'Potassium', 'Chloride', 'Bicarbonate', 'Uric Acid'],
  'renal function':         ['Urea', 'Creatinine', 'eGFR', 'Sodium', 'Potassium', 'Chloride', 'Bicarbonate', 'Uric Acid'],
  'e/u/cr':                 ['Urea', 'Creatinine', 'eGFR', 'Sodium', 'Potassium', 'Chloride', 'Bicarbonate'],
  'electrolytes':           ['Sodium', 'Potassium', 'Chloride', 'Bicarbonate', 'Calcium', 'Magnesium', 'Phosphate'],
  'lipid profile':          ['Total Cholesterol', 'LDL Cholesterol', 'HDL Cholesterol', 'Triglycerides', 'VLDL', 'Total/HDL Ratio'],
  'lipid':                  ['Total Cholesterol', 'LDL Cholesterol', 'HDL Cholesterol', 'Triglycerides', 'VLDL', 'Total/HDL Ratio'],
  'hba1c':                  ['HbA1c (%)', 'Estimated Average Glucose (mmol/L)'],
  'haemoglobin a1c':        ['HbA1c (%)', 'Estimated Average Glucose (mmol/L)'],
  'fasting blood glucose':  ['Fasting Blood Glucose'],
  'fbg':                    ['Fasting Blood Glucose'],
  'random blood glucose':   ['Random Blood Glucose'],
  'rbg':                    ['Random Blood Glucose'],
  'blood glucose':          ['Blood Glucose'],
  'glucose':                ['Glucose'],
  'malaria parasite':       ['Malaria Parasite', 'Species', 'Parasite Density', 'Stage'],
  'mp':                     ['Malaria Parasite', 'Species', 'Parasite Density', 'Stage'],
  'malaria rdt':            ['RDT Result', 'HRP-2 (P. falciparum)', 'pLDH (Non-falciparum)'],
  'widal':                  ['S. Typhi O', 'S. Typhi H', 'S. Paratyphi AO', 'S. Paratyphi BH'],
  'urinalysis':             ['Colour', 'Appearance', 'pH', 'Specific Gravity', 'Protein', 'Glucose', 'Ketones', 'Blood', 'Nitrites', 'Leucocytes', 'Bilirubin', 'Urobilinogen', 'Casts', 'Crystals'],
  'urine m/c/s':            ['Colour', 'Appearance', 'pH', 'Specific Gravity', 'Protein', 'Glucose', 'WBC/hpf', 'RBC/hpf', 'Organism', 'Colony Count'],
  'stool':                  ['Colour', 'Consistency', 'Occult Blood', 'Mucus', 'Ova/Cysts', 'Organism'],
  'genotype':               ['Haemoglobin Genotype'],
  'blood group':            ['ABO Group', 'Rhesus Factor'],
  'blood group and genotype':['ABO Group', 'Rhesus Factor', 'Haemoglobin Genotype'],
  'thyroid':                ['TSH', 'T3 (Triiodothyronine)', 'T4 (Thyroxine)', 'Free T3', 'Free T4'],
  'tft':                    ['TSH', 'T3 (Triiodothyronine)', 'T4 (Thyroxine)', 'Free T3', 'Free T4'],
  'psa':                    ['Total PSA', 'Free PSA', 'PSA Ratio'],
  'coagulation':            ['PT', 'INR', 'APTT', 'Thrombin Time', 'Fibrinogen'],
  'pt/inr':                 ['PT (seconds)', 'INR', 'APTT (seconds)'],
  'hepatitis b':            ['HBsAg', 'HBeAg', 'Anti-HBs', 'Anti-HBe', 'Anti-HBc (IgM)', 'HBV DNA (copies/mL)'],
  'hepatitis c':            ['Anti-HCV', 'HCV RNA (copies/mL)', 'Genotype'],
  'hiv':                    ['HIV Screening', 'Confirmatory Result', 'CD4 Count', 'Viral Load'],
  'semen analysis':         ['Volume (mL)', 'Colour', 'Viscosity', 'pH', 'Sperm Count (million/mL)', 'Total Motility (%)', 'Progressive Motility (%)', 'Normal Morphology (%)', 'WBC/hpf'],
  'culture':                ['Specimen Source', 'Organism Isolated', 'Colony Count', 'Antibiotic', 'Sensitive', 'Resistant', 'Intermediate'],
  'blood culture':          ['Growth', 'Organism', 'Antibiotics Sensitive', 'Antibiotics Resistant'],
  'pregnancy test':         ['Beta-hCG Result'],
  'crp':                    ['C-Reactive Protein (mg/L)'],
  'esr':                    ['ESR (mm/hr)', 'Method'],
  'iron studies':           ['Serum Iron', 'TIBC', 'Transferrin Saturation (%)', 'Serum Ferritin'],
  'cardiac markers':        ['Troponin I', 'Troponin T', 'CK-MB', 'BNP/NT-proBNP', 'Myoglobin'],
  'lft+rft':                ['Total Protein', 'Albumin', 'ALT', 'AST', 'ALP', 'Total Bilirubin', 'Urea', 'Creatinine', 'eGFR', 'Sodium', 'Potassium'],
};

function getPreset(testName: string): string[] | null {
  const key = testName.toLowerCase().trim();
  if (PRESETS[key]) return PRESETS[key];
  for (const [k, v] of Object.entries(PRESETS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

function emptyField(): LabResultField {
  return { name: '', value: '', unit: '', referenceRange: '', flag: 'normal' };
}

function initTestResult(testName: string): LabTestResult {
  const preset = getPreset(testName);
  return {
    testName,
    fields: preset ? preset.map(name => ({ ...emptyField(), name })) : [emptyField()],
    notes: '',
  };
}

const FLAG_CFG: Record<ResultFlag, { color: string; activeColor: string; label: string }> = {
  normal:   { color: 'border-slate-200 dark:border-slate-700 text-slate-400', activeColor: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600', label: 'Normal' },
  abnormal: { color: 'border-slate-200 dark:border-slate-700 text-slate-400', activeColor: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600', label: 'Abnormal' },
  critical: { color: 'border-slate-200 dark:border-slate-700 text-slate-400', activeColor: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600', label: 'Critical' },
};

const IMAGING_CATEGORIES = ['radiology', 'imaging', 'xray', 'mri', 'ct', 'ultrasound'];

const EnterResults: React.FC = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const orderId     = params.get('id');

  const [order, setOrder]     = useState<LabOrder | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor]   = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [testResults, setTestResults] = useState<LabTestResult[]>([]);
  const [orderNotes, setOrderNotes]   = useState('');

  useEffect(() => {
    if (!orderId) { setNotFound(true); setLoading(false); return; }
    getLabOrder(orderId)
      .then(async o => {
        setOrder(o);
        setOrderNotes(o.notes ?? '');
        // If order already has results, load them for editing; else init from tests
        if (o.results && o.results.length > 0) {
          setTestResults(o.results.map(r => ({ ...r, notes: r.notes ?? '' })));
        } else {
          setTestResults(o.tests.map(initTestResult));
        }
        // expand all tests by default
        const exp: Record<number, boolean> = {};
        o.tests.forEach((_, i) => { exp[i] = true; });
        setExpanded(exp);
        const [pt, dr] = await Promise.all([
          getPatient(o.patientId).catch(() => null),
          getStaff(o.doctorId).catch(() => null),
        ]);
        setPatient(pt);
        setDoctor(dr);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
    </div>
  );

  if (notFound || !order) return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-16 text-center bg-white dark:bg-slate-900">
      <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
      <p className="text-slate-400 font-medium mb-4">Order not found.</p>
      <Link to="/lab/queue" className="text-blue-600 hover:text-blue-700 text-sm font-medium">← Back to queue</Link>
    </div>
  );

  if (order.category && IMAGING_CATEGORIES.includes(order.category.toLowerCase())) return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-16 text-center bg-white dark:bg-slate-900">
      <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
      <p className="text-slate-400 font-medium mb-2">This is an imaging order.</p>
      <Link to={`/radiology/report?id=${order.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
        Open in Radiology →
      </Link>
    </div>
  );

  // ─── Field helpers ─────────────────────────────────────────────
  const setField = (ti: number, fi: number, key: keyof LabResultField, val: string) =>
    setTestResults(prev => prev.map((t, tIdx) =>
      tIdx !== ti ? t : {
        ...t,
        fields: t.fields.map((f, fIdx) => fIdx !== fi ? f : { ...f, [key]: val }),
      }
    ));

  const addField = (ti: number) =>
    setTestResults(prev => prev.map((t, tIdx) =>
      tIdx !== ti ? t : { ...t, fields: [...t.fields, emptyField()] }
    ));

  const removeField = (ti: number, fi: number) =>
    setTestResults(prev => prev.map((t, tIdx) =>
      tIdx !== ti ? t : { ...t, fields: t.fields.filter((_, fIdx) => fIdx !== fi) }
    ));

  const setTestNotes = (ti: number, val: string) =>
    setTestResults(prev => prev.map((t, tIdx) => tIdx !== ti ? t : { ...t, notes: val }));

  const loadPreset = (ti: number) => {
    const testName = testResults[ti]?.testName ?? '';
    const preset = getPreset(testName);
    if (!preset) { toast.info('No preset found for this test — add fields manually'); return; }
    setTestResults(prev => prev.map((t, tIdx) =>
      tIdx !== ti ? t : { ...t, fields: preset.map(name => ({ ...emptyField(), name })) }
    ));
    toast.success(`Loaded ${preset.length} fields for ${testName}`);
  };

  const canSave = testResults.every(t =>
    t.fields.length > 0 && t.fields.every(f => f.name.trim() && f.value.trim())
  );

  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    try {
      await updateLabOrder(order.id, {
        results:     testResults,
        status:      'completed',
        completedAt: new Date().toISOString(),
        processedBy: user.id,
        notes:       orderNotes || undefined,
      });
      toast.success(`Results saved for ${order.labNumber}`);
      navigate('/lab/queue');
    } catch {
      toast.error('Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[12px] outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-300';
  const sectionTitle = 'text-[10px] font-semibold text-slate-400 uppercase tracking-wider';

  return (
    <div className="h-full flex flex-col gap-0">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <Link to="/lab/queue"
          className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <FlaskConical className="w-4 h-4 text-blue-600" />
        <span className="text-[15px] font-semibold text-slate-800 dark:text-white">{order.labNumber}</span>
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded uppercase',
          order.priority === 'stat'    && 'bg-red-50 text-red-600',
          order.priority === 'urgent'  && 'bg-amber-50 text-amber-600',
          order.priority === 'routine' && 'bg-slate-100 text-slate-500')}>
          {order.priority}
        </span>
        {order.status === 'completed' && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 uppercase">
            Already completed — editing
          </span>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0">

        {/* ── Left: patient info + notes + save ────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">

          {/* Patient & order info */}
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
            <p className={`${sectionTitle} mb-3`}>Order Details</p>
            {patient && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded mb-3">
                <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white text-[12px] font-semibold shrink-0">
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-white">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-[11px] text-slate-400">{patient.patientNumber}</p>
                  {patient.allergies.length > 0 && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">⚠ {patient.allergies.join(', ')}</p>
                  )}
                </div>
              </div>
            )}
            {doctor && (
              <p className="text-[12px] text-slate-500 mb-3">
                Ordered by <span className="font-medium text-slate-700 dark:text-slate-300">Dr. {doctor.firstName} {doctor.lastName}</span>
              </p>
            )}
            <div>
              <p className={`${sectionTitle} mb-2`}>Tests ({order.tests.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {order.tests.map(t => (
                  <span key={t} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[11px] font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Order-level notes */}
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
            <p className={`${sectionTitle} mb-2`}>Overall Report Notes</p>
            <textarea rows={4} value={orderNotes} onChange={e => setOrderNotes(e.target.value)}
              placeholder="General comments, clinical correlation, or overall interpretation…"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[12px] outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 resize-none" />
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving || !canSave}
            className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save & Complete</>}
          </button>
          {!canSave && (
            <p className="text-[11px] text-amber-500 text-center">
              Every field must have a name and value before saving
            </p>
          )}
        </div>

        {/* ── Right: per-test dynamic result entry ─────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
          {testResults.map((t, ti) => {
            const isOpen = expanded[ti] !== false;
            const preset = getPreset(t.testName);
            const hasAbnormal = t.fields.some(f => f.flag !== 'normal');

            return (
              <div key={ti} className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">

                {/* Test header */}
                <button onClick={() => setExpanded(prev => ({ ...prev, [ti]: !isOpen }))}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-white">{t.testName}</p>
                    <p className="text-[11px] text-slate-400">{t.fields.length} field{t.fields.length !== 1 ? 's' : ''}</p>
                  </div>
                  {hasAbnormal && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 shrink-0">
                      Abnormal values
                    </span>
                  )}
                  {preset && (
                    <button onClick={e => { e.stopPropagation(); loadPreset(ti); }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded text-[11px] font-semibold hover:bg-violet-100 transition-colors shrink-0">
                      <Sparkles className="w-3 h-3" /> Preset
                    </button>
                  )}
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 space-y-3 pt-3">

                    {/* Column headers */}
                    <div className="grid grid-cols-12 gap-2">
                      <p className={`${sectionTitle} col-span-3`}>Field Name *</p>
                      <p className={`${sectionTitle} col-span-2`}>Value *</p>
                      <p className={`${sectionTitle} col-span-2`}>Unit</p>
                      <p className={`${sectionTitle} col-span-3`}>Reference Range</p>
                      <p className={`${sectionTitle} col-span-1`}>Flag</p>
                      <span className="col-span-1" />
                    </div>

                    {/* Field rows */}
                    {t.fields.map((f, fi) => (
                      <div key={fi} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <input value={f.name} onChange={e => setField(ti, fi, 'name', e.target.value)}
                            placeholder="e.g. WBC" className={inputCls} />
                        </div>
                        <div className="col-span-2">
                          <input value={f.value} onChange={e => setField(ti, fi, 'value', e.target.value)}
                            placeholder="7.2" className={inputCls} />
                        </div>
                        <div className="col-span-2">
                          <input value={f.unit} onChange={e => setField(ti, fi, 'unit', e.target.value)}
                            placeholder="x10⁹/L" className={inputCls} />
                        </div>
                        <div className="col-span-3">
                          <input value={f.referenceRange} onChange={e => setField(ti, fi, 'referenceRange', e.target.value)}
                            placeholder="4.0 – 11.0" className={inputCls} />
                        </div>
                        {/* Flag selector */}
                        <div className="col-span-1">
                          <select value={f.flag} onChange={e => setField(ti, fi, 'flag', e.target.value as ResultFlag)}
                            className={cn('w-full px-1.5 py-1.5 rounded text-[11px] font-semibold border outline-none cursor-pointer',
                              f.flag === 'normal'   && 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700',
                              f.flag === 'abnormal' && 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700',
                              f.flag === 'critical' && 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700',
                            )}>
                            <option value="normal">N</option>
                            <option value="abnormal">A</option>
                            <option value="critical">C</option>
                          </select>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {t.fields.length > 1 && (
                            <button onClick={() => removeField(ti, fi)}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add field */}
                    <button onClick={() => addField(ti)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors mt-1">
                      <Plus className="w-3.5 h-3.5" /> Add Field
                    </button>

                    {/* Per-test interpretation notes */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className={`${sectionTitle} mb-1.5`}>Interpretation / Comments (optional)</p>
                      <textarea rows={2} value={t.notes ?? ''} onChange={e => setTestNotes(ti, e.target.value)}
                        placeholder={`e.g. Mild lymphocytosis — suggest clinical correlation`}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[12px] outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 resize-none" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EnterResults;
