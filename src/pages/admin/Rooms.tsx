import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  BedDouble, Search, Save, Edit3,
  CheckCircle2, AlertTriangle, Wrench, Clock, ChevronDown, ArrowLeft, Loader2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Room, RoomType, RoomStatus, Department } from '@/types';
import { listRooms, updateRoom, listDepartments } from '@/lib/services';

const ROOM_TYPES: RoomType[] = ['general', 'private', 'icu', 'emergency', 'operation', 'consultation'];
const ROOM_STATUSES: RoomStatus[] = ['available', 'full', 'maintenance', 'reserved'];

const typeMeta: Record<RoomType, { label: string; color: string; bg: string }> = {
  general:      { label: 'General',      color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  private:      { label: 'Private',      color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  icu:          { label: 'ICU',          color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20' },
  emergency:    { label: 'Emergency',    color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-900/20' },
  operation:    { label: 'Operation',    color: 'text-slate-600',   bg: 'bg-slate-100 dark:bg-slate-800' },
  consultation: { label: 'Consultation', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
};

const statusMeta: Record<RoomStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  available:   { label: 'Available',   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  full:        { label: 'Full',        color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20',         icon: BedDouble },
  maintenance: { label: 'Maintenance', color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',     icon: Wrench },
  reserved:    { label: 'Reserved',    color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20',       icon: Clock },
};

const fieldCls    = 'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[13px] outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200';
const labelCls    = 'block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1';
const sectionTitle = 'text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3';

// ─── Room Card ─────────────────────────────────────────────────────────────────
const RoomCard: React.FC<{ room: Room; departments: Department[]; onEdit: (r: Room) => void }> = ({ room, departments, onEdit }) => {
  const dept   = departments.find(d => d.id === room.departmentId) ?? null;
  const type   = typeMeta[room.type] ?? typeMeta['general'];
  const status = statusMeta[room.status] ?? statusMeta['available'];
  const StatusIcon = status.icon;
  const occupancy = room.capacity > 0 ? (room.occupiedBeds / room.capacity) * 100 : 0;

  const barColor =
    room.status === 'maintenance' ? 'bg-amber-400' :
    room.status === 'reserved'    ? 'bg-blue-400' :
    occupancy >= 100              ? 'bg-red-500' :
    occupancy >= 70               ? 'bg-amber-400' : 'bg-emerald-500';

  return (
    <div className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-lg p-4 group transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xl font-semibold text-slate-900 dark:text-white">{room.roomNumber}</span>
          <div className="mt-1">
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg uppercase tracking-wide', type.bg, type.color)}>
              {type.label}
            </span>
          </div>
        </div>
        <button onClick={() => onEdit(room)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all opacity-0 group-hover:opacity-100">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {dept && (
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-3 truncate">{dept.name}</p>
      )}

      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-[11px] font-bold text-slate-500">Beds</span>
          <span className="text-[11px] font-semibold text-slate-900 dark:text-white">{room.occupiedBeds}/{room.capacity}</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          {room.status === 'maintenance' ? (
            <div className="h-full w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
          ) : (
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(occupancy, 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={cn('h-full rounded-full', barColor)} />
          )}
        </div>
      </div>

      <div className={cn('flex items-center gap-1.5 px-2 py-1.5 rounded-lg', status.bg)}>
        <StatusIcon className={cn('w-3 h-3', status.color)} />
        <span className={cn('text-[11px] font-semibold', status.color)}>{status.label}</span>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const RoomsPage: React.FC = () => {
  const [rooms, setRooms]             = useState<Room[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter]   = useState<string>('all');
  const [view, setView]               = useState<'list' | 'edit'>('list');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [saving, setSaving]           = useState(false);

  const [form, setForm] = useState({
    roomNumber: '', type: 'general' as RoomType, floor: 1,
    departmentId: '', capacity: 1, occupiedBeds: 0, status: 'available' as RoomStatus,
  });

  const refresh = useCallback(async () => {
    const [r, d] = await Promise.all([listRooms(), listDepartments()]);
    setRooms(r);
    setDepartments(d);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const stats = useMemo(() => ({
    total:       rooms.length,
    available:   rooms.filter(r => r.status === 'available').length,
    full:        rooms.filter(r => r.status === 'full').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  }), [rooms]);

  const filtered = useMemo(() => rooms.filter(r => {
    return (
      (!search || r.roomNumber.includes(search)) &&
      (typeFilter === 'all' || r.type === typeFilter) &&
      (statusFilter === 'all' || r.status === statusFilter) &&
      (deptFilter === 'all' || r.departmentId === deptFilter)
    );
  }), [rooms, search, typeFilter, statusFilter, deptFilter]);

  const byFloor = useMemo(() => {
    const map = new Map<number, Room[]>();
    filtered.forEach(r => {
      if (!map.has(r.floor)) map.set(r.floor, []);
      map.get(r.floor)!.push(r);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filtered]);

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setForm({
      roomNumber: room.roomNumber, type: room.type, floor: room.floor,
      departmentId: room.departmentId, capacity: room.capacity,
      occupiedBeds: room.occupiedBeds, status: room.status,
    });
    setView('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    if (Number(form.occupiedBeds) > Number(form.capacity)) {
      toast.error('Occupied beds cannot exceed total capacity');
      return;
    }
    setSaving(true);
    try {
      await updateRoom(editingRoom.id, {
        ...form,
        floor: Number(form.floor),
        capacity: Number(form.capacity),
        occupiedBeds: Number(form.occupiedBeds),
      });
      toast.success(`Room ${editingRoom.roomNumber} updated`);
      await refresh();
      setView('list');
      setEditingRoom(null);
    } catch {
      toast.error('Failed to update room');
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const floorLabel = (n: number) => {
    const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
    return `${n}${suffixes[n] ?? 'th'} Floor`;
  };

  // ── Edit view ─────────────────────────────────────────────────────────────────
  if (view === 'edit' && editingRoom) {
    const currentType   = typeMeta[form.type] ?? typeMeta['general'];
    const currentStatus = statusMeta[form.status] ?? statusMeta['available'];
    const dept = departments.find(d => d.id === form.departmentId) ?? null;
    const occupancyPct = form.capacity > 0 ? (Number(form.occupiedBeds) / Number(form.capacity)) * 100 : 0;

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setView('list'); setEditingRoom(null); }}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <BedDouble className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">
              Edit Room {editingRoom.roomNumber}
            </h1>
            <p className="text-[13px] text-slate-400">Floor {editingRoom.floor}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-0">
          {/* Left 2/5: Room summary card */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-lg p-4">
              <p className={sectionTitle}>Room Summary</p>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{form.roomNumber || editingRoom.roomNumber}</div>

              <div className="space-y-2 mb-3">
                <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg', currentType.bg)}>
                  <span className={cn('text-[11px] font-semibold', currentType.color)}>{currentType.label}</span>
                </div>
              </div>

              {dept && (
                <p className="text-[12px] text-slate-500 mb-3">{dept.name}</p>
              )}

              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500">Occupancy</span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {form.occupiedBeds}/{form.capacity} beds
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all',
                    form.status === 'maintenance' ? 'bg-amber-400' :
                    occupancyPct >= 100 ? 'bg-red-500' :
                    occupancyPct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'
                  )} style={{ width: `${Math.min(occupancyPct, 100)}%` }} />
                </div>
              </div>

              <div className={cn('flex items-center gap-1.5 px-2 py-1.5 rounded-lg', currentStatus.bg)}>
                <currentStatus.icon className={cn('w-3 h-3', currentStatus.color)} />
                <span className={cn('text-[11px] font-semibold', currentStatus.color)}>{currentStatus.label}</span>
              </div>
            </div>
          </div>

          {/* Right 3/5: Edit fields */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-lg flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Room Number</label>
                    <input type="text" value={form.roomNumber}
                      onChange={e => set('roomNumber', e.target.value)} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Floor</label>
                    <input type="number" min={1} value={form.floor}
                      onChange={e => set('floor', Number(e.target.value))} className={fieldCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Room Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROOM_TYPES.map(t => {
                      const meta = typeMeta[t];
                      return (
                        <button key={t} type="button" onClick={() => set('type', t)}
                          className={cn('py-2 rounded text-[11px] font-semibold border-2 transition-all capitalize',
                            form.type === t
                              ? `${meta.bg} ${meta.color} border-current`
                              : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300')}>
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Department</label>
                  <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} className={fieldCls}>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Total Capacity</label>
                    <input type="number" min={1} value={form.capacity}
                      onChange={e => set('capacity', Number(e.target.value))} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Occupied Beds</label>
                    <input type="number" min={0} max={form.capacity} value={form.occupiedBeds}
                      onChange={e => set('occupiedBeds', Number(e.target.value))} className={fieldCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROOM_STATUSES.map(s => {
                      const meta = statusMeta[s];
                      return (
                        <button key={s} type="button" onClick={() => set('status', s)}
                          className={cn('py-2 rounded text-[11px] font-semibold border-2 transition-all',
                            form.status === s
                              ? `${meta.bg} ${meta.color} border-current`
                              : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300')}>
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                <button type="button" onClick={() => { setView('list'); setEditingRoom(null); }}
                  className="flex-1 py-2.5 rounded border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-[13px] font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
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
      <div>
        <h1 className="text-[15px] font-semibold text-slate-800 dark:text-white">Rooms & Beds</h1>
        <p className="text-[13px] text-slate-400 mt-0.5">Monitor and manage room occupancy across all floors</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Rooms',  value: stats.total,       bg: 'bg-blue-50 dark:bg-blue-900/20',       color: 'text-blue-600',    icon: BedDouble },
          { label: 'Available',    value: stats.available,    bg: 'bg-emerald-50 dark:bg-emerald-900/20', color: 'text-emerald-600', icon: CheckCircle2 },
          { label: 'Full',         value: stats.full,         bg: 'bg-red-50 dark:bg-red-900/20',         color: 'text-red-600',     icon: AlertTriangle },
          { label: 'Maintenance',  value: stats.maintenance,  bg: 'bg-amber-50 dark:bg-amber-900/20',     color: 'text-amber-600',   icon: Wrench },
        ].map(({ label, value, bg, color, icon: Icon }) => (
          <div key={label} className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4 rounded-lg">
            <div className={cn('w-9 h-9 rounded-md flex items-center justify-center mb-2', bg, color)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Search room number…" value={search}
              onChange={e => setSearch(e.target.value)} className={fieldCls + ' pl-9'} />
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { value: typeFilter,   onChange: setTypeFilter,   options: [['all', 'All Types'], ...ROOM_TYPES.map(t => [t, typeMeta[t].label])] },
              { value: statusFilter, onChange: setStatusFilter, options: [['all', 'All Status'], ...ROOM_STATUSES.map(s => [s, statusMeta[s].label])] },
              { value: deptFilter,   onChange: setDeptFilter,   options: [['all', 'All Depts'], ...departments.map(d => [d.id, d.name])] },
            ].map(({ value, onChange, options }, i) => (
              <div key={i} className="relative">
                <select value={value} onChange={e => onChange(e.target.value)}
                  className={fieldCls + ' pr-8 appearance-none cursor-pointer'}>
                  {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] font-medium text-slate-400 mt-3">
          Showing {filtered.length} of {rooms.length} rooms
        </p>
      </div>

      {/* Rooms by floor */}
      {byFloor.length === 0 ? (
        <div className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-lg p-16 text-center text-[13px] text-slate-400 font-medium">
          No rooms match your filters.
        </div>
      ) : (
        byFloor.map(([floor, floorRooms]) => (
          <div key={floor}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">{floorLabel(floor)}</h2>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              <span className="text-[11px] font-bold text-slate-400">{floorRooms.length} rooms</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {floorRooms.map(room => (
                <RoomCard key={room.id} room={room} departments={departments} onEdit={openEdit} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RoomsPage;
