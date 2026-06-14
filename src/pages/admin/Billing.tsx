import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, TrendingUp, Clock, AlertCircle, CheckCircle2, XCircle,
  CreditCard, ChevronDown, ChevronUp, Search, X, Banknote, Building2, Wallet,
  Loader2, Plus, Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import type { Invoice, InvoiceStatus, Patient, PaymentMethod, InvoiceItem } from '@/types';
import { toast } from 'sonner';
import {
  listInvoices, updateInvoice, createInvoice,
  listPatients, createNotification,
} from '@/lib/services';

const STATUS_CFG: Record<InvoiceStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pending:        { label: 'Pending',    bg: 'bg-amber-50 dark:bg-amber-900/20',    text: 'text-amber-600',   icon: Clock },
  paid:           { label: 'Paid',       bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-600', icon: CheckCircle2 },
  partially_paid: { label: 'Partial',    bg: 'bg-blue-50 dark:bg-blue-900/20',      text: 'text-blue-600',    icon: CreditCard },
  overdue:        { label: 'Overdue',    bg: 'bg-red-50 dark:bg-red-900/20',        text: 'text-red-600',     icon: AlertCircle },
  cancelled:      { label: 'Cancelled',  bg: 'bg-slate-100 dark:bg-slate-800',      text: 'text-slate-400',   icon: XCircle },
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'cash',          label: 'Cash',          icon: Banknote },
  { value: 'card',          label: 'Card',          icon: CreditCard },
  { value: 'insurance',     label: 'Insurance',     icon: Building2 },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Wallet },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildMonthlyData(invoices: Invoice[]): { month: string; revenue: number }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const revenue = invoices
      .filter(inv => inv.status === 'paid' && inv.paidAt)
      .reduce((sum, inv) => {
        const paid = new Date(inv.paidAt!);
        if (paid.getFullYear() === year && paid.getMonth() + 1 === month) {
          return sum + inv.amountPaid;
        }
        return sum;
      }, 0);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue,
    };
  });
}

// ─── Mark Paid Modal ──────────────────────────────────────────────────────────

interface MarkPaidModalProps {
  invoice: Invoice | null;
  patient: Patient | undefined;
  onClose: () => void;
  onPaid: () => void;
}

