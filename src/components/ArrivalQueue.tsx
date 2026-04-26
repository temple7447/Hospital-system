import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { MapPin, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import Modal from './Modal';

interface Arrival {
  id: string;
  name: string;
  idP: string;
  time: string;
  dr: string;
  status: 'Arrived' | 'In Transit' | 'Delayed';
  location: string;
}

interface ArrivalQueueProps {
  arrivals: Arrival[];
  onView?: (arrival: Arrival) => void;
  onEdit?: (arrival: Arrival) => void;
  onDelete?: (arrival: Arrival) => void;
  onUpdate?: (arrivals: Arrival[]) => void;
  className?: string;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function ArrivalQueue({ arrivals: initialArrivals, onView, onEdit, onDelete, className }: ArrivalQueueProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [arrivals, setArrivals] = useState(initialArrivals);
  const [selectedArrival, setSelectedArrival] = useState<Arrival | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredArrivals = arrivals.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.idP.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (arrival: Arrival) => {
    setSelectedArrival(arrival);
    setIsViewModalOpen(true);
    onView?.(arrival);
  };

  const handleEdit = (arrival: Arrival) => {
    setSelectedArrival(arrival);
    setIsEditModalOpen(true);
    onEdit?.(arrival);
  };

  const handleDelete = (arrival: Arrival) => {
    setSelectedArrival(arrival);
    setIsDeleteModalOpen(true);
    onDelete?.(arrival);
  };

  const confirmDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      const updated = arrivals.filter(a => a.id !== selectedArrival?.id);
      setArrivals(updated);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setSelectedArrival(null);
    }, 1000);
  };

  return (
    <div className={className}>
      <div className="glass-card rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Arrival Queue</h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-bold">{filteredArrivals.length} Waiting</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search arrivals..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 w-48 transition-all" 
            />
          </div>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredArrivals.map((arrival, i) => (
            <motion.div 
              key={arrival.id}
              variants={item}
              className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 font-bold">
                  {arrival.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{arrival.name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {arrival.idP} • {arrival.dr}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden md:block text-right">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {arrival.location}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Expected {arrival.time}</div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                  arrival.status === 'Arrived' && "bg-emerald-50 text-emerald-600",
                  arrival.status === 'In Transit' && "bg-blue-50 text-blue-600",
                  arrival.status === 'Delayed' && "bg-amber-50 text-amber-600",
                )}>
                  {arrival.status}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleView(arrival)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-blue-600" title="View">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEdit(arrival)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(arrival)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-red-600" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Arrival Details" maxWidth="md">
        {selectedArrival && (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xl font-black">
                {selectedArrival.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedArrival.name}</h3>
                <p className="text-sm font-medium text-slate-500">{selectedArrival.idP}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Expected Time</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedArrival.time}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Doctor</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedArrival.dr}</p>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsViewModalOpen(false)} className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-[10px]">Close</button>
              <button onClick={() => { setIsViewModalOpen(false); setIsEditModalOpen(true); }} className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px]">Edit</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => !isDeleting && setIsDeleteModalOpen(false)} title="Remove from Queue" maxWidth="sm">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Confirm Remove</h3>
          <p className="text-sm text-slate-500 mb-6">Remove <span className="font-bold text-red-500">{selectedArrival?.name}</span> from queue?</p>
          <div className="flex gap-4">
            <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-black uppercase text-[10px]">Cancel</button>
            <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
              {isDeleting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Arrival" maxWidth="lg">
        {selectedArrival && (
          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault();
            setArrivals(arrivals.map(a => a.id === selectedArrival.id ? selectedArrival : a));
            setIsEditModalOpen(false);
          }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">Patient Name</label>
                <input 
                  type="text" 
                  value={selectedArrival.name}
                  onChange={(e) => setSelectedArrival({...selectedArrival, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">Status</label>
                <select 
                  value={selectedArrival.status}
                  onChange={(e) => setSelectedArrival({...selectedArrival, status: e.target.value as Arrival['status']})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm"
                >
                  <option value="Arrived">Arrived</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-black uppercase text-[10px]">Cancel</button>
              <button type="submit" className="flex-[2] px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px]">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default ArrivalQueue;