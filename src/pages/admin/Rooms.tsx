import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  BedDouble, Search, Filter, Save, X, Edit3,
  CheckCircle2, AlertTriangle, Wrench, Clock, ChevronDown,
} from 'lucide-react';
import { db } from '@/lib/db';
import { cn } from '@/utils/cn';
import type { Room, RoomType, RoomStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';

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

// ─── Edit Modal ────────────────────────────────────────────────────────────────
const EditModal: React.FC<{
  room: Room;
  onClose: () => void;
  onSave: (data: Partial<Room>) => void;
}> = ({ room, onClose, onSave }) => {
  const departments = db.departments.getAll();
  const [form, setForm] = useState({
    roomNumber:   room.roomNumber,
    type:         room.type,
    floor:        room.floor,
    departmentId: room.departmentId,
    capacity:     room.capacity,
    occupiedBeds: room.occupiedBeds,
    status:       room.status,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.occupiedBeds) > Number(form.capacity)) {
      toast.error('Occupied beds cannot exceed total capacity');
      return;
    }
    onSave({ ...form, floor: Number(form.floor), capacity: Number(form.capacity), occupiedBeds: Number(form.occupiedBeds) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Edit Room {room.roomNumber}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Room Number</label>
              <input type="text" value={form.roomNumber} onChange={e => set('roomNumber', e.target.value)} className="input-field py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Floor</label>
              <input type="number" min={1} value={form.floor} onChange={e => set('floor', Number(e.target.value))} className="input-field py-2.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Room Type</label>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_TYPES.map(t => {
                const meta = typeMeta[t];
                return (
                  <button key={t} type="button" onClick={() => set('type', t)}
                    className={cn('py-2 rounded-xl text-xs font-black border-2 transition-all capitalize', form.type === t ? `${meta.bg} ${meta.color} border-current` : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300')}>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
            <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} className="input-field py-2.5 text-sm">
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Total Capacity</label>
              <input type="number" min={1} value={form.capacity} onChange={e => set('capacity', Number(e.target.value))} className="input-field py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Occupied Beds</label>
              <input type="number" min={0} max={form.capacity} value={form.occupiedBeds} onChange={e => set('occupiedBeds', Number(e.target.value))} className="input-field py-2.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {ROOM_STATUSES.map(s => {
                const meta = statusMeta[s];
                return (
                  <button key={s} type="button" onClick={() => set('status', s)}
                    className={cn('py-2.5 rounded-xl text-xs font-black border-2 transition-all', form.status === s ? `${meta.bg} ${meta.color} border-current` : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300')}>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-all">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 text-sm font-bold">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Room Card ─────────────────────────────────────────────────────────────────
const RoomCard: React.FC<{ room: Room; onEdit: (r: Room) => void }> = ({ room, onEdit }) => {
  const dept   = db.departments.getById(room.departmentId);
  const type   = typeMeta[room.type];
  const status = statusMeta[room.status];
  const StatusIcon = status.icon;
  const occupancy = room.capacity > 0 ? (room.occupiedBeds / room.capacity) * 100 : 0;

  const barColor =
    room.status === 'maintenance' ? 'bg-amber-400' :
    room.status === 'reserved'    ? 'bg-blue-400' :
    occupancy >= 100              ? 'bg-red-500' :
    occupancy >= 70               ? 'bg-amber-400' :
    'bg-emerald-500';

  return (
    <motion.div whileHover={{ y: -3 }} className="glass-card rounded-2xl p-5 group transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {room.roomNumber}
            </span>
          </div>
          <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide', type.bg, type.color)}>
            {type.label}
          </span>
        </div>
        <button onClick={() => onEdit(room)}
          className="p-1.5 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all opacity-0 group-hover:opacity-100">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Department */}
      {dept && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 truncate">
          {dept.name}
        </p>
      )}

      {/* Bed bar */}
      <div className="mb-3">
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-500">Beds</span>
          <span className="text-xs font-black text-slate-900 dark:text-white">
            {room.occupiedBeds}/{room.capacity}
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          {room.status === 'maintenance' ? (
            <div className="h-full w-full bg-slate-200 dark:bg-slate-700 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 8px)' }} />
          ) : (
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(occupancy, 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={cn('h-full rounded-full', barColor)} />
          )}
        </div>
      </div>

      {/* Status */}
      <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl', status.bg)}>
        <StatusIcon className={cn('w-3 h-3', status.color)} />
        <span className={cn('text-[11px] font-black', status.color)}>{status.label}</span>
      </div>
    </motion.div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const RoomsPage: React.FC = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>(() => db.rooms.getAll());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const departments = db.departments.getAll();
  const refresh = () => setRooms(db.rooms.getAll());

  const stats = useMemo(() => ({
    total:       rooms.length,
    available:   rooms.filter(r => r.status === 'available').length,
    full:        rooms.filter(r => r.status === 'full').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  }), [rooms]);

  const filtered = useMemo(() => rooms.filter(r => {
    const matchSearch = !search || r.roomNumber.includes(search);
    const matchType   = typeFilter   === 'all' || r.type   === typeFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchDept   = deptFilter   === 'all' || r.departmentId === deptFilter;
    return matchSearch && matchType && matchStatus && matchDept;
  }), [rooms, search, typeFilter, statusFilter, deptFilter]);

  // Group by floor
  const byFloor = useMemo(() => {
    const map = new Map<number, Room[]>();
    filtered.forEach(r => {
      if (!map.has(r.floor)) map.set(r.floor, []);
      map.get(r.floor)!.push(r);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filtered]);

  const handleSave = (data: Partial<Room>) => {
    if (!editingRoom) return;
    db.rooms.update(editingRoom.id, data);
    db.auditLogs.create({ userId: user!.id, userRole: user!.role, action: 'UPDATE_ROOM', resource: 'Room', resourceId: editingRoom.id, details: `Updated Room ${editingRoom.roomNumber} — status: ${data.status}` });
    toast.success(`Room ${editingRoom.roomNumber} updated`);
    refresh();
    setEditingRoom(null);
  };

  const floorLabel = (n: number) => {
    const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
    return `${n}${suffixes[n] ?? 'th'} Floor`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Rooms & Beds</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Monitor and manage room occupancy across all floors</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Rooms',  value: stats.total,       color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',    icon: BedDouble },
          { label: 'Available',    value: stats.available,    color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600', icon: CheckCircle2 },
          { label: 'Full',         value: stats.full,         color: 'bg-red-50 dark:bg-red-900/20 text-red-600',        icon: AlertTriangle },
          { label: 'Maintenance',  value: stats.maintenance,  color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',  icon: Wrench },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-card p-5 rounded-3xl">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center mb-3', color)}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-3xl p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search room number…" value={search}
              onChange={e => setSearch(e.target.value)} className="input-field pl-10 py-2.5 text-sm w-full" />
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { value: typeFilter,   onChange: setTypeFilter,   options: [['all', 'All Types'], ...ROOM_TYPES.map(t => [t, typeMeta[t].label])] },
              { value: statusFilter, onChange: setStatusFilter, options: [['all', 'All Status'], ...ROOM_STATUSES.map(s => [s, statusMeta[s].label])] },
              { value: deptFilter,   onChange: setDeptFilter,   options: [['all', 'All Depts'], ...departments.map(d => [d.id, d.name])] },
            ].map(({ value, onChange, options }, i) => (
              <div key={i} className="relative">
                <select value={value} onChange={e => onChange(e.target.value)} className="input-field py-2.5 pl-3 pr-8 text-sm appearance-none cursor-pointer">
                  {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs font-bold text-slate-400 mt-3">
          Showing {filtered.length} of {rooms.length} rooms
        </p>
      </div>

      {/* Rooms by floor */}
      {byFloor.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center text-slate-400 font-medium">
          No rooms match your filters.
        </div>
      ) : (
        byFloor.map(([floor, floorRooms]) => (
          <div key={floor}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{floorLabel(floor)}</h2>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              <span className="text-xs font-bold text-slate-400">{floorRooms.length} rooms</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {floorRooms.map(room => (
                <RoomCard key={room.id} room={room} onEdit={r => setEditingRoom(r)} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Edit modal */}
      <AnimatePresence>
        {editingRoom && (
          <EditModal room={editingRoom} onClose={() => setEditingRoom(null)} onSave={handleSave} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RoomsPage;
