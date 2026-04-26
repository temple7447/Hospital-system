import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Activity, 
  ClipboardList, 
  MoreVertical,
  CheckCircle2,
  Stethoscope,
  TrendingUp,
  Thermometer,
  Droplets,
  Heart,
  ExternalLink,
  Search,
  Pill,
  AlertCircle,
  Pencil,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
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

const chartData = [
  { name: 'Mon', patients: 12 },
  { name: 'Tue', patients: 18 },
  { name: 'Wed', patients: 15 },
  { name: 'Thu', patients: 22 },
  { name: 'Fri', patients: 20 },
  { name: 'Sat', patients: 8 },
  { name: 'Sun', patients: 5 },
];

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isSavingConsultation, setIsSavingConsultation] = useState(false);
  const [showConsultationSuccess, setShowConsultationSuccess] = useState(false);
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);
  const [showPrescriptionSuccess, setShowPrescriptionSuccess] = useState(false);

  // Appointment actions
  const [selectedAppointment, setSelectedAppointment] = useState<{ name: string; time: string; type: string; status: string; avatar: string } | null>(null);
  const [isViewAppointmentModalOpen, setIsViewAppointmentModalOpen] = useState(false);
  const [isEditAppointmentModalOpen, setIsEditAppointmentModalOpen] = useState(false);
  const [isDeleteAppointmentModalOpen, setIsDeleteAppointmentModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const appointmentsList = [
    { id: '1', name: 'Robert Fox', time: '09:00 AM', type: 'Check-up', status: 'Completed', avatar: 'RF' },
    { id: '2', name: 'Jane Cooper', time: '09:30 AM', type: 'Consultation', status: 'In Progress', avatar: 'JC' },
    { id: '3', name: 'Wade Warren', time: '10:15 AM', type: 'Follow-up', status: 'Waiting', avatar: 'WW' },
    { id: '4', name: 'Cody Fisher', time: '11:00 AM', type: 'Emergency', status: 'Waiting', avatar: 'CF' },
  ];
  const [appointments, setAppointments] = useState(appointmentsList);

  const handleViewAppointment = (apt: typeof appointmentsList[0]) => {
    setSelectedAppointment(apt);
    setIsViewAppointmentModalOpen(true);
  };

  const handleEditAppointment = (apt: typeof appointmentsList[0]) => {
    setSelectedAppointment(apt);
    setIsEditAppointmentModalOpen(true);
  };

  const handleDeleteAppointment = (apt: typeof appointmentsList[0]) => {
    setSelectedAppointment(apt);
    setIsDeleteAppointmentModalOpen(true);
  };

  const confirmDeleteAppointment = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setAppointments(appointments.filter(a => a.id !== selectedAppointment?.id));
      setIsDeleting(false);
      setIsDeleteAppointmentModalOpen(false);
      setSelectedAppointment(null);
    }, 1000);
  };

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConsultation(true);
    setTimeout(() => {
      setIsSavingConsultation(false);
      setShowConsultationSuccess(true);
      setTimeout(() => {
        setShowConsultationSuccess(false);
        setIsConsultationModalOpen(false);
      }, 2000);
    }, 1500);
  };

  const handlePrescriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrescription(true);
    setTimeout(() => {
      setIsSavingPrescription(false);
      setShowPrescriptionSuccess(true);
      setTimeout(() => {
        setShowPrescriptionSuccess(false);
        setIsPrescriptionModalOpen(false);
      }, 2000);
    }, 1500);
  };

  return (
    <>
      <motion.div 
        variants={container}
      initial="hidden"
      animate="show"
      className="p-4 lg:p-8 space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome, Dr. {user?.name.split(' ').pop()} 🩺
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">You have 12 appointments scheduled for today</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search patient..." className="bg-transparent border-none outline-none text-xs w-40" />
          </div>
          <button 
            onClick={() => setIsConsultationModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <ClipboardList className="w-5 h-5" />
            <span>Start Consultation</span>
          </button>
        </div>
      </div>

      {/* Current Patient Focus */}
      <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-500 rounded-full text-[10px] font-black uppercase tracking-wider">Current Patient</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Clock className="w-3 h-3" />
                  Started 12m ago
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-black border border-white/20">
                  JC
                </div>
                <div>
                  <h2 className="text-3xl font-black">Jane Cooper</h2>
                  <p className="text-slate-400 font-medium">Female, 28 years • ID: #P-1025</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Heart Rate</p>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-xl font-black">78 <span className="text-xs font-normal text-slate-400">bpm</span></span>
                  </div>
                </div>
                <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Blood Pressure</p>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span className="text-xl font-black">120/80 <span className="text-xs font-normal text-slate-400">mmHg</span></span>
                  </div>
                </div>
                <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Temperature</p>
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-amber-400" />
                    <span className="text-xl font-black">36.6 <span className="text-xs font-normal text-slate-400">°C</span></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between items-end gap-4">
              <button className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all">
                <ExternalLink className="w-6 h-6" />
              </button>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Complaint</p>
                <p className="text-lg font-bold">Severe migraine and light sensitivity for 3 days.</p>
              </div>
              <button 
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20"
              >
                Add Prescription
              </button>
            </div>
          </div>
          <Stethoscope className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: '428', change: '+5', icon: Users, color: 'blue' },
          { label: 'Avg. Consultation', value: '18m', change: '-2m', icon: Clock, color: 'purple' },
          { label: 'Surgeries', value: '12', change: '+2', icon: Activity, color: 'emerald' },
          { label: 'Rating', value: '4.9', change: '+0.1', icon: TrendingUp, color: 'amber' },
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
                stat.color === 'purple' && "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
                stat.color === 'emerald' && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
                stat.color === 'amber' && "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments Queue */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div variants={item} className="glass-card rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Today's Appointments</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Morning</button>
                <button className="px-3 py-1 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-400">Afternoon</button>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {appointments.map((apt, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 font-bold">
                      {apt.avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{apt.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {apt.time} • {apt.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      apt.status === 'Completed' && "bg-emerald-50 text-emerald-600",
                      apt.status === 'In Progress' && "bg-blue-50 text-blue-600",
                      apt.status === 'Waiting' && "bg-amber-50 text-amber-600",
                    )}>
                      {apt.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleViewAppointment(apt)}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm text-slate-400 hover:text-blue-600"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditAppointment(apt)}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm text-slate-400 hover:text-slate-600"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAppointment(apt)}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm text-slate-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 text-center">
              <button className="text-xs font-bold text-blue-600 uppercase tracking-widest">View Full Schedule</button>
            </div>
          </motion.div>

          {/* Activity Chart */}
          <motion.div variants={item} className="glass-card p-6 rounded-[2rem]">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-8">Weekly Patient Flow</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="doctorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#doctorFlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-8">
          {/* Messages / Notifications */}
          <motion.div variants={item} className="glass-card p-6 rounded-3xl">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-6">Staff Chat</h3>
            <div className="space-y-4">
              {[
                { name: 'Dr. Linda', msg: 'Patient #402 records are ready.', time: '2m ago' },
                { name: 'Nurse Joy', msg: 'ER needs a consultation in Rm 4.', time: '15m ago' },
                { name: 'Admin', msg: 'New schedule for next week posted.', time: '1h ago' },
              ].map((chat, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                    {chat.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{chat.name}</h4>
                      <span className="text-[10px] text-slate-400">{chat.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{chat.msg}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-95">
              Open Chat
            </button>
          </motion.div>

          {/* Quick Tasks */}
          <motion.div variants={item} className="glass-card p-6 rounded-3xl">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-6">Pending Tasks</h3>
            <div className="space-y-3">
              {[
                'Review Lab Results (4)',
                'Sign Prescriptions (12)',
                'Update Surgery Schedule',
                'Patient Follow-up calls',
              ].map((task, i) => (
                <label key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl cursor-pointer group transition-all">
                  <div className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{task}</span>
                </label>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>

    {/* Modals */}
    <Modal
      isOpen={isConsultationModalOpen}
      onClose={() => !isSavingConsultation && setIsConsultationModalOpen(false)}
      title="Patient Consultation"
      maxWidth="2xl"
    >
      <div className="relative">
        {showConsultationSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl text-center p-6"
          >
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Consultation Completed!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">The patient record has been updated successfully.</p>
          </motion.div>
        )}

        <form className="space-y-6" onSubmit={handleConsultationSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Symptoms</label>
              <div className="relative">
                <Activity className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                <textarea 
                  placeholder="Describe patient symptoms..." 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[100px] resize-none disabled:opacity-50" 
                  required 
                  disabled={isSavingConsultation}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Diagnosis</label>
              <div className="relative">
                <Stethoscope className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                <textarea 
                  placeholder="Enter clinical diagnosis..." 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[100px] resize-none disabled:opacity-50" 
                  required 
                  disabled={isSavingConsultation}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Treatment Plan</label>
            <div className="relative">
              <ClipboardList className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
              <textarea 
                placeholder="Outline the treatment plan and next steps..." 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[120px] resize-none disabled:opacity-50" 
                required 
                disabled={isSavingConsultation}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsConsultationModalOpen(false)}
              disabled={isSavingConsultation}
              className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSavingConsultation}
              className="flex-2 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70"
            >
              {isSavingConsultation ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : 'Complete Consultation'}
            </button>
          </div>
        </form>
      </div>
    </Modal>

    <Modal
      isOpen={isPrescriptionModalOpen}
      onClose={() => !isSavingPrescription && setIsPrescriptionModalOpen(false)}
      title="Add Prescription"
      maxWidth="lg"
    >
      <div className="relative">
        {showPrescriptionSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl text-center p-6"
          >
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Prescription Added!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">The prescription has been sent to the pharmacy.</p>
          </motion.div>
        )}

        <form className="space-y-6" onSubmit={handlePrescriptionSubmit}>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-amber-800 dark:text-amber-400">
              Ensure all dosage instructions are clear. Verify patient allergies before prescribing new medication.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Medication Name</label>
              <div className="relative">
                <Pill className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="e.g. Amoxicillin 500mg" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                  required 
                  disabled={isSavingPrescription}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Dosage</label>
                <input 
                  type="text" 
                  placeholder="e.g. 1 tablet" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                  required 
                  disabled={isSavingPrescription}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Frequency</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                  required 
                  disabled={isSavingPrescription}
                >
                  <option value="once">Once daily</option>
                  <option value="twice">Twice daily</option>
                  <option value="thrice">Three times daily</option>
                  <option value="four">Four times daily</option>
                  <option value="needed">As needed (PRN)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsPrescriptionModalOpen(false)}
              disabled={isSavingPrescription}
              className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSavingPrescription}
              className="flex-2 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70"
            >
              {isSavingPrescription ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : 'Confirm Prescription'}
            </button>
          </div>
        </form>
      </div>
    </Modal>

    {/* View Appointment Modal */}
    <Modal
      isOpen={isViewAppointmentModalOpen}
      onClose={() => setIsViewAppointmentModalOpen(false)}
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
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedAppointment.name}</h3>
              <p className="text-sm font-medium text-slate-500">Appointment #{selectedAppointment.id}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Time</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedAppointment.time}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Type</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedAppointment.type}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl col-span-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mt-1",
                selectedAppointment.status === 'Completed' && "bg-emerald-50 text-emerald-600",
                selectedAppointment.status === 'In Progress' && "bg-blue-50 text-blue-600",
                selectedAppointment.status === 'Waiting' && "bg-amber-50 text-amber-600",
              )}>
                {selectedAppointment.status}
              </span>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsViewAppointmentModalOpen(false)} 
              className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
            >
              Close
            </button>
            <button 
              type="button" 
              onClick={() => {
                setIsViewAppointmentModalOpen(false);
                setIsEditAppointmentModalOpen(true);
              }}
              className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </Modal>

    {/* Delete Appointment Modal */}
    <Modal
      isOpen={isDeleteAppointmentModalOpen}
      onClose={() => !isDeleting && setIsDeleteAppointmentModalOpen(false)}
      title="Delete Appointment"
      maxWidth="sm"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Confirm Delete</h3>
        <p className="text-sm text-slate-500 mb-6">
          Are you sure you want to delete the appointment with <span className="font-bold text-red-500">{selectedAppointment?.name}</span>?
        </p>
        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={() => setIsDeleteAppointmentModalOpen(false)} 
            disabled={isDeleting}
            className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={confirmDeleteAppointment}
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
      isOpen={isEditAppointmentModalOpen}
      onClose={() => setIsEditAppointmentModalOpen(false)}
      title="Edit Appointment"
      maxWidth="lg"
    >
      {selectedAppointment && (
        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          setAppointments(appointments.map(a => a.id === selectedAppointment.id ? { ...selectedAppointment, id: a.id } : a));
          setIsEditAppointmentModalOpen(false);
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Patient Name</label>
              <input 
                type="text" 
                value={selectedAppointment.name}
                onChange={(e) => setSelectedAppointment({ ...selectedAppointment, name: e.target.value })}
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
                <option value="Check-up">Check-up</option>
                <option value="Consultation">Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Status</label>
              <select 
                value={selectedAppointment.status}
                onChange={(e) => setSelectedAppointment({ ...selectedAppointment, status: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="Waiting">Waiting</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsEditAppointmentModalOpen(false)} 
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
  </>
);
};

export default DoctorDashboard;
