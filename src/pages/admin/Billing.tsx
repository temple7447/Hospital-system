import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, TrendingUp, Clock, AlertCircle, CheckCircle2, XCircle,
  CreditCard, ChevronDown, ChevronUp, Search, X, Banknote, Building2, Wallet,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import type { Invoice, InvoiceStatus, Patient, PaymentMethod } from '@/types';
import { toast } from 'sonner';
import { listInvoices, updateInvoice, listPatients, createNotification } from '@/lib/services';

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
  onClose: () => void;
  onPaid: () => void;
  userId: string;
}

const MarkPaidModal: React.FC<MarkPaidModalProps> = ({ invoice, onClose, onPaid, userId }) => {
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
      await createNotification({
        user_id: invoice.patientId,
        type: 'billing',
        title: 'Payment Received',
        message: `Invoice ${invoice.invoiceNumber} has been paid.`,
      });
      onPaid();
      onClose();
      toast.success('Payment recorded');
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
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-lg  overflow-hidden"
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
                  className="flex-2 py-3 bg-emerald-600 text-white rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
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
                <span>Due: {fmtDate(invoice.dueDate)}</span>
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<Invoice | null>(null);
  const [chartData, setChartData] = useState<{ month: string; revenue: number }[]>([]);

  const loadData = useCallback(async () => {
    const [invs, pats] = await Promise.all([listInvoices(), listPatients()]);
    const sorted = invs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setInvoices(sorted);
    setPatients(pats);
    setChartData(buildMonthlyData(sorted));
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

  return (
    <div className="space-y-8">
      <MarkPaidModal invoice={markPaidTarget} onClose={() => setMarkPaidTarget(null)} onPaid={loadData} userId={user!.id} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Billing Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Revenue analytics and invoice management</p>
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
              formatter={(v: number) => [fmtMoney(v), 'Revenue']}
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
            placeholder="Search patient or invoice..."
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
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 rounded-lg text-center">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">No invoices found</p>
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
