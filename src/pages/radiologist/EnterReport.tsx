import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ScanLine, Save, ArrowLeft, AlertTriangle, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { getLabOrder, updateLabOrder, getPatient, getStaff } from '@/lib/services';
import type { LabOrder, LabResult, ResultFlag, Patient, Staff } from '@/types';

const FLAG_CFG: Record<ResultFlag, { color: string; label: string }> = {
  normal:   { color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20', label: 'Normal' },
  abnormal: { color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',       label: 'Abnormal' },
  critical: { color: 'bg-red-50 text-red-600 dark:bg-red-900/20',             label: 'Critical' },
};

const IMAGING_CATEGORIES = ['radiology', 'imaging', 'xray', 'mri', 'ct', 'ultrasound'];
function isImagingOrder(o: LabOrder) {
  return o.category ? IMAGING_CATEGORIES.includes(o.category.toLowerCase()) : false;
}

const EnterReport: React.FC = () => {
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

  const [results, setResults]       = useState<LabResult[]>([]);
  const [impression, setImpression] = useState('');

  useEffect(() => {
    if (!orderId) { setNotFound(true); setLoading(false); return; }
    getLabOrder(orderId)
      .then(async o => {
        setOrder(o);
        setResults(o.tests.map(t => ({
          testName: t, value: '', unit: '', referenceRange: 'Normal', flag: 'normal' as ResultFlag,
        })));
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
      <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
    </div>
  );

  if (notFound || !order) return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-16 text-center bg-white dark:bg-slate-900">
      <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
      <p className="text-slate-400 font-medium mb-4">Imaging order not found.</p>
      <Link to="/radiology/queue" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">Back to queue</Link>
    </div>
  );

  if (!isImagingOrder(order)) return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-16 text-center bg-white dark:bg-slate-900">
      <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
      <p className="text-slate-400 font-medium mb-2">This is a pathology order, not an imaging study.</p>
      <Link to={`/lab/results?id=${order.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
        Open in Lab →
      </Link>
    </div>
  );

  const setResult = (i: number, k: keyof LabResult, v: string) =>
    setResults(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  const canSave = results.every(r => r.value.trim() !== '');

  const handleSave = async () => {
    if (!user) return;
    if (!canSave) { toast.error('Please write findings for every study'); return; }
    setSaving(true);
    try {
      await updateLabOrder(order.id, {
        results,
        status:      'completed',
        completedAt: new Date().toISOString(),
        processedBy: user.id,
        notes:       impression || undefined,
      });
      toast.success(`Report saved for ${order.labNumber}`);
      navigate('/radiology/queue');
    } catch {
      toast.error('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const fieldCls    = 'w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200';
  const labelCls    = 'block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1';
  const sectionTitle = 'text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3';

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-5">
        <Link to="/radiology/queue"
          className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <ScanLine className="w-4 h-4 text-indigo-600" />
        <span className="text-[15px] font-semibold text-slate-800 dark:text-white">{order.labNumber}</span>
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded uppercase',
          order.priority === 'stat'    && 'bg-red-50 text-red-600',
          order.priority === 'urgent'  && 'bg-amber-50 text-amber-600',
          order.priority === 'routine' && 'bg-slate-100 text-slate-500')}>
          {order.priority}
        </span>
      </div>

      {/* Two-column body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0">

        {/* ── Left: order info + impression + save ────────────────────────── */}
        <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-0.5">

          {/* Patient / order info */}
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
            <p className={sectionTitle}>Order Details</p>

            {patient && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded mb-3">
                <div className="w-9 h-9 rounded bg-indigo-600 flex items-center justify-center text-white text-[12px] font-semibold shrink-0">
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-white">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-[11px] text-slate-400">{patient.patientNumber}</p>
                </div>
              </div>
            )}

            {doctor && (
              <p className="text-[12px] text-slate-500 mb-3">
                Ordered by <span className="font-medium text-slate-700 dark:text-slate-300">
                  Dr. {doctor.firstName} {doctor.lastName}
                </span>
              </p>
            )}

            <div>
              <p className={`${labelCls} mb-2`}>Studies ({order.tests.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {order.tests.map(t => (
                  <span key={t} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[11px] font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Impression */}
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4">
            <p className={sectionTitle}>Impression</p>
            <label className={labelCls}>Overall conclusion & recommendations</label>
            <textarea rows={5} value={impression} onChange={e => setImpression(e.target.value)}
              placeholder="Overall radiological impression and recommendations…"
              className={`${fieldCls} resize-none`} />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-[13px] font-medium rounded hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              : <><Save className="w-3.5 h-3.5" /> Sign & Submit Report</>}
          </button>

          {!canSave && results.length > 0 && (
            <p className="text-[11px] text-amber-500 flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3" /> Write findings for every study to submit
            </p>
          )}
        </div>

        {/* ── Right: findings entry ────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-4 flex flex-col flex-1 min-h-0">
            <p className={`${sectionTitle} mb-4`}>
              Findings
              <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] text-slate-500">
                {results.length}
              </span>
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
              {results.map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-700/60">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-white mb-2.5">{r.testName}</p>

                  <div className="mb-2.5">
                    <label className={labelCls}>Findings *</label>
                    <textarea rows={4} value={r.value} onChange={e => setResult(i, 'value', e.target.value)}
                      placeholder="Describe imaging findings…"
                      className={`${fieldCls} resize-none`} />
                  </div>

                  <div className="flex gap-1.5">
                    {(['normal', 'abnormal', 'critical'] as ResultFlag[]).map(f => (
                      <button key={f} onClick={() => setResult(i, 'flag', f)}
                        className={cn('px-3 py-1 rounded text-[11px] font-semibold border transition-colors',
                          r.flag === f
                            ? `${FLAG_CFG[f].color} border-current`
                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300')}>
                        {FLAG_CFG[f].label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterReport;
