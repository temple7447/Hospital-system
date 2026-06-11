import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, CreditCard, Banknote, Building2, Wallet,
  ChevronDown, ChevronUp, CheckCircle2, Clock, AlertCircle,
  Trash2, Loader2, Receipt, User, XCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import {
  listInvoices,
  createInvoice,
  updateInvoice,
  listPatients,
  listAppointments,
} from '@/lib/services';
import type { Invoice, InvoiceStatus, PaymentMethod, Patient, Appointment, InvoiceItem } from '@/types';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<InvoiceStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pending:        { label: 'Pending',       bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-600',   icon: Clock },
  paid:           { label: 'Paid',          bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-600', icon: CheckCircle2 },
  partially_paid: { label: 'Partial',       bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-600',    icon: CreditCard },
  overdue:        { label: 'Overdue',       bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-600',     icon: AlertCircle },
  cancelled:      { label: 'Cancelled',     bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-400',   icon: XCircle },
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'cash',         label: 'Cash',         icon: Banknote },
  { value: 'card',         label: 'Card',         icon: CreditCard },
  { value: 'insurance',    label: 'Insurance',    icon: Building2 },
  { value: 'bank_transfer',label: 'Bank Transfer',icon: Wallet },
];

const PRESET_ITEMS: Record<string, { description: string; unitPrice: number }[]> = {
  consultation: [{ description: 'Consultation Fee', unitPrice: 75 }],
  check_up:     [{ description: 'Medical Check-up', unitPrice: 50 }, { description: 'Consultation Fee', unitPrice: 30 }],
  follow_up:    [{ description: 'Follow-up Consultation', unitPrice: 50 }],
  emergency:    [{ description: 'Emergency Visit Fee', unitPrice: 200 }, { description: 'Consultation Fee', unitPrice: 75 }],
  procedure:    [{ description: 'Medical Procedure', unitPrice: 150 }, { description: 'Consultation Fee', unitPrice: 50 }],
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function futureDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function emptyItem(): InvoiceItem {
  return { description: '', quantity: 1, unitPrice: 0, total: 0 };
}

// ─── Create Invoice Modal ─────────────────────────────────────────────────────

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ open, onClose, onCreated }) => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [aptId, setAptId] = useState('');
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [aptOptions, setAptOptions] = useState<Appointment[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [taxRate, setTaxRate] = useState(10);
  const [discount, setDiscount] = useState(0);
  const [dueInDays, setDueInDays] = useState(30);
  const [payNow, setPayNow] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setStep(0); setPatientId(''); setPatientSearch(''); setPatient(null);
      setAptId(''); setItems([emptyItem()]); setTaxRate(10); setDiscount(0);
      setPayNow(false); setPayMethod('cash'); setNotes(''); setDueInDays(30);
      listPatients().then(setAllPatients).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (!patientId) return;
    const p = allPatients.find(pt => pt.id === patientId) ?? null;
    setPatient(p);
    if (p) {
      setPatientSearch(`${p.firstName} ${p.lastName}`);
      listAppointments({ patient_id: patientId })
        .then(apts => {
          const filtered = apts
            .filter(a => a.status === 'completed' || a.status === 'confirmed')
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 8);
          setAptOptions(filtered);
        })
        .catch(() => {});
    }
  }, [patientId, allPatients]);

  useEffect(() => {
    if (aptId) {
      const apt = aptOptions.find(a => a.id === aptId);
      if (apt && PRESET_ITEMS[apt.type]) {
        setItems(PRESET_ITEMS[apt.type].map(p => ({ ...p, quantity: 1, total: p.unitPrice })));
      }
    }
  }, [aptId, aptOptions]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.toLowerCase();
    return allPatients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.patientNumber.toLowerCase().includes(q)
    ).slice(0, 7);
  }, [allPatients, patientSearch]);

  const updateItem = (i: number, field: keyof InvoiceItem, val: string | number) => {
    setItems(prev => prev.map((it, idx) => {
      if (idx !== i) return it;
      const updated = { ...it, [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = Number(updated.quantity) * Number(updated.unitPrice);
      }
      return updated;
    }));
  };

  const subtotal = items.reduce((s, it) => s + it.total, 0);
  const taxAmt = subtotal * (taxRate / 100);
  const total = subtotal + taxAmt - discount;
  const canStep0 = patientId !== '';
  const canStep1 = items.every(it => it.description.trim() && it.unitPrice > 0 && it.quantity > 0);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await createInvoice({
        patientId,
        appointmentId: aptId || undefined,
        items,
        subtotal,
        tax: taxAmt,
        discount,
        total,
        amountPaid: payNow ? total : 0,
        status: payNow ? 'paid' : 'pending',
        paymentMethod: payNow ? payMethod : undefined,
        notes: notes.trim() || undefined,
        dueDate: futureDays(dueInDays),
        paidAt: payNow ? new Date().toISOString() : undefined,
      });
      onCreated();
      onClose();
      toast.success(payNow ? 'Invoice created and paid' : 'Invoice created');
    } catch {
      toast.error('Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const STEPS = ['Patient', 'Line Items', 'Payment'];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => !saving && onClose()}>
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-lg  overflow-hidden max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">New Invoice</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">Step {step + 1} of {STEPS.length}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1.5 px-6 pt-4 shrink-0">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1">
                <div className={cn('h-1 rounded-full transition-all', i < step ? 'bg-emerald-500' : i === step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700')} />
                <p className={cn('text-[9px] font-semibold uppercase tracking-wider mt-1', i === step ? 'text-blue-600' : 'text-slate-400')}>{s}</p>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Step 0: Patient */}
            {step === 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={patientSearch}
                    onChange={e => { setPatientSearch(e.target.value); if (!e.target.value) { setPatientId(''); setPatient(null); } }}
                    placeholder="Search patient..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                </div>

                {patientSearch && !patient && filteredPatients.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    {filteredPatients.map(p => (
                      <button key={p.id} onClick={() => setPatientId(p.id)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-semibold shrink-0">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        {p.firstName} {p.lastName}
                        <span className="text-slate-400 font-normal text-xs">{p.patientNumber}</span>
                      </button>
                    ))}
                  </div>
                )}

                {patient && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shrink-0">
                      {patient.firstName[0]}{patient.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</p>
                      <p className="text-xs text-slate-400 font-bold">{patient.patientNumber} · {patient.phone}</p>
                      {patient.insuranceProvider && (
                        <p className="text-xs text-blue-600 font-bold mt-0.5">Insured: {patient.insuranceProvider}</p>
                      )}
                    </div>
                  </div>
                )}

                {aptOptions.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Link to Appointment (auto-fills items)</label>
                    <select value={aptId} onChange={e => setAptId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm outline-none cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                      <option value="">No link</option>
                      {aptOptions.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.date} — {a.type.replace('_', ' ')} ({a.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Optional notes..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm outline-none resize-none font-medium" />
                </div>
              </motion.div>
            )}

            {/* Step 1: Line Items */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                <div className="grid grid-cols-12 gap-2 px-1">
                  <div className="col-span-5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Description</div>
                  <div className="col-span-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">Qty</div>
                  <div className="col-span-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">Unit Price</div>
                  <div className="col-span-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">Total</div>
                </div>

                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input type="text" value={it.description} onChange={e => updateItem(i, 'description', e.target.value)}
                      placeholder="Service description"
                      className="col-span-5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                    <input type="number" min="1" value={it.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                      className="col-span-2 px-2 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-center" />
                    <input type="number" min="0" step="0.01" value={it.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))}
                      className="col-span-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium text-right" />
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{fmtMoney(it.total)}</span>
                      {items.length > 1 && (
                        <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}
                          className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button onClick={() => setItems(p => [...p, emptyItem()])}
                  className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-all py-1">
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500">Subtotal</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmtMoney(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-slate-500">Tax (%)</span>
                    <input type="number" min="0" max="100" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
                      className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm outline-none font-bold text-right" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-slate-500">Discount ($)</span>
                    <input type="number" min="0" value={discount} onChange={e => setDiscount(Number(e.target.value))}
                      className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm outline-none font-bold text-right" />
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                    <span className="text-base font-semibold text-slate-900 dark:text-white">Total</span>
                    <span className="text-xl font-semibold text-blue-600">{fmtMoney(total)}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-bold">Patient</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{patient?.firstName} {patient?.lastName}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-500 font-bold">Amount Due</span>
                    <span className="font-semibold text-xl text-blue-600">{fmtMoney(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-500 font-bold">Items</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Due Date</label>
                  <select value={dueInDays} onChange={e => setDueInDays(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm outline-none cursor-pointer font-medium">
                    <option value={7}>Due in 7 days ({fmtDate(futureDays(7))})</option>
                    <option value={14}>Due in 14 days ({fmtDate(futureDays(14))})</option>
                    <option value={30}>Due in 30 days ({fmtDate(futureDays(30))})</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Collect Payment Now?</label>
                    <button onClick={() => setPayNow(p => !p)}
                      className={cn('relative w-11 h-6 rounded-full transition-colors', payNow ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700')}>
                      <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all', payNow ? 'left-5' : 'left-0.5')} />
                    </button>
                  </div>
                </div>

                {payNow && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map(m => (
                        <button key={m.value} onClick={() => setPayMethod(m.value)}
                          className={cn('flex items-center gap-3 px-4 py-3 rounded-md border-2 transition-all text-sm font-bold',
                            payMethod === m.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-500/30'
                          )}>
                          <m.icon className="w-4 h-4" /> {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {payNow && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Collecting {fmtMoney(total)} via {PAYMENT_METHODS.find(m => m.value === payMethod)?.label}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3 shrink-0 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button onClick={() => step === 0 ? onClose() : setStep(s => s - 1)} disabled={saving}
              className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < 2 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={(step === 0 && !canStep0) || (step === 1 && !canStep1)}
                className="flex-2 py-3.5 bg-blue-600 text-white rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50">
                Next
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving}
                className="flex-2 py-3.5 bg-blue-600 text-white rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : payNow ? 'Create & Mark Paid' : 'Create Invoice'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Mark Paid Modal ──────────────────────────────────────────────────────────

interface MarkPaidModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onPaid: () => void;
}

const MarkPaidModal: React.FC<MarkPaidModalProps> = ({ invoice, onClose, onPaid }) => {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [saving, setSaving] = useState(false);

  if (!invoice) return null;

  const handlePay = async () => {
    setSaving(true);
    try {
      await updateInvoice(invoice.id, {
        status: 'paid',
        paymentMethod: method,
        amountPaid: invoice.total,
        paidAt: new Date().toISOString(),
      });
      onPaid();
      onClose();
      toast.success('Payment recorded');
    } catch {
      toast.error('Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {invoice && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !saving && onClose()}>
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-lg  overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">Collect Payment</h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{invoice.invoiceNumber}</p>
                <p className="text-2xl font-semibold text-blue-600 mt-1">{fmtMoney(invoice.total)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.value} onClick={() => setMethod(m.value)}
                      className={cn('flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all',
                        method === m.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-600 hover:border-blue-500/30')}>
                      <m.icon className="w-3.5 h-3.5" /> {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} disabled={saving} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={handlePay} disabled={saving} className="flex-2 py-3 bg-emerald-600 text-white rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</> : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Invoice Card ─────────────────────────────────────────────────────────────

interface InvoiceCardProps {
  invoice: Invoice;
  patient: Patient | undefined;
  onMarkPaid: (inv: Invoice) => void;
  expanded: boolean;
  onToggle: () => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, patient, onMarkPaid, expanded, onToggle }) => {
  const cfg = STATUS_CFG[invoice.status];
  const isActionable = invoice.status === 'pending' || invoice.status === 'overdue';
  return (
    <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
      <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors" onClick={onToggle}>
        <div className="flex items-center gap-4 min-w-0">
          <div className={cn('w-10 h-10 rounded-md flex items-center justify-center shrink-0', cfg.bg)}>
            <cfg.icon className={cn('w-5 h-5', cfg.text)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{invoice.invoiceNumber}</p>
              <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase', cfg.bg, cfg.text)}>{cfg.label}</span>
            </div>
            <p className="text-xs text-slate-400 font-bold truncate">
              {patient ? `${patient.firstName} ${patient.lastName}` : '—'} · {fmtDate(invoice.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-semibold text-slate-900 dark:text-white">{fmtMoney(invoice.total)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <div className="space-y-1">
                {invoice.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{it.description} <span className="text-slate-400">×{it.quantity}</span></span>
                    <span className="font-bold text-slate-900 dark:text-white">{fmtMoney(it.total)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1">
                <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">Subtotal</span><span className="font-bold text-slate-700 dark:text-slate-300">{fmtMoney(invoice.subtotal)}</span></div>
                {invoice.tax > 0 && <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">Tax</span><span className="font-bold text-slate-700 dark:text-slate-300">{fmtMoney(invoice.tax)}</span></div>}
                {invoice.discount > 0 && <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">Discount</span><span className="font-bold text-emerald-600">-{fmtMoney(invoice.discount)}</span></div>}
                <div className="flex justify-between"><span className="text-sm font-semibold text-slate-900 dark:text-white">Total</span><span className="text-sm font-semibold text-blue-600">{fmtMoney(invoice.total)}</span></div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Due: {fmtDate(invoice.dueDate)}</span>
                {invoice.paidAt && <span className="text-emerald-600 font-bold">Paid: {fmtDate(invoice.paidAt)}</span>}
                {invoice.paymentMethod && <span className="capitalize font-bold">{invoice.paymentMethod.replace('_', ' ')}</span>}
              </div>
              {isActionable && (
                <button onClick={() => onMarkPaid(invoice)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-md text-xs font-semibold uppercase tracking-widest hover:bg-emerald-700 transition-all">
                  <CreditCard className="w-4 h-4" /> Collect Payment
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Payment: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [markPaidTarget, setMarkPaidTarget] = useState<Invoice | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [invs, pts] = await Promise.all([
        listInvoices(),
        listPatients(),
      ]);
      invs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setInvoices(invs);
      setPatients(pts);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((s, i) => s + i.amountPaid, 0);
    return {
      totalRevenue,
      pending: invoices.filter(i => i.status === 'pending').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      todayPaid: invoices.filter(i => i.paidAt?.startsWith(today)).length,
    };
  }, [invoices]);

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const pat = patients.find(p => p.id === inv.patientId);
        const name = pat ? `${pat.firstName} ${pat.lastName}`.toLowerCase() : '';
        if (!name.includes(q) && !inv.invoiceNumber.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, search, patients]);

  return (
    <div className="space-y-8">
      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadData} />
      <MarkPaidModal invoice={markPaidTarget} onClose={() => setMarkPaidTarget(null)} onPaid={loadData} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">Billing & Payments</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Generate invoices and process payments</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors self-start">
          <Plus className="w-3.5 h-3.5" /> New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmtMoney(stats.totalRevenue), icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Paid Today', value: stats.todayPaid, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(s => (
          <div key={s.label} className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4 rounded-lg flex items-center gap-4">
            <div className={cn('w-9 h-9 rounded flex items-center justify-center shrink-0', s.bg)}>
              <s.icon className={cn('w-4 h-4', s.color)} />
            </div>
            <div>
              <p className="text-[17px] font-semibold text-slate-800 dark:text-white">{s.value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-52 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient or invoice..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-bold outline-none cursor-pointer text-slate-600 dark:text-slate-300">
          <option value="all">All Statuses</option>
          {(Object.keys(STATUS_CFG) as InvoiceStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CFG[s].label}</option>
          ))}
        </select>
        {(search || statusFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setStatusFilter('all'); }}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold text-slate-500 hover:bg-slate-200 transition-all flex items-center gap-2">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-900 p-16 text-center">
          <Receipt className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-[13px] text-slate-400">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              patient={patients.find(p => p.id === inv.patientId)}
              onMarkPaid={setMarkPaidTarget}
              expanded={expandedId === inv.id}
              onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Payment;
