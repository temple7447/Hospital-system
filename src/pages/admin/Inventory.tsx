import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Plus, Search, X, Edit2, Trash2, RotateCcw,
  AlertTriangle, TrendingDown, DollarSign, Loader2,
  Pill, Stethoscope, FlaskConical, ShoppingBag,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import type { InventoryItem, InventoryCategory } from '../../types';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<InventoryCategory, { label: string; icon: React.ElementType; bg: string; text: string }> = {
  medicine:    { label: 'Medicine',    icon: Pill,         bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-600' },
  equipment:   { label: 'Equipment',  icon: Stethoscope,  bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600' },
  consumable:  { label: 'Consumable', icon: ShoppingBag,  bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-600' },
  lab_supply:  { label: 'Lab Supply', icon: FlaskConical, bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-600' },
};

const UNITS = ['tablets', 'capsules', 'ml', 'mg', 'units', 'boxes', 'vials', 'strips', 'pieces', 'kg', 'litres'];

function fmtMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function stockLevel(item: InventoryItem): 'out' | 'low' | 'ok' {
  if (item.quantity === 0) return 'out';
  if (item.quantity <= item.minQuantity) return 'low';
  return 'ok';
}

function stockBarWidth(item: InventoryItem): number {
  if (item.quantity === 0) return 0;
  const max = Math.max(item.minQuantity * 3, item.quantity);
  return Math.min((item.quantity / max) * 100, 100);
}

// ─── Item Form Modal ──────────────────────────────────────────────────────────

interface ItemModalProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
}

const EMPTY_FORM = {
  name: '', category: 'medicine' as InventoryCategory, unit: 'tablets',
  quantity: 0, minQuantity: 10, unitPrice: 0, supplier: '',
  expiryDate: '', location: '',
};

const ItemModal: React.FC<ItemModalProps> = ({ item, open, onClose, onSaved, userId }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isEdit = item !== null;

  useEffect(() => {
    if (open) {
      setForm(item ? {
        name: item.name, category: item.category, unit: item.unit,
        quantity: item.quantity, minQuantity: item.minQuantity,
        unitPrice: item.unitPrice, supplier: item.supplier,
        expiryDate: item.expiryDate ?? '', location: item.location,
      } : EMPTY_FORM);
    }
  }, [open, item]);

  const set = (field: string, val: string | number) => setForm(f => ({ ...f, [field]: val }));

  const canSave = form.name.trim() && form.supplier.trim() && form.location.trim() && form.unitPrice > 0;

  const handleSave = () => {
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      unit: form.unit,
      quantity: Number(form.quantity),
      minQuantity: Number(form.minQuantity),
      unitPrice: Number(form.unitPrice),
      supplier: form.supplier.trim(),
      expiryDate: form.expiryDate || undefined,
      location: form.location.trim(),
      lastRestocked: new Date().toISOString().split('T')[0],
    };
    setTimeout(() => {
      if (isEdit && item) {
        db.inventory.update(item.id, payload);
        db.auditLogs.create({ userId, userRole: 'ADMIN', action: 'UPDATE', resource: 'inventory', resourceId: item.id, details: `Updated ${payload.name}` });
        toast.success('Item updated');
      } else {
        const newItem = db.inventory.create(payload);
        db.auditLogs.create({ userId, userRole: 'ADMIN', action: 'CREATE', resource: 'inventory', resourceId: newItem.id, details: `Added ${payload.name} to inventory` });
        toast.success('Item added to inventory');
      }
      setSaving(false);
      onSaved();
      onClose();
    }, 400);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => !saving && onClose()}>
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h3 className="font-black text-slate-900 dark:text-white">{isEdit ? 'Edit Item' : 'Add Item'}</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Amoxicillin 500mg"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  {(Object.keys(CATEGORY_CFG) as InventoryCategory[]).map(c => (
                    <option key={c} value={c}>{CATEGORY_CFG[c].label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</label>
                <select value={form.unit} onChange={e => set('unit', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</label>
                <input type="number" min="0" value={form.quantity} onChange={e => set('quantity', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Qty</label>
                <input type="number" min="0" value={form.minQuantity} onChange={e => set('minQuantity', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price</label>
                <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={e => set('unitPrice', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</label>
              <input type="text" value={form.supplier} onChange={e => set('supplier', e.target.value)}
                placeholder="Supplier name"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</label>
                <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                  placeholder="e.g. Pharmacy Store A"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3 shrink-0 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button onClick={onClose} disabled={saving}
              className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !canSave}
              className="flex-2 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : isEdit ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Restock Modal ────────────────────────────────────────────────────────────

interface RestockModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onRestocked: () => void;
  userId: string;
}

const RestockModal: React.FC<RestockModalProps> = ({ item, onClose, onRestocked, userId }) => {
  const [qty, setQty] = useState(50);
  const [saving, setSaving] = useState(false);

  if (!item) return null;

  const handleRestock = () => {
    setSaving(true);
    db.inventory.restock(item.id, qty);
    db.auditLogs.create({ userId, userRole: 'ADMIN', action: 'UPDATE', resource: 'inventory', resourceId: item.id, details: `Restocked ${item.name} +${qty} ${item.unit}` });
    setTimeout(() => {
      setSaving(false); onRestocked(); onClose();
      toast.success(`Restocked ${qty} ${item.unit} of ${item.name}`);
    }, 400);
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !saving && onClose()}>
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white">Restock Item</h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="font-black text-slate-900 dark:text-white">{item.name}</p>
                <p className="text-xs text-slate-400 font-bold mt-1">Current stock: {item.quantity} {item.unit}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add Quantity ({item.unit})</label>
                <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-2xl font-black outline-none focus:ring-2 focus:ring-blue-500 text-center" />
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xs font-bold text-blue-600">New total: {item.quantity + qty} {item.unit}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} disabled={saving} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={handleRestock} disabled={saving || qty <= 0} className="flex-2 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Restock'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Item Card ────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onRestock: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onEdit, onRestock, onDelete }) => {
  const cat = CATEGORY_CFG[item.category];
  const level = stockLevel(item);
  const barW = stockBarWidth(item);
  const isExpired = item.expiryDate && item.expiryDate < new Date().toISOString().split('T')[0];

  return (
    <div className={cn(
      'glass-card rounded-2xl p-5 space-y-4 transition-all',
      level === 'out' ? 'ring-2 ring-red-400/50' : level === 'low' ? 'ring-2 ring-amber-400/40' : ''
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cat.bg)}>
            <cat.icon className={cn('w-5 h-5', cat.text)} />
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">{item.name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase', cat.bg, cat.text)}>{cat.label}</span>
              {level === 'out' && <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-red-50 dark:bg-red-900/20 text-red-600">Out of Stock</span>}
              {level === 'low' && <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-900/20 text-amber-600">Low Stock</span>}
              {isExpired && <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-red-50 dark:bg-red-900/20 text-red-600">Expired</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onRestock(item)} title="Restock" className="p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600 transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onEdit(item)} title="Edit" className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-all">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(item)} title="Delete" className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stock bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">{item.quantity} {item.unit}</span>
          <span className="text-slate-400 font-medium">min {item.minQuantity}</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all',
            level === 'out' ? 'bg-red-500' : level === 'low' ? 'bg-amber-500' : 'bg-emerald-500'
          )} style={{ width: `${barW}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
        <div><span className="font-bold text-slate-600 dark:text-slate-300">{fmtMoney(item.unitPrice)}</span> / {item.unit}</div>
        <div className="text-right truncate">{item.location}</div>
        <div className="truncate">{item.supplier}</div>
        {item.expiryDate && <div className={cn('text-right font-bold', isExpired ? 'text-red-500' : '')}>{item.expiryDate}</div>}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<InventoryCategory | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);
  const [restockTarget, setRestockTarget] = useState<InventoryItem | null>(null);

  const loadData = () => setItems(db.inventory.getAll().sort((a, b) => a.name.localeCompare(b.name)));
  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => ({
    total: items.length,
    lowStock: items.filter(i => stockLevel(i) === 'low').length,
    outOfStock: items.filter(i => stockLevel(i) === 'out').length,
    totalValue: items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
  }), [items]);

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (catFilter !== 'all' && item.category !== catFilter) return false;
      if (stockFilter === 'low' && stockLevel(item) !== 'low') return false;
      if (stockFilter === 'out' && stockLevel(item) !== 'out') return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !item.supplier.toLowerCase().includes(q) && !item.location.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, catFilter, stockFilter, search]);

  const handleDelete = (item: InventoryItem) => {
    if (!window.confirm(`Delete "${item.name}" from inventory?`)) return;
    db.inventory.delete(item.id);
    db.auditLogs.create({ userId: user!.id, userRole: 'ADMIN', action: 'DELETE', resource: 'inventory', resourceId: item.id, details: `Deleted ${item.name} from inventory` });
    loadData();
    toast.success('Item removed');
  };

  return (
    <div className="space-y-8">
      <ItemModal open={showAdd} item={null} onClose={() => setShowAdd(false)} onSaved={loadData} userId={user!.id} />
      <ItemModal open={editTarget !== null} item={editTarget} onClose={() => setEditTarget(null)} onSaved={loadData} userId={user!.id} />
      <RestockModal item={restockTarget} onClose={() => setRestockTarget(null)} onRestocked={loadData} userId={user!.id} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Medicines, equipment and supplies</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 self-start">
          <Plus className="w-5 h-5" /> Add Item
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Low Stock', value: stats.lowStock, icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Out of Stock', value: stats.outOfStock, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Total Value', value: fmtMoney(stats.totalValue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
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

      {/* Low stock alert */}
      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
            {stats.outOfStock > 0 && `${stats.outOfStock} item${stats.outOfStock !== 1 ? 's' : ''} out of stock. `}
            {stats.lowStock > 0 && `${stats.lowStock} item${stats.lowStock !== 1 ? 's' : ''} below minimum threshold.`}
          </p>
        </motion.div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-52 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, supplier, location..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value as typeof stockFilter)}
            className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none cursor-pointer text-slate-600 dark:text-slate-300">
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          {(search || catFilter !== 'all' || stockFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setCatFilter('all'); setStockFilter('all'); }}
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-all flex items-center gap-2">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {(['all', ...Object.keys(CATEGORY_CFG)] as (InventoryCategory | 'all')[]).map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                catFilter === c
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-300'
              )}>
              {c === 'all' ? 'All' : CATEGORY_CFG[c as InventoryCategory].label}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">No items found</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={setEditTarget}
              onRestock={setRestockTarget}
              onDelete={handleDelete}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Inventory;