const MarkPaidModal: React.FC<MarkPaidModalProps> = ({ invoice, patient, onClose, onPaid }) => {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [saving, setSaving] = useState(false);

  if (!invoice) return null;

  const handlePay = async () => {
    setSaving(true);
    try {
      await updateInvoice(invoice.id, {
        status: 'paid',
        paymentMethod: method,
        paidAt: new Date().toISOString(),
        amountPaid: invoice.total,
      });
      if (patient?.userId) {
        await createNotification({
          user_id: patient.userId,
          type: 'billing',
          title: 'Payment Received',
          message: `Invoice ${invoice.invoiceNumber} of ${fmtMoney(invoice.total)} has been paid.`,
        });
      }
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
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !saving && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">Collect Payment</h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{invoice.invoiceNumber}</p>
                <p className="text-2xl font-semibold text-blue-600 mt-1">{fmtMoney(invoice.total)}</p>
                {patient && <p className="text-xs text-slate-500 mt-1">{patient.firstName} {patient.lastName}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.value} onClick={() => setMethod(m.value)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all',
                        method === m.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-600 hover:border-blue-500/30'
                      )}>
                      <m.icon className="w-3.5 h-3.5" /> {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} disabled={saving}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button onClick={handlePay} disabled={saving}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
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

// ─── Create Invoice Modal ─────────────────────────────────────────────────────

interface CreateInvoiceModalProps {
  open: boolean;
  patients: Patient[];
  onClose: () => void;
  onCreated: () => void;
}

const EMPTY_ITEM = (): InvoiceItem => ({ description: '', quantity: 1, unitPrice: 0, total: 0 });

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ open, patients, onClose, onCreated }) => {
  const [patientId, setPatientId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([EMPTY_ITEM()]);
  const [taxPct, setTaxPct] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPatientId(patients[0]?.id || '');
      setItems([EMPTY_ITEM()]);
      setTaxPct(0);
      setDiscount(0);
      setDueDate('');
      setNotes('');
    }
  }, [open, patients]);

  const subtotal = items.reduce((s, it) => s + it.total, 0);
  const taxAmt = +(subtotal * taxPct / 100).toFixed(2);
  const total = +(subtotal + taxAmt - discount).toFixed(2);

  const updateItem = (idx: number, field: keyof InvoiceItem, val: string | number) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = +(updated.quantity * updated.unitPrice).toFixed(2);
      }
      return updated;
    }));
  };

  const handleSubmit = async () => {
    if (!patientId) return toast.error('Select a patient');
    const validItems = items.filter(it => it.description.trim());
    if (!validItems.length) return toast.error('Add at least one line item');
    if (!dueDate) return toast.error('Set a due date');
    setSaving(true);
    try {
      await createInvoice({
        patientId,
        items: validItems,
        subtotal,
        tax: taxAmt,
        discount,
        total,
        amountPaid: 0,
        status: 'pending',
        dueDate,
        notes: notes || undefined,
      });
      toast.success('Invoice created');
      onCreated();
      onClose();
    } catch {
      toast.error('Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => !saving && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h3 className="font-semibold text-slate-900 dark:text-white">New Invoice</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">Patient</label>
                <select
                  value={patientId} onChange={e => setPatientId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none"
                >
                  <option value="">Select patient…</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">Due Date</label>
                <input
                  type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Line Items</label>
                <button
                  onClick={() => setItems(prev => [...prev, EMPTY_ITEM()])}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span className="col-span-5">Description</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Unit Price</span>
                  <span className="col-span-2 text-right">Total</span>
                  <span className="col-span-1" />
                </div>
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      value={it.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      placeholder="Service / item"
                      className="col-span-5 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none"
                    />
                    <input
                      type="number" min="1" value={it.quantity}
                      onChange={e => updateItem(idx, 'quantity', +e.target.value || 1)}
                      className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-center outline-none"
                    />
                    <input
                      type="number" min="0" step="0.01" value={it.unitPrice}
                      onChange={e => updateItem(idx, 'unitPrice', +e.target.value || 0)}
                      className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-right outline-none"
                    />
                    <span className="col-span-2 text-sm font-semibold text-right text-slate-700 dark:text-slate-300">
                      {fmtMoney(it.total)}
                    </span>
                    <button
                      onClick={() => items.length > 1 && setItems(prev => prev.filter((_, i) => i !== idx))}
                      disabled={items.length === 1}
                      className="col-span-1 flex items-center justify-center text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">Tax (%)</label>
                <input
                  type="number" min="0" max="100" value={taxPct}
                  onChange={e => setTaxPct(+e.target.value || 0)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">Discount ($)</label>
                <input
                  type="number" min="0" step="0.01" value={discount}
                  onChange={e => setDiscount(+e.target.value || 0)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">Notes (optional)</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none resize-none"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="font-semibold">{fmtMoney(subtotal)}</span></div>
              {taxPct > 0 && <div className="flex justify-between text-slate-500"><span>Tax ({taxPct}%)</span><span className="font-semibold">{fmtMoney(taxAmt)}</span></div>}
              {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="font-semibold">-{fmtMoney(discount)}</span></div>}
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5 font-semibold text-slate-900 dark:text-white">
                <span>Total</span><span className="text-blue-600 text-base">{fmtMoney(total)}</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
            <button onClick={onClose} disabled={saving}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...</> : 'Create Invoice'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Invoice Row ──────────────────────────────────────────────────────────────

interface InvoiceRowProps {
  invoice: Invoice;
  patient: Patient | undefined;
  onMarkPaid: (inv: Invoice) => void;
  expanded: boolean;
  onToggle: () => void;
}

const InvoiceRow: React.FC<InvoiceRowProps> = ({ invoice, patient, onMarkPaid, expanded, onToggle }) => {
  const cfg = STATUS_CFG[invoice.status];
  const isActionable = invoice.status === 'pending' || invoice.status === 'overdue';

  return (
    <div className="glass-card rounded-md overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
            <cfg.icon className={cn('w-4 h-4', cfg.text)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{invoice.invoiceNumber}</span>
              <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase', cfg.bg, cfg.text)}>
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-bold truncate">
              {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'} · {fmtDate(invoice.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold text-slate-900 dark:text-white hidden sm:block">{fmtMoney(invoice.total)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <div className="space-y-1">
                {invoice.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{it.description} <span className="text-slate-400">×{it.quantity}</span></span>
                    <span className="font-bold text-slate-900 dark:text-white">{fmtMoney(it.total)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1">
                <div className="flex justify-between text-xs"><span className="text-slate-400">Subtotal</span><span className="font-bold">{fmtMoney(invoice.subtotal)}</span></div>
                {invoice.tax > 0 && <div className="flex justify-between text-xs"><span className="text-slate-400">Tax</span><span className="font-bold">{fmtMoney(invoice.tax)}</span></div>}
                {invoice.discount > 0 && <div className="flex justify-between text-xs"><span className="text-slate-400">Discount</span><span className="font-bold text-emerald-600">-{fmtMoney(invoice.discount)}</span></div>}
                <div className="flex justify-between"><span className="text-sm font-semibold">Total</span><span className="text-sm font-semibold text-blue-600">{fmtMoney(invoice.total)}</span></div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Due: {invoice.dueDate ? fmtDate(invoice.dueDate) : '—'}</span>
                {invoice.paidAt && <span className="text-emerald-600 font-bold">Paid: {fmtDate(invoice.paidAt)}</span>}
                {invoice.paymentMethod && <span className="capitalize font-bold">{invoice.paymentMethod.replace('_', ' ')}</span>}
              </div>
              {isActionable && (
                <button
                  onClick={() => onMarkPaid(invoice)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-md text-xs font-semibold uppercase tracking-widest hover:bg-emerald-700 transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Collect Payment
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

const AdminBilling: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<Invoice | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [chartData, setChartData] = useState<{ month: string; revenue: number }[]>([]);

  // suppress unused warning — user kept for future role checks
  void user;

  const loadData = useCallback(async () => {
    try {
      const [invs, pats] = await Promise.all([
        listInvoices({ limit: 1000 }),
        listPatients({ limit: 1000 }),
      ]);
      const today = new Date().toISOString().split('T')[0];
      const overdueUpdates = invs
        .filter(inv => inv.status === 'pending' && inv.dueDate && inv.dueDate < today)
        .map(inv => updateInvoice(inv.id, { status: 'overdue' }));
      if (overdueUpdates.length) await Promise.all(overdueUpdates);

      const refreshed = overdueUpdates.length ? await listInvoices({ limit: 1000 }) : invs;
      const sorted = refreshed.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setInvoices(sorted);
      setPatients(pats);
      setChartData(buildMonthlyData(sorted));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const paid = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending' || i.status === 'partially_paid');
    const overdue = invoices.filter(i => i.status === 'overdue');
    return {
      totalRevenue: paid.reduce((s, i) => s + i.amountPaid, 0),
      pendingAmt: pending.reduce((s, i) => s + i.total, 0),
      overdueCount: overdue.length,
      paidToday: invoices.filter(i => i.paidAt?.startsWith(today)).length,
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

  const markPaidPatient = useMemo(
    () => patients.find(p => p.id === markPaidTarget?.patientId),
    [patients, markPaidTarget],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <MarkPaidModal
        invoice={markPaidTarget}
        patient={markPaidPatient}
        onClose={() => setMarkPaidTarget(null)}
        onPaid={loadData}
      />
      <CreateInvoiceModal
        open={showCreate}
        patients={patients}
        onClose={() => setShowCreate(false)}
        onCreated={loadData}
      />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Billing Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Revenue analytics and invoice management</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Revenue', value: fmtMoney(stats.totalRevenue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Outstanding', value: fmtMoney(stats.pendingAmt), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Overdue', value: stats.overdueCount, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Paid Today', value: stats.paidToday, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 rounded-md flex items-center gap-4">
            <div className={cn('w-11 h-11 rounded-md flex items-center justify-center shrink-0', s.bg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-6 rounded-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Monthly Revenue</h2>
            <p className="text-xs text-slate-400 font-bold mt-0.5">Last 6 months (paid invoices)</p>
          </div>
          <div className="w-10 h-10 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip
              contentStyle={{ background: 'var(--tooltip-bg, #1e293b)', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700 }}
              formatter={(v) => [fmtMoney(Number(v ?? 0)), 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-52 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patient or invoice…"
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
          className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-bold outline-none cursor-pointer text-slate-600 dark:text-slate-300"
        >
          <option value="all">All Statuses</option>
          {(Object.keys(STATUS_CFG) as InvoiceStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CFG[s].label}</option>
          ))}
        </select>
        {(search || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); }}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold text-slate-500 hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
        <span className="px-4 py-3 text-xs font-bold text-slate-400 self-center">
          {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 rounded-lg text-center">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">No invoices found</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all"
          >
            Create First Invoice
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => (
            <InvoiceRow
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

export default AdminBilling;
