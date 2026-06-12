import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Eye,
  Baby,
  Droplets,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import Modal from '@/components/Modal';
import { listPatients, createPatient, updatePatient, deletePatient } from '@/lib/services';
import type { Patient, BloodType } from '@/types';

const FileText = LucideFileText;

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

const today = () => new Date().toISOString().slice(0, 10);

const calcAge = (dob: string) => {
  const bd = new Date(dob);
  const diff = Date.now() - bd.getTime();
  return Math.floor(diff / 31557600000);
};

const statusColors: Record<Patient['status'], string> = {
  active: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
  inactive: 'bg-slate-100 text-slate-500 dark:bg-slate-800',
  deceased: 'bg-red-50 text-red-600 dark:bg-red-900/20',
};

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add form state
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: '' as Patient['gender'] | '',
    bloodType: '' as BloodType | '', address: '',
  });

  // Edit form state
  const [editData, setEditData] = useState<Patient | null>(null);

  const loadPatients = async () => {
    const data = await listPatients({ limit: 500 });
    setPatients(data);
  };

  useEffect(() => { loadPatients(); }, []);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingPatient(true);
    try {
      await createPatient({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as Patient['gender'],
        bloodType: formData.bloodType as BloodType,
        address: formData.address,
        city: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        allergies: [],
        chronicConditions: [],
      });
      await loadPatients();
      setShowAddSuccess(true);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '', bloodType: '', address: '' });
      setTimeout(() => { setShowAddSuccess(false); setIsAddModalOpen(false); }, 2000);
    } finally {
      setIsAddingPatient(false);
    }
  };

  const handleViewPatient = (patient: Patient) => {
    navigate(`/patients/${patient.id}`);
  };

  const handleDeletePatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteModalOpen(true);
  };

  const handleEditClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditData({ ...patient });
    setIsEditModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPatient) return;
    setIsDeleting(true);
    try {
      await deletePatient(selectedPatient.id);
      await loadPatients();
      setIsDeleteModalOpen(false);
      setSelectedPatient(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    await updatePatient(editData.id, {
      firstName: editData.firstName,
      lastName: editData.lastName,
      email: editData.email,
      phone: editData.phone,
      dateOfBirth: editData.dateOfBirth,
      gender: editData.gender,
      bloodType: editData.bloodType,
      address: editData.address,
    });
    await loadPatients();
    setIsEditModalOpen(false);
  };

  const filteredPatients = patients.filter(p => {
    const t = searchTerm.toLowerCase();
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(t) || p.email.toLowerCase().includes(t) || p.patientNumber.toLowerCase().includes(t) || p.phone.includes(t);
  });

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
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-md"
            >
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Registration Success!</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-center max-w-xs">The new patient has been registered in the system.</p>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleAddPatient}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. John" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                    disabled={isAddingPatient}
                    value={formData.firstName}
                    onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. Doe" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                    disabled={isAddingPatient}
                    value={formData.lastName}
                    onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="e.g. john@example.com" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                    disabled={isAddingPatient}
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="tel" 
                    placeholder="e.g. +1 234 567 890" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                    disabled={isAddingPatient}
                    value={formData.phone}
                    onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                    disabled={isAddingPatient}
                    value={formData.dateOfBirth}
                    onChange={e => setFormData(f => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Gender</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                  required 
                  disabled={isAddingPatient}
                  value={formData.gender}
                  onChange={e => setFormData(f => ({ ...f, gender: e.target.value as Patient['gender'] }))}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Blood Group</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                  required 
                  disabled={isAddingPatient}
                  value={formData.bloodType}
                  onChange={e => setFormData(f => ({ ...f, bloodType: e.target.value as BloodType }))}
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
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. 123 Healthcare Ave" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                    disabled={isAddingPatient}
                    value={formData.address}
                    onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)} 
                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-semibold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
                disabled={isAddingPatient}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-[2] px-12 py-4 bg-blue-600 text-white rounded-md font-semibold uppercase tracking-widest text-[10px]  hover:bg-blue-700 transition-all  disabled:opacity-70 flex items-center justify-center gap-2"
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
              <div className="w-20 h-20 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-2xl font-semibold">
                {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{`${selectedPatient.firstName} ${selectedPatient.lastName}`}</h3>
                <p className="text-sm font-medium text-slate-500">ID: #{selectedPatient.patientNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedPatient.email}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                <p className="text-xs font-bold text-slate-400 uppercase">Phone</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedPatient.phone}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                <p className="text-xs font-bold text-slate-400 uppercase">Gender / Age</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedPatient.gender}, {calcAge(selectedPatient.dateOfBirth)}y</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                <p className="text-xs font-bold text-slate-400 uppercase">Blood Type</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedPatient.bloodType}</p>
              </div>
            </div>
            {selectedPatient.address && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-md">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                {selectedPatient.address}{selectedPatient.city ? `, ${selectedPatient.city}` : ''}
              </div>
            )}
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsViewModalOpen(false)} 
                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-semibold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
              >
                Close
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditClick(selectedPatient);
                }}
                className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-md font-semibold uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all"
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Confirm Delete</h3>
          <p className="text-sm text-slate-500 mb-6">
            Are you sure you want to delete <span className="font-bold text-red-500">{selectedPatient && `${selectedPatient.firstName} ${selectedPatient.lastName}`}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={() => setIsDeleteModalOpen(false)} 
              disabled={isDeleting}
              className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-semibold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 px-6 py-4 bg-red-600 text-white rounded-md font-semibold uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
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
        {editData && (
          <form className="space-y-6" onSubmit={handleEditSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">First Name</label>
                <input 
                  type="text" 
                  value={editData.firstName}
                  onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Last Name</label>
                <input 
                  type="text" 
                  value={editData.lastName}
                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                <input 
                  type="email" 
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={editData.dateOfBirth}
                  onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Gender</label>
                <select 
                  value={editData.gender}
                  onChange={(e) => setEditData({ ...editData, gender: e.target.value as Patient['gender'] })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Blood Type</label>
                <select 
                  value={editData.bloodType}
                  onChange={(e) => setEditData({ ...editData, bloodType: e.target.value as BloodType })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
                >
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
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Status</label>
                <select 
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as Patient['status'] })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-semibold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-[2] px-12 py-4 bg-blue-600 text-white rounded-md font-semibold uppercase tracking-widest text-[10px]  hover:bg-blue-700 transition-all"
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
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Patients</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and monitor hospital patients</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-bold transition-all  "
        >
          <UserPlus className="w-5 h-5" />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: String(patients.length), change: '+12', icon: UserPlus, color: 'blue' },
          { label: 'Active Patients', value: String(patients.filter(p => p.status === 'active').length), change: '+8', icon: Activity, color: 'emerald' },
          { label: 'Inactive', value: String(patients.filter(p => p.status === 'inactive').length), change: '-2', icon: Heart, color: 'amber' },
          { label: 'Today\'s Check-ins', value: String(patients.filter(p => p.registeredAt.startsWith(today())).length), change: '+5', icon: Calendar, color: 'purple' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={item}
            className="glass-card p-6 rounded-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "p-3 rounded-md",
                stat.color === 'blue' && "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
                stat.color === 'emerald' && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
                stat.color === 'amber' && "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
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
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <motion.div variants={item} className="glass-card p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search patients by name, ID, or email..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-md focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-md font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all text-sm">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-md font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all text-sm">
            <ArrowUpDown className="w-4 h-4" />
            <span>Sort</span>
          </button>
        </div>
      </motion.div>

      {/* Patients Table */}
      <motion.div variants={item} className="glass-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gender/Age</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Type</th>
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
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{`${patient.firstName} ${patient.lastName}`}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID: #{patient.patientNumber}</div>
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
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{patient.gender}, {calcAge(patient.dateOfBirth)}y</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <Droplets className="w-3.5 h-3.5 text-red-400" />
                        {patient.bloodType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                        statusColors[patient.status]
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
                          onClick={() => handleEditClick(patient)}
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
            <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold disabled:opacity-50" disabled>Previous</button>
            <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold">Next</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Patients;
