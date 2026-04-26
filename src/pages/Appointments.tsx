import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Video,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Pencil,
  Trash2,
  Eye,
  Check,
  Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const Appointments: React.FC = () => {
  const appointmentsData = [
    { 
      id: 1, 
      patient: 'Jane Cooper', 
      doctor: 'Dr. Sarah Johnson', 
      time: '09:30 AM', 
      date: '2026-04-26', 
      type: 'Video Consultation', 
      status: 'Upcoming',
      avatar: 'JC'
    },
    { 
      id: 2, 
      patient: 'Robert Fox', 
      doctor: 'Dr. Michael Chen', 
      time: '11:00 AM', 
      date: '2026-04-26', 
      type: 'In-Person', 
      status: 'Confirmed',
      avatar: 'RF'
    },
    { 
      id: 3, 
      patient: 'Bessie Cooper', 
      doctor: 'Dr. Sarah Johnson', 
      time: '02:30 PM', 
      date: '2026-04-27', 
      type: 'Follow-up', 
      status: 'Pending',
      avatar: 'BC'
    },
  ];

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [appointmentsList, setAppointmentsList] = useState(appointmentsData);
  const [selectedAppointment, setSelectedAppointment] = useState<typeof appointmentsData[0] | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsBookModalOpen(false);
      }, 2000);
    }, 1500);
  };

  const handleViewAppointment = (apt: typeof appointmentsData[0]) => {
    setSelectedAppointment(apt);
    setIsViewModalOpen(true);
  };

  const handleEditAppointment = (apt: typeof appointmentsData[0]) => {
    setSelectedAppointment(apt);
    setIsEditModalOpen(true);
  };

  const handleDeleteAppointment = (apt: typeof appointmentsData[0]) => {
    setSelectedAppointment(apt);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setAppointmentsList(appointmentsList.filter(a => a.id !== selectedAppointment?.id));
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setSelectedAppointment(null);
    }, 1000);
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Book Appointment Modal */}
      <Modal 
        isOpen={isBookModalOpen} 
        onClose={() => !isSaving && setIsBookModalOpen(false)} 
        title="Book New Appointment"
        maxWidth="lg"
      >
        <div className="relative">
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Booking Success!</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">Appointment scheduled successfully.</p>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleBookAppointment}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Select Patient</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer" 
                  required
                  disabled={isSaving}
                >
                  <option value="">Search Patient...</option>
                  <option value="1">Jane Cooper</option>
                  <option value="2">Robert Fox</option>
                  <option value="3">Bessie Cooper</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Select Doctor</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer" 
                  required
                  disabled={isSaving}
                >
                  <option value="">Choose Specialist...</option>
                  <option value="1">Dr. Sarah Johnson (Cardiology)</option>
                  <option value="2">Dr. Michael Chen (Neurology)</option>
                  <option value="3">Dr. Alisa Ross (Pediatrics)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Appointment Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                  required 
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Preferred Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="time" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                  required 
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Visit Type</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer" 
                required
                disabled={isSaving}
              >
                <option value="in-person">In-Person Visit</option>
                <option value="video">Video Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Priority</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer" 
                required
                disabled={isSaving}
              >
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Reason for Visit</label>
            <textarea 
              placeholder="Briefly describe the symptoms or reason..." 
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[100px]" 
              required 
              disabled={isSaving}
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsBookModalOpen(false)} 
              disabled={isSaving}
              className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-2 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70"
            >
              {isSaving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : 'Confirm Appointment'}
            </button>
          </div>
          </form>
        </div>
      </Modal>

      {/* View Appointment Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Appointment Details"
        maxWidth="md"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xl font-black">
                {selectedAppointment.avatar}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedAppointment.patient}</h3>
                <p className="text-sm font-medium text-slate-500">{selectedAppointment.date} at {selectedAppointment.time}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Doctor</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedAppointment.doctor}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Type</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedAppointment.type}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mt-1",
                  selectedAppointment.status === 'Upcoming' && "bg-blue-50 text-blue-600",
                  selectedAppointment.status === 'Confirmed' && "bg-emerald-50 text-emerald-600",
                  selectedAppointment.status === 'Pending' && "bg-amber-50 text-amber-600",
                )}>
                  {selectedAppointment.status}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Time</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedAppointment.time}</p>
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
                Edit
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title="Delete Appointment"
        maxWidth="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Confirm Delete</h3>
          <p className="text-sm text-slate-500 mb-6">
            Are you sure you want to delete the appointment with <span className="font-bold text-red-500">{selectedAppointment?.patient}</span>?
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

      {/* Edit Appointment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Appointment"
        maxWidth="lg"
      >
        {selectedAppointment && (
          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault();
            setAppointmentsList(appointmentsList.map(a => a.id === selectedAppointment.id ? selectedAppointment : a));
            setIsEditModalOpen(false);
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Patient</label>
                <input 
                  type="text" 
                  value={selectedAppointment.patient}
                  onChange={(e) => setSelectedAppointment({ ...selectedAppointment, patient: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Doctor</label>
                <input 
                  type="text" 
                  value={selectedAppointment.doctor}
                  onChange={(e) => setSelectedAppointment({ ...selectedAppointment, doctor: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Date</label>
                <input 
                  type="date" 
                  value={selectedAppointment.date}
                  onChange={(e) => setSelectedAppointment({ ...selectedAppointment, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Time</label>
                <input 
                  type="time" 
                  value={selectedAppointment.time.replace(/ AM| PM/, '')}
                  onChange={(e) => setSelectedAppointment({ ...selectedAppointment, time: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Type</label>
                <select 
                  value={selectedAppointment.type}
                  onChange={(e) => setSelectedAppointment({ ...selectedAppointment, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="In-Person">In-Person</option>
                  <option value="Video Consultation">Video Consultation</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Status</label>
                <select 
                  value={selectedAppointment.status}
                  onChange={(e) => setSelectedAppointment({ ...selectedAppointment, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Appointments 🗓️
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your schedule and patient visits</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button 
              onClick={() => setView('list')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                view === 'list' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500"
              )}
            >
              List
            </button>
            <button 
              onClick={() => setView('calendar')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                view === 'calendar' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500"
              )}
            >
              Calendar
            </button>
          </div>
          <button 
            onClick={() => setIsBookModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Book Appointment</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by patient or doctor..." 
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {view === 'list' ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {appointmentsList.map((apt) => (
                  <motion.div 
                    key={apt.id}
                    variants={item}
                    className="glass-card p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xl font-black text-blue-600 shadow-inner">
                        {apt.avatar}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{apt.patient}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-1">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <User className="w-3.5 h-3.5" />
                            {apt.doctor}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {apt.date}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {apt.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mb-1",
                          apt.status === 'Upcoming' && "bg-blue-50 text-blue-600",
                          apt.status === 'Confirmed' && "bg-emerald-50 text-emerald-600",
                          apt.status === 'Pending' && "bg-amber-50 text-amber-600",
                        )}>
                          {apt.status}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{apt.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewAppointment(apt)}
                          className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleEditAppointment(apt)}
                          className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAppointment(apt)}
                          className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="calendar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card rounded-[2rem] p-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">April 2026</h2>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "aspect-square rounded-2xl p-2 border border-transparent transition-all cursor-pointer flex flex-col items-center justify-center gap-1",
                        i + 1 === 26 ? "bg-blue-600 text-white shadow-xl shadow-blue-500/25" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <span className="text-sm font-black">{i + 1}</span>
                      { (i + 1 === 26 || i + 1 === 27) && (
                        <div className={cn("w-1 h-1 rounded-full", i + 1 === 26 ? "bg-white" : "bg-blue-600")} />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <motion.div variants={item} className="glass-card p-6 rounded-3xl">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-6">Upcoming Events</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-l-4 border-blue-600">
                <p className="text-xs font-black text-blue-600 uppercase mb-1">Medical Seminar</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Heart Health 2026</p>
                <p className="text-[10px] text-slate-500 mt-2 font-bold">Starts in 2h • Zoom</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border-l-4 border-emerald-600">
                <p className="text-xs font-black text-emerald-600 uppercase mb-1">Staff Meeting</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Weekly Sync</p>
                <p className="text-[10px] text-slate-500 mt-2 font-bold">Tomorrow • Room 402</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-card p-6 rounded-3xl">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-6">Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Total Bookings</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">1,284</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Cancellations</span>
                <span className="text-sm font-black text-red-500">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Consultations</span>
                <span className="text-sm font-black text-emerald-500">842</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Appointments;
