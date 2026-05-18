import React, { useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FlaskConical, Save, ChevronLeft, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { db, isImagingOrder } from '@/lib/db';
import type { LabResult, ResultFlag } from '@/types';

const FLAG_CFG: Record<ResultFlag, { color: string; label: string }> = {
  normal:   { color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20', label: 'Normal' },
  abnormal: { color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',       label: 'Abnormal' },
  critical: { color: 'bg-red-50 text-red-600 dark:bg-red-900/20',             label: 'Critical' },
};

const EnterResults: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get('id');
  const order = useMemo(() => orderId ? db.labOrders.getById(orderId) : null, [orderId]);

  const [results, setResults] = useState<LabResult[]>(() =>
    order ? order.tests.map(t => ({
      testName:       t,
      value:          '',
      unit:           '',
      referenceRange: '',
      flag:           'normal' as ResultFlag,
    })) : []
  );
  const [notes, setNotes] = useState(order?.notes ?? '');

  if (!order) {
    return (
      <div className="glass-card rounded-3xl p-16 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <p className="text-slate-400 font-medium mb-4">Order not found.</p>
        <Link to="/lab/queue" className="text-blue-600 hover:text-blue-700 font-black text-sm">Back to queue</Link>
      </div>
    );
  }

  if (isImagingOrder(order)) {
    return (
      <div className="glass-card rounded-3xl p-16 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <p className="text-slate-400 font-medium mb-2">This is an imaging order.</p>
        <Link to={`/radiology/report?id=${order.id}`} className="text-blue-600 hover:text-blue-700 font-black text-sm">Open in Radiology →</Link>
      </div>
    );
  }

  const patient = db.patients.getById(order.patientId);
  const doctor  = db.staff.getById(order.doctorId);

  const setResult = (i: number, k: keyof LabResult, v: string) => {
    setResults(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  };

  const handleSave = () => {
    if (!user) return;
    if (results.some(r => !r.value)) {
      toast.error('Please enter a value for every test');
      return;
    }
    db.labOrders.update(order.id, {
      results,
      status:      'completed',
      completedAt: new Date().toISOString(),
      processedBy: user.id,
      notes:       notes || undefined,
    });
    db.auditLogs.create({
      userId: user.id, userRole: user.role,
      action: 'COMPLETE_LAB_ORDER', resource: 'LabOrder', resourceId: order.id,
      details: `Completed ${order.labNumber} with ${results.length} result(s)`,
    });
    if (patient) {
      db.notifications.create({
        userId: patient.id, type: 'lab_result',
        title: 'Lab results available',
        message: `Your ${order.labNumber} results are ready.`,
        link: `/patient/lab-results`,
      });
    }
    toast.success(`Results saved for ${order.labNumber}`);
    navigate('/lab/queue');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8">
      <Link to="/lab/queue" className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-blue-600">
        <ChevronLeft className="w-4 h-4" /> Back to queue
      </Link>

      <div>
        <div className="flex items-center gap-3 mb-1">
          <FlaskConical className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{order.labNumber}</h1>
          <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide',
            order.priority === 'stat'    && 'bg-red-50 text-red-600',
            order.priority === 'urgent'  && 'bg-amber-50 text-amber-600',
            order.priority === 'routine' && 'bg-slate-100 text-slate-500')}>
            {order.priority}
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          {patient ? `${patient.firstName} ${patient.lastName} (${patient.patientNumber})` : 'Unknown patient'}
          {doctor && ` · ordered by ${db.staff.getDisplayName(doctor)}`}
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 space-y-4">
        {results.map((r, i) => (
          <div key={i} className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
            <h3 className="font-black text-slate-900 dark:text-white">{r.testName}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Value</label>
                <input type="text" value={r.value} onChange={e => setResult(i, 'value', e.target.value)}
                  placeholder="e.g. 7.2" className="input-field py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Unit</label>
                <input type="text" value={r.unit} onChange={e => setResult(i, 'unit', e.target.value)}
                  placeholder="mg/dL" className="input-field py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Reference</label>
                <input type="text" value={r.referenceRange} onChange={e => setResult(i, 'referenceRange', e.target.value)}
                  placeholder="< 5.7" className="input-field py-2.5 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              {(['normal', 'abnormal', 'critical'] as ResultFlag[]).map(f => {
                const cfg = FLAG_CFG[f];
                return (
                  <button key={f} onClick={() => setResult(i, 'flag', f)}
                    className={cn('px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all',
                      r.flag === f ? `${cfg.color} border-current` : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300')}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Notes (optional)</label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any relevant observations…"
            className="input-field py-3 text-sm w-full resize-none" />
        </div>
      </div>

      <button onClick={handleSave}
        className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-sm font-bold">
        <Save className="w-4 h-4" /> Save & Mark Completed
      </button>
    </motion.div>
  );
};

export default EnterResults;
