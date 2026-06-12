import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, Plus, Search, X, Edit2, Trash2, RotateCcw,
  AlertTriangle, TrendingDown, DollarSign, Loader2,
  Pill, Stethoscope, FlaskConical, ShoppingBag, ArrowLeft, Save,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import type { InventoryItem, InventoryCategory } from '@/types';
import { toast } from 'sonner';
import {
  listInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem,
} from '@/lib/services';

const CATEGORY_CFG: Record<InventoryCategory, { label: string; icon: React.ElementType; bg: string; text: string }> = {
  medicine:   { label: 'Medicine',    icon: Pill,         bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-600' },
  equipment:  { label: 'Equipment',  icon: Stethoscope,  bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600' },
  consumable: { label: 'Consumable', icon: ShoppingBag,  bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-600' },
  lab_supply: { label: 'Lab Supply', icon: FlaskConical, bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-600' },
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

const fieldCls    = 'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200';
const labelCls    = 'block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1';
const sectionTitle = 'text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3';

const EMPTY_FORM = {
  name: '', category: 'medicine' as InventoryCategory, unit: 'tablets',
  quantity: 0, minQuantity: 10, unitPrice: 0, supplier: '',
  expiryDate: '', location: '',
};

// ─── Item Card ────────────────────────────────────────────────────────────────
const ItemCard: React.FC<{
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onRestock: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}> = ({ item, onEdit, onRestock, onDelete }) => {
  const cat = CATEGORY_CFG[item.category];
  const level = stockLevel(item);
  const barW = stockBarWidth(item);
  const isExpired = item.expiryDate && item.expiryDate < new Date().toISOString().split('T')[0];

  return (
    <div className={cn(
      'border bg-white dark:bg-slate-900 rounded-lg p-4 space-y-3 transition-all',
      level === 'out' ? 'border-red-300 dark:border-red-700' :
      level === 'low' ? 'border-amber-300 dark:border-amber-700' :
      'border-slate-200 dark:border-slate-700/60'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', cat.bg)}>
            <cat.icon className={cn('w-4 h-4', cat.text)} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-tight">{item.name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold uppercase', cat.bg, cat.text)}>{cat.label}</span>
              {level === 'out' && <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-red-50 dark:bg-red-900/20 text-red-600">Out of Stock</span>}
              {level === 'low' && <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-50 dark:bg-amber-900/20 text-amber-600">Low Stock</span>}
              {isExpired && <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-red-50 dark:bg-red-900/20 text-red-600">Expired</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => onRestock(item)} title="Restock"
            className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600 transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onEdit(item)} title="Edit"
            className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-all">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(item)} title="Delete"
            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[12px]">
          <span className="font-bold text-slate-700 dark:text-slate-300">{item.quantity} {item.unit}</span>
          <span className="text-slate-400">min {item.minQuantity}</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all',
            level === 'out' ? 'bg-red-500' : level === 'low' ? 'bg-amber-500' : 'bg-emerald-500'
          )} style={{ width: `${barW}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
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
  const [items, setItems]           = useState<InventoryItem[]>([]);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState<InventoryCategory | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [view, setView]             = useState<'list' | 'add' | 'edit' | 'restock'>('list');
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);
  const [saving, setSaving]         = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [restockQty, setRestockQty] = useState(50);

  const loadData = useCallback(async () => {
    const data = await listInventory();
    setItems(data.sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => ({
    total:      items.length,
    lowStock:   items.filter(i => stockLevel(i) === 'low').length,
    outOfStock: items.filter(i => stockLevel(i) === 'out').length,
    totalValue: items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
  }), [items]);

  const filtered = useMemo(() => items.filter(item => {
    if (catFilter !== 'all' && item.category !== catFilter) return false;
    if (stockFilter === 'low' && stockLevel(item) !== 'low') return false;
    if (stockFilter === 'out' && stockLevel(item) !== 'out') return false;
    if (search) {
      const q = search.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.supplier.toLowerCase().includes(q) && !item.location.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [items, catFilter, stockFilter, search]);

  const setF = (field: string, val: string | number) => setForm(f => ({ ...f, [field]: val }));

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setView('add');
  };

  const openEdit = (item: InventoryItem) => {
    setEditTarget(item);
    setForm({
      name: item.name, category: item.category, unit: item.unit,
      quantity: item.quantity, minQuantity: item.minQuantity,
      unitPrice: item.unitPrice, supplier: item.supplier,
      expiryDate: item.expiryDate ?? '', location: item.location,
    });
    setView('edit');
  };

  const openRestock = (item: InventoryItem) => {
    setEditTarget(item);
    setRestockQty(50);
    setView('restock');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), category: form.category, unit: form.unit,
        quantity: Number(form.quantity), minQuantity: Number(form.minQuantity),
        unitPrice: Number(form.unitPrice), supplier: form.supplier.trim(),
        expiryDate: form.expiryDate || undefined, location: form.location.trim(),
        lastRestocked: new Date().toISOString().split('T')[0],
      };
      if (editTarget) {
        await updateInventoryItem(editTarget.id, payload);
        toast.success('Item updated');
      } else {
        await createInventoryItem(payload);
        toast.success('Item added to inventory');
      }
      await loadData();
      setView('list');
    } catch {
      toast.error('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await updateInventoryItem(editTarget.id, {
        quantity: editTarget.quantity + restockQty,
        lastRestocked: new Date().toISOString().split('T')[0],
      });
      toast.success(`Restocked ${restockQty} ${editTarget.unit} of ${editTarget.name}`);
      await loadData();
      setView('list');
    } catch {
      toast.error('Failed to restock');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!window.confirm(`Delete "${item.name}" from inventory?`)) return;
    await deleteInventoryItem(item.id);
    await loadData();
    toast.success('Item removed');
  };

  const canSave = form.name.trim() && form.supplier.trim() && form.location.trim() && form.unitPrice > 0;

  // ── Add / Edit view ───────────────────────────────────────────────────────────
  if (view === 'add' || view === 'edit') {
    const isEdit = view === 'edit' && editTarget !== null;
    const cat = CATEGORY_CFG[form.category as InventoryCategory];
    const previewLevel = form.quantity === 0 ? 'out' : Number(form.quantity) <= Number(form.minQuantity) ? 'low' : 'ok';
    const previewBarW  = form.minQuantity > 0
      ? Math.min((Number(form.quantity) / Math.max(Number(form.minQuantity) * 3, Number(form.quantity))) * 100, 100)
      : 0;

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setView('list')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cat.bg)}>
            <cat.icon className={cn('w-4 h-4', cat.text)} />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">
              {isEdit ? 'Edit Item' : 'Add Item'}
            </h1>
            <p className="text-[13px] text-slate-400">
              {isEdit ? editTarget!.name : 'Add a new inventory item'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0">
          {/* Left 2/5: Preview card */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-lg p-4">
              <p className={sectionTitle}>Preview</p>
              <div className="flex items-start gap-3 mb-4">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors', cat.bg)}>
                  <cat.icon className={cn('w-5 h-5 transition-colors', cat.text)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-tight">
                    {form.name || 'Item Name'}
                  </p>
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold uppercase mt-1 inline-block', cat.bg, cat.text)}>
                    {cat.label}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-[12px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{form.quantity} {form.unit}</span>
                  <span className="text-slate-400">min {form.minQuantity}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all',
                    previewLevel === 'out' ? 'bg-red-500' : previewLevel === 'low' ? 'bg-amber-500' : 'bg-emerald-500'
                  )} style={{ width: `${previewBarW}%` }} />
                </div>
                {previewLevel !== 'ok' && (
                  <p className={cn('text-[11px] font-semibold',
                    previewLevel === 'out' ? 'text-red-600' : 'text-amber-600')}>
                    {previewLevel === 'out' ? 'Out of stock' : 'Below minimum threshold'}
                  </p>
                )}
              </div>

              <div className="space-y-1 text-[12px] text-slate-500">
                <div className="flex justify-between">
                  <span>Unit Price</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{fmtMoney(Number(form.unitPrice))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Value</span>
                  <span className="font-semibold text-emerald-600">{fmtMoney(Number(form.unitPrice) * Number(form.quantity))}</span>
                </div>
                {form.supplier && (
                  <div className="flex justify-between">
                    <span>Supplier</span>
                    <span className="font-medium text-slate-600 dark:text-slate-400 truncate max-w-24">{form.supplier}</span>
                  </div>
                )}
                {form.expiryDate && (
                  <div className="flex justify-between">
                    <span>Expires</span>
                    <span className={cn('font-medium', form.expiryDate < new Date().toISOString().split('T')[0] ? 'text-red-600' : 'text-slate-600 dark:text-slate-400')}>
                      {form.expiryDate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right 3/5: Form fields */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-lg flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input type="text" required value={form.name} onChange={e => setF('name', e.target.value)}
                    placeholder="e.g. Amoxicillin 500mg" className={fieldCls} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Category</label>
                    <select value={form.category} onChange={e => setF('category', e.target.value)} className={fieldCls}>
                      {(Object.keys(CATEGORY_CFG) as InventoryCategory[]).map(c => (
                        <option key={c} value={c}>{CATEGORY_CFG[c].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Unit</label>
                    <select value={form.unit} onChange={e => setF('unit', e.target.value)} className={fieldCls}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Qty</label>
                    <input type="number" min="0" value={form.quantity}
                      onChange={e => setF('quantity', Number(e.target.value))} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Min Qty</label>
                    <input type="number" min="0" value={form.minQuantity}
                      onChange={e => setF('minQuantity', Number(e.target.value))} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Unit Price *</label>
                    <input type="number" min="0" step="0.01" value={form.unitPrice}
                      onChange={e => setF('unitPrice', Number(e.target.value))} className={fieldCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Supplier *</label>
                  <input type="text" value={form.supplier} onChange={e => setF('supplier', e.target.value)}
                    placeholder="Supplier name" className={fieldCls} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Location *</label>
                    <input type="text" value={form.location} onChange={e => setF('location', e.target.value)}
                      placeholder="e.g. Pharmacy Store A" className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Expiry Date</label>
                    <input type="date" value={form.expiryDate}
                      onChange={e => setF('expiryDate', e.target.value)} className={fieldCls} />
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                <button type="button" onClick={() => setView('list')}
                  className="flex-1 py-2.5 rounded border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving || !canSave}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><Save className="w-3.5 h-3.5" /> {isEdit ? 'Save Changes' : 'Add Item'}</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ── Restock view ──────────────────────────────────────────────────────────────
  if (view === 'restock' && editTarget) {
    const cat = CATEGORY_CFG[editTarget.category];
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setView('list')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">Restock Item</h1>
            <p className="text-[13px] text-slate-400">{editTarget.name}</p>
          </div>
        </div>

        <form onSubmit={handleRestock} className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0 max-h-96">
          {/* Left 2/5: Item info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-lg p-4">
              <p className={sectionTitle}>Item Details</p>
              <div className="flex items-start gap-3 mb-4">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', cat.bg)}>
                  <cat.icon className={cn('w-4 h-4', cat.text)} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{editTarget.name}</p>
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold uppercase', cat.bg, cat.text)}>
                    {cat.label}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between text-slate-500">
                  <span>Current Stock</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{editTarget.quantity} {editTarget.unit}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Min Threshold</span>
                  <span className="font-medium text-slate-600 dark:text-slate-400">{editTarget.minQuantity} {editTarget.unit}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Supplier</span>
                  <span className="font-medium text-slate-600 dark:text-slate-400 truncate max-w-28">{editTarget.supplier}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 3/5: Restock form */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-lg flex flex-col overflow-hidden">
              <div className="p-5 space-y-4">
                <div>
                  <label className={labelCls}>Add Quantity ({editTarget.unit})</label>
                  <input type="number" min="1" value={restockQty}
                    onChange={e => setRestockQty(Number(e.target.value))}
                    className="w-full px-3 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-2xl font-semibold outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-center" />
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  <p className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
                    New total: {editTarget.quantity + restockQty} {editTarget.unit}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    +{restockQty} from current {editTarget.quantity}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 flex gap-3 shrink-0">
                <button type="button" onClick={() => setView('list')}
                  className="flex-1 py-2.5 rounded border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving || restockQty <= 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-[13px] font-medium rounded hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><RotateCcw className="w-3.5 h-3.5" /> Restock</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">Inventory</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Medicines, equipment and supplies</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: stats.total,      icon: Package,       color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Low Stock',   value: stats.lowStock,   icon: TrendingDown,  color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Out of Stock',value: stats.outOfStock, icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Total Value', value: fmtMoney(stats.totalValue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(s => (
          <div key={s.label} className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4 rounded-lg flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-md flex items-center justify-center shrink-0', s.bg, s.color)}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-[13px] font-bold text-amber-700 dark:text-amber-400">
            {stats.outOfStock > 0 && `${stats.outOfStock} item${stats.outOfStock !== 1 ? 's' : ''} out of stock. `}
            {stats.lowStock > 0 && `${stats.lowStock} item${stats.lowStock !== 1 ? 's' : ''} below minimum threshold.`}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-52 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, supplier, location..."
              className={fieldCls + ' pl-9'} />
          </div>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value as typeof stockFilter)}
            className={fieldCls + ' w-auto'}>
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          {(search || catFilter !== 'all' || stockFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setCatFilter('all'); setStockFilter('all'); }}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded text-[12px] font-bold text-slate-500 hover:bg-slate-200 transition-all flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', ...Object.keys(CATEGORY_CFG)] as (InventoryCategory | 'all')[]).map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={cn(
                'px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all',
                catFilter === c
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:border-blue-300'
              )}>
              {c === 'all' ? 'All' : CATEGORY_CFG[c as InventoryCategory].label}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      {filtered.length === 0 ? (
        <div className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-16 rounded-lg text-center">
          <Package className="w-9 h-9 text-slate-300 mx-auto mb-3" />
          <p className="text-[13px] text-slate-400 font-bold">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <ItemCard key={item.id} item={item}
              onEdit={openEdit} onRestock={openRestock} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Inventory;
