import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  ChevronRight,
  UserPlus,
  ArrowUpDown,
  Activity,
  Heart,
  FileText as LucideFileText,
  User,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Trash2,
  Eye
} from 'lucide-react';
import { cn } from '@/utils/cn';
import Modal from '@/components/Modal';

const FileText = LucideFileText;

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  age: number;
  lastVisit: string;
  status: 'STABLE' | 'CRITICAL' | 'RECOVERING';
  avatar?: string;
}

const patientsData: Patient[] = [
  { id: '1', name: 'John Cooper', email: 'john.c@example.com', phone: '+1 234 567 890', gender: 'Male', age: 42, lastVisit: '2024-03-15', status: 'STABLE' },
  { id: '2', name: 'Sarah Miller', email: 's.miller@example.com', phone: '+1 234 567 891', gender: 'Female', age: 29, lastVisit: '2024-03-20', status: 'RECOVERING' },
  { id: '3', name: 'Robert Wilson', email: 'r.wilson@example.com', phone: '+1 234 567 892', gender: 'Male', age: 65, lastVisit: '2024-03-18', status: 'CRITICAL' },
  { id: '4', name: 'Emily Davis', email: 'emily.d@example.com', phone: '+1 234 567 893', gender: 'Female', age: 34, lastVisit: '2024-03-22', status: 'STABLE' },
  { id: '5', name: 'Michael Brown', email: 'm.brown@example.com', phone: '+1 234 567 894', gender: 'Male', age: 51, lastVisit: '2024-03-10', status: 'STABLE' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const Patients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [patients, setPatients] = useState<Patient[]>(patientsData);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingPatient(true);
    
    setTimeout(() => {
      const newPatient: Patient = {
        id: String(patients.length + 1),
        name: 'New Patient',
        email: 'new@example.com',
        phone: '+1 234 567 000',
        gender: 'Male',
        age: 30,
        lastVisit: new Date().toISOString().split('T')[0],
        status: 'STABLE'
      };
      setPatients([...patients, newPatient]);
      setIsAddingPatient(false);
      setShowAddSuccess(true);
      
      setTimeout(() => {
        setShowAddSuccess(false);
        setIsAddModalOpen(false);
      }, 2000);
    }, 1500);
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  };

  const handleDeletePatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setPatients(patients.filter(p => p.id !== selectedPatient?.id));
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setSelectedPatient(null);
    }, 1000);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.includes(searchTerm)
  );

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={container}
      className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-8"
    >
      {/* Add Patient Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => !(isAddingPatient || showAddSuccess) && setIsAddModalOpen(false)} 
        title="Add New Patient"
        maxWidth="lg"
      >
        <div className="relative">
          {showAddSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl"
            >
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Registration Success!</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-center max-w-xs">The new patient has been registered in the system.</p>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleAddPatient}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                    disabled={isAddingPatient}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="e.g. john@example.com" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                    disabled={isAddingPatient}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="tel" 
                    placeholder="e.g. +1 234 567 890" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                    disabled={isAddingPatient}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                    disabled={isAddingPatient}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Gender</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                  required 
                  disabled={isAddingPatient}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Blood Group</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                  required 
                  disabled={isAddingPatient}
                >
                  <option value="">Select Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Residential Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="e.g. 123 Healthcare Ave, Medical District" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                  required 
                  disabled={isAddingPatient}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Medical History (Brief)</label>
              <textarea 
                placeholder="e.g. Known allergies, chronic conditions..." 
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[100px] disabled:opacity-50" 
                disabled={isAddingPatient}
              />
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)} 
                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
                disabled={isAddingPatient}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-[2] px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                disabled={isAddingPatient}
              >
                {isAddingPatient ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>Register Patient</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Patient Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Patient Details"
        maxWidth="lg"
      >
        {selectedPatient && (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-2xl font-black">
                {selectedPatient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedPatient.name}</h3>
                <p className="text-sm font-medium text-slate-500">ID: #{selectedPatient.id.padStart(4, '0')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedPatient.email}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Phone</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedPatient.phone}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Gender / Age</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedPatient.gender}, {selectedPatient.age}y</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Last Visit</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedPatient.lastVisit}</p>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsViewModalOpen(false)} 
                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
              >
                Close
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all"
              >
                Edit Patient
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title="Delete Patient"
        maxWidth="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Confirm Delete</h3>
          <p className="text-sm text-slate-500 mb-6">
            Are you sure you want to delete <span className="font-bold text-red-500">{selectedPatient?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={() => setIsDeleteModalOpen(false)} 
              disabled={isDeleting}
              className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete</span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Patient"
        maxWidth="lg"
      >
        {selectedPatient && (
          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault();
            setPatients(patients.map(p => p.id === selectedPatient.id ? selectedPatient : p));
            setIsEditModalOpen(false);
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                <input 
                  type="text" 
                  value={selectedPatient.name}
                  onChange={(e) => setSelectedPatient({ ...selectedPatient, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                <input 
                  type="email" 
                  value={selectedPatient.email}
                  onChange={(e) => setSelectedPatient({ ...selectedPatient, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={selectedPatient.phone}
                  onChange={(e) => setSelectedPatient({ ...selectedPatient, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Status</label>
                <select 
                  value={selectedPatient.status}
                  onChange={(e) => setSelectedPatient({ ...selectedPatient, status: e.target.value as Patient['status'] })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="STABLE">STABLE</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="RECOVERING">RECOVERING</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-[2] px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Patients</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and monitor hospital patients</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: String(patients.length), change: '+12', icon: UserPlus, color: 'blue' },
          { label: 'Critical Cases', value: String(patients.filter(p => p.status === 'CRITICAL').length), change: '-2', icon: Activity, color: 'red' },
          { label: 'Recovering', value: String(patients.filter(p => p.status === 'RECOVERING').length), change: '+8', icon: Heart, color: 'emerald' },
          { label: 'Today\'s Check-ins', value: '42', change: '+5', icon: Calendar, color: 'purple' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={item}
            className="glass-card p-6 rounded-3xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "p-3 rounded-2xl",
                stat.color === 'blue' && "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
                stat.color === 'red' && "bg-red-50 dark:bg-red-900/20 text-red-600",
                stat.color === 'emerald' && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
                stat.color === 'purple' && "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded-lg",
                stat.change.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <motion.div variants={item} className="glass-card p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search patients by name, ID, or email..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all text-sm">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all text-sm">
            <ArrowUpDown className="w-4 h-4" />
            <span>Sort</span>
          </button>
        </div>
      </motion.div>

      {/* Patients Table */}
      <motion.div variants={item} className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gender/Age</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Visit</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence>
                {filteredPatients.map((patient) => (
                  <motion.tr 
                    key={patient.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{patient.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID: #{patient.id.padStart(4, '0')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {patient.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {patient.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{patient.gender}, {patient.age}y</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{patient.lastVisit}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        patient.status === 'STABLE' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20",
                        patient.status === 'CRITICAL' && "bg-red-50 text-red-600 dark:bg-red-900/20",
                        patient.status === 'RECOVERING' && "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
                      )}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleViewPatient(patient)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all text-slate-400 hover:text-blue-600 shadow-sm"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-slate-600 shadow-sm"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePatient(patient)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all text-slate-400 hover:text-red-600 shadow-sm"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Showing {filteredPatients.length} of {patients.length} patients</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold disabled:opacity-50" disabled>Previous</button>
            <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold">Next</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Patients;
