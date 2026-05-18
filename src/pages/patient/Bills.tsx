import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, CreditCard, CheckCircle2, Clock, AlertCircle, XCircle,
  ChevronDown, ChevronUp, Banknote, Building2, Wallet, Download,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import type { Invoice, InvoiceStatus } from '../../types';

const STATUS_CFG: Record<InvoiceStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pending:        { label: 'Pending',    bg: 'bg-amber-50 dark:bg-amber-900/20',    text: 'text-amber-600',   icon: Clock },
  paid:           { label: 'Paid',       bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-600', icon: CheckCircle2 },
  partially_paid: { label: 'Partial',    bg: 'bg-blue-50 dark:bg-blue-900/20',      text: 'text-blue-600',    icon: CreditCard },
  overdue:        { label: 'Overdue',    bg: 'bg-red-50 dark:bg-red-900/20',        text: 'text-red-600',     icon: AlertCircle },
  cancelled:      { label: 'Cancelled',  bg: 'bg-slate-100 dark:bg-slate-800',      text: 'text-slate-400',   icon: XCircle },
};

const METHOD_ICONS: Record<string, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  insurance: Building2,
  bank_transfer: Wallet,
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isOverdue(inv: Invoice) {
  return inv.status === 'pending' && inv.dueDate < new Date().toISOString().split('T')[0];
}

interface BillCardProps {
  invoice: Invoice;
  expanded: boolean;
  onToggle: () => void;
}

const BillCard: React.FC<BillCardProps> = ({ invoice, expanded, onToggle }) => {
  const effectiveStatus: InvoiceStatus = isOverdue(invoice) ? 'overdue' : invoice.status;
  const cfg = STATUS_CFG[effectiveStatus];
  const MethodIcon = invoice.paymentMethod ? (METHOD_ICONS[invoice.paymentMethod] ?? Receipt) : null;

  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', cfg.bg)}>
            <cfg.icon className={cn('w-5 h-5', cfg.text)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-slate-900 dark:text-white">{invoice.invoiceNumber}</p>
              <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase', cfg.bg, cfg.text)}>
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-bold">
              Issued {fmtDate(invoice.createdAt)}
              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <> · Due {fmtDate(invoice.dueDate)}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-black text-slate-900 dark:text-white">{fmtMoney(invoice.total)}</span>
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
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <div className="space-y-1.5">
                {invoice.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {it.description}
                      {it.quantity > 1 && <span className="text-slate-400"> ×{it.quantity}</span>}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{fmtMoney(it.total)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Subtotal</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{fmtMoney(invoice.subtotal)}</span>
                </div>
                {invoice.tax > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">Tax</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{fmtMoney(invoice.tax)}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">Discount</span>
                    <span className="font-bold text-emerald-600">-{fmtMoney(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="text-sm font-black text-slate-900 dark:text-white">Total</span>
                  <span className="text-sm font-black text-blue-600">{fmtMoney(invoice.total)}</span>
                </div>
              </div>

              {invoice.status === 'paid' && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                      Paid {invoice.paidAt ? fmtDate(invoice.paidAt) : ''}
                    </span>
                  </div>
                  {MethodIcon && invoice.paymentMethod && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 capitalize">
                      <MethodIcon className="w-3.5 h-3.5" />
                      {invoice.paymentMethod.replace('_', ' ')}
                    </div>
                  )}
                </div>
              )}

              {(invoice.status === 'pending' || isOverdue(invoice)) && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    {isOverdue(invoice)
                      ? 'This invoice is overdue. Please contact reception to settle your balance.'
                      : `Payment due by ${fmtDate(invoice.dueDate)}. Visit reception to pay.`}
                  </p>
                </div>
              )}

              {invoice.notes && (
                <p className="text-xs text-slate-400 italic">{invoice.notes}</p>
              )}

              <button
                onClick={() => {
                  const lines = [
                    `Invoice: ${invoice.invoiceNumber}`,
                    `Date: ${fmtDate(invoice.createdAt)}`,
                    `Status: ${effectiveStatus}`,
                    '',
                    'Items:',
                    ...invoice.items.map(it => `  ${it.description} x${it.quantity} — ${fmtMoney(it.total)}`),
                    '',
                    `Subtotal: ${fmtMoney(invoice.subtotal)}`,
                    invoice.tax > 0 ? `Tax: ${fmtMoney(invoice.tax)}` : '',
                    invoice.discount > 0 ? `Discount: -${fmtMoney(invoice.discount)}` : '',
                    `Total: ${fmtMoney(invoice.total)}`,
                  ].filter(Boolean).join('\n');
                  const blob = new Blob([lines], { type: 'text/plain' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `${invoice.invoiceNumber}.txt`;
                  a.click();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <Download className="w-4 h-4" /> Download Receipt
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Bills: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const all = db.invoices.getByPatient(user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setInvoices(all);
    }
  }, [user]);

  const stats = useMemo(() => {
    const paid = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending' || i.status === 'partially_paid');
    const overdue = invoices.filter(i => isOverdue(i));
    return {
      totalPaid: paid.reduce((s, i) => s + i.amountPaid, 0),
      pendingAmt: pending.reduce((s, i) => s + i.total, 0),
      overdueCount: overdue.length,
      invoiceCount: invoices.length,
    };
  }, [invoices]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    if (statusFilter === 'overdue') return invoices.filter(i => isOverdue(i));
    return invoices.filter(i => i.status === statusFilter);
  }, [invoices, statusFilter]);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Bills</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Your invoices and payment history</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Paid', value: fmtMoney(stats.totalPaid), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Outstanding', value: fmtMoney(stats.pendingAmt), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Overdue', value: stats.overdueCount, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Total Invoices', value: stats.invoiceCount, icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl flex items-center gap-4">
            <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', s.bg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'paid', 'overdue', 'partially_paid', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
              statusFilter === s
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-300'
            )}
          >
            {s === 'partially_paid' ? 'Partial' : s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Bills list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">
            {invoices.length === 0 ? 'No bills yet' : 'No bills match this filter'}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {filtered.map(inv => (
            <BillCard
              key={inv.id}
              invoice={inv}
              expanded={expandedId === inv.id}
              onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
            />
          ))}
        </motion.div>
      )}

      {invoices.length === 0 && (
        <div className="glass-card p-6 rounded-3xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-black text-slate-900 dark:text-white text-sm">No bills on record</p>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Invoices from your visits will appear here once generated by reception.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;
