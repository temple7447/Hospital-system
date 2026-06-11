import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Pill, Search, AlertTriangle, Plus, Package } from 'lucide-react';
import { cn } from '@/utils/cn';
import { listInventory, updateInventoryItem } from '@/lib/services';
import type { InventoryItem } from '@/types';

const DrugInventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'good'>('all');
  const [restocking, setRestocking] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState('');

  const load = useCallback(async () => {
    try {
      const inv = await listInventory({ category: 'medicine' });
      setItems(inv);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter === 'low')  list = list.filter(i => i.quantity <= i.minQuantity);
    if (filter === 'good') list = list.filter(i => i.quantity > i.minQuantity);
    if (search) {
      const t = search.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(t) || i.supplier.toLowerCase().includes(t));
    }
    return list;
  }, [items, search, filter]);

  const lowCount = useMemo(() => items.filter(i => i.quantity <= i.minQuantity).length, [items]);

  const handleRestock = async (item: InventoryItem) => {
    const qty = Number(restockQty);
    if (!qty || qty <= 0) { toast.error('Enter a valid quantity'); return; }
    try {
      await updateInventoryItem(item.id, { quantity: item.quantity + qty });
      toast.success(`Restocked ${item.name}`);
      load();
    } catch {
      toast.error('Failed to restock item');
    }
    setRestocking(null);
    setRestockQty('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Drug Inventory</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage pharmacy stock levels</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total Items"   value={items.length} icon={Package}     color="blue" />
        <Stat label="Low Stock"     value={lowCount}     icon={AlertTriangle} color="amber" />
        <Stat label="In Stock"      value={items.length - lowCount} icon={Pill} color="emerald" />
      </div>

      <div className="glass-card rounded-lg p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search medicine or supplier…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-field pl-10 py-2.5 text-sm w-full" />
        </div>
        <div className="flex gap-2">
          {(['all', 'low', 'good'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all',
                filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200')}>
              {f === 'good' ? 'In Stock' : f === 'low' ? 'Low Stock' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center text-slate-400 font-medium">No medicines match filter.</div>
      ) : (
        <div className="glass-card rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(item => {
                const low = item.quantity <= item.minQuantity;
                const isRestocking = restocking === item.id;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{item.location}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {low && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        <span className={cn('font-semibold', low ? 'text-amber-600' : 'text-slate-900 dark:text-white')}>
                          {item.quantity}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">/ min {item.minQuantity} {item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{item.supplier}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">{item.expiryDate ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      {isRestocking ? (
                        <div className="flex items-center gap-2 justify-end">
                          <input type="number" autoFocus value={restockQty} onChange={e => setRestockQty(e.target.value)}
                            placeholder="Qty"
                            className="w-20 input-field py-1.5 text-xs text-center" />
                          <button onClick={() => handleRestock(item)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">Add</button>
                          <button onClick={() => { setRestocking(null); setRestockQty(''); }}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-200">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setRestocking(item.id)}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1 ml-auto">
                          <Plus className="w-3.5 h-3.5" /> Restock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

const Stat: React.FC<{ label: string; value: number; icon: React.ElementType; color: 'blue' | 'amber' | 'emerald' }> = ({ label, value, icon: Icon, color }) => (
  <div className="glass-card p-4 rounded-md">
    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2',
      color === 'blue'    && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
      color === 'amber'   && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
      color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    )}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
  </div>
);

export default DrugInventory;
