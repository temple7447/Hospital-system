import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Activity, 
  Pill, 
  MessageSquare, 
  ChevronRight,
  Video,
  AlertCircle,
  Download,
  Stethoscope,
  Heart,
  User,
  Send,
  PlusCircle,
  CheckCircle2,
  Pencil,
  Trash2,
  Eye,
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

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  // Submission States
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [showAppointmentSuccess, setShowAppointmentSuccess] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showMessageSuccess, setShowMessageSuccess] = useState(false);

  // Medical Reports actions
  interface Report {
    id: string;
    name: string;
    date: string;
    size: string;
    status: string;
  }

  const initialReports: Report[] = [
    { id: '1', name: 'Blood Test Results', date: 'Oct 12, 2024', size: '1.2 MB', status: 'Available' },
    { id: '2', name: 'X-Ray Chest', date: 'Oct 05, 2024', size: '4.5 MB', status: 'Available' },
    { id: '3', name: 'Cardiology Report', date: 'Sep 28, 2024', size: '2.8 MB', status: 'Available' },
  ];
  const [reportsList, setReportsList] = useState(initialReports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isViewReportModalOpen, setIsViewReportModalOpen] = useState(false);
  const [isEditReportModalOpen, setIsEditReportModalOpen] = useState(false);
  const [isDeleteReportModalOpen, setIsDeleteReportModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setIsViewReportModalOpen(true);
  };

  const handleEditReport = (report: Report) => {
    setSelectedReport(report);
    setIsEditReportModalOpen(true);
  };

  const handleDeleteReport = (report: Report) => {
    setSelectedReport(report);
    setIsDeleteReportModalOpen(true);
  };

  const confirmDeleteReport = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setReportsList(reportsList.filter(r => r.id !== selectedReport?.id));
      setIsDeleting(false);
      setIsDeleteReportModalOpen(false);
      setSelectedReport(null);
    }, 1000);
  };

  // Submit Handlers
  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAppointment(true);
    // Simulate API call
    setTimeout(() => {
      setIsSavingAppointment(false);
      setShowAppointmentSuccess(true);
      setTimeout(() => {
        setShowAppointmentSuccess(false);
        setIsAppointmentModalOpen(false);
      }, 2000);
    }, 1500);
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingMessage(true);
    // Simulate API call
    setTimeout(() => {
      setIsSendingMessage(false);
      setShowMessageSuccess(true);
      setTimeout(() => {
        setShowMessageSuccess(false);
        setIsMessageModalOpen(false);
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
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Your health summary and upcoming appointments</p>
          </div>
          <button 
            onClick={() => setIsAppointmentModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <Calendar className="w-5 h-5" />
            <span>Book Appointment</span>
          </button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Appointments & Records */}
        <div className="lg:col-span-2 space-y-8">
          {/* Next Appointment Card */}
          <motion.div variants={item} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider">Upcoming Visit</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Stethoscope className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Dr. Sarah Johnson</h3>
                    <p className="text-blue-100 font-medium">Cardiology Specialist</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Date</p>
                    <p className="text-xl font-black">Oct 24</p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Time</p>
                    <p className="text-xl font-black">09:30 AM</p>
                  </div>
                  <button className="p-4 bg-white text-blue-600 rounded-2xl hover:scale-110 transition-transform">
                    <Video className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
            <Activity className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
          </motion.div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'My Records', icon: FileText, color: 'blue', action: () => {} },
              { label: 'Prescriptions', icon: Pill, color: 'emerald', action: () => {} },
              { label: 'Messages', icon: MessageSquare, color: 'purple', action: () => setIsMessageModalOpen(true) },
              { label: 'Vitals', icon: Heart, color: 'red', action: () => {} },
            ].map((action, i) => (
              <motion.button 
                key={i}
                variants={item}
                onClick={action.action}
                className="glass-card p-4 rounded-3xl flex flex-col items-center gap-3 hover:bg-white dark:hover:bg-slate-800 transition-all group"
              >
                <div className={cn(
                  "p-3 rounded-2xl group-hover:scale-110 transition-transform",
                  action.color === 'blue' && "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
                  action.color === 'emerald' && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
                  action.color === 'purple' && "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
                  action.color === 'red' && "bg-red-50 dark:bg-red-900/20 text-red-600",
                )}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{action.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Recent Reports Table */}
          <motion.div variants={item} className="glass-card rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Medical Reports</h3>
              <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reportsList.map((report, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{report.name}</h4>
                      <p className="text-[10px] font-medium text-slate-500">{report.date} • {report.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleViewReport(report)}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all text-slate-400 hover:text-blue-600"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all text-slate-400 hover:text-blue-600">
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEditReport(report)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteReport(report)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all text-slate-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Vitals & Prescriptions */}
        <div className="space-y-8">
          {/* Health Vitals Summary */}
          <motion.div variants={item} className="glass-card p-6 rounded-3xl space-y-6">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Latest Vitals</h3>
            <div className="space-y-4">
              {[
                { label: 'Heart Rate', value: '72', unit: 'bpm', trend: 'stable', color: 'red' },
                { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', trend: 'good', color: 'blue' },
                { label: 'Blood Sugar', value: '98', unit: 'mg/dL', trend: 'good', color: 'emerald' },
              ].map((vital, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{vital.label}</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{vital.value} <span className="text-xs font-medium text-slate-500">{vital.unit}</span></p>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                    vital.color === 'red' && "bg-red-50 text-red-600",
                    vital.color === 'blue' && "bg-blue-50 text-blue-600",
                    vital.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                  )}>
                    {vital.trend}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Active Medications */}
          <motion.div variants={item} className="glass-card p-6 rounded-3xl">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-6">Current Medications</h3>
            <div className="space-y-4">
              {[
                { name: 'Atorvastatin', dosage: '20mg', schedule: 'Once daily (Night)', remaining: '12 days' },
                { name: 'Lisinopril', dosage: '10mg', schedule: 'Once daily (Morning)', remaining: '24 days' },
              ].map((pill, i) => (
                <div key={i} className="relative pl-4 border-l-4 border-blue-500 py-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{pill.name} <span className="text-xs font-medium text-slate-400">({pill.dosage})</span></h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">{pill.schedule}</p>
                  <p className="text-[10px] font-bold text-blue-600 mt-2 uppercase tracking-widest">{pill.remaining} left</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">
              Request Refill
            </button>
          </motion.div>

          {/* Health Tips / Alert */}
          <motion.div variants={item} className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
            <div className="flex gap-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl shrink-0 h-fit">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">Flu Season Alert</h4>
                <p className="text-xs text-amber-700/80 dark:text-amber-200/60 mt-1 leading-relaxed">Flu shots are now available. Visit the clinic or book an appointment online to stay protected.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>

    {/* Modals */}
    <Modal
      isOpen={isAppointmentModalOpen}
      onClose={() => !isSavingAppointment && !showAppointmentSuccess && setIsAppointmentModalOpen(false)}
      title="Book New Appointment"
      maxWidth="2xl"
    >
      <div className="relative">
        <form className="space-y-6" onSubmit={handleAppointmentSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Department</label>
              <div className="relative">
                <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  disabled={isSavingAppointment}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                  required
                >
                  <option value="">Select Department</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="neurology">Neurology</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="general">General Medicine</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Doctor</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  disabled={isSavingAppointment}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                  required
                >
                  <option value="">Select Doctor</option>
                  <option value="dr-johnson">Dr. Sarah Johnson</option>
                  <option value="dr-smith">Dr. Michael Smith</option>
                  <option value="dr-lee">Dr. Emily Lee</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Preferred Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  disabled={isSavingAppointment}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Preferred Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  disabled={isSavingAppointment}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                  required
                >
                  <option value="">Select Time Slot</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Reason for Visit</label>
            <textarea 
              disabled={isSavingAppointment}
              placeholder="Briefly describe your symptoms or reason for the visit..." 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[100px] resize-none disabled:opacity-50" 
              required 
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              disabled={isSavingAppointment}
              onClick={() => setIsAppointmentModalOpen(false)}
              className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSavingAppointment}
              className="flex-2 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70"
            >
              {isSavingAppointment ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Booking...</span>
                </div>
              ) : 'Confirm Booking'}
            </button>
          </div>
        </form>

        {/* Success Overlay */}
        {showAppointmentSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl"
          >
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Booking Success!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-center max-w-xs">Your appointment has been scheduled successfully.</p>
          </motion.div>
        )}
      </div>
    </Modal>

    <Modal
      isOpen={isMessageModalOpen}
      onClose={() => !isSendingMessage && !showMessageSuccess && setIsMessageModalOpen(false)}
      title="Message Doctor"
      maxWidth="lg"
    >
      <div className="relative">
        <form className="space-y-6" onSubmit={handleMessageSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Recipient</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  disabled={isSendingMessage}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                  required
                >
                  <option value="">Select Doctor</option>
                  <option value="dr-johnson">Dr. Sarah Johnson (Cardiology)</option>
                  <option value="dr-smith">Dr. Michael Smith (Neurology)</option>
                  <option value="dr-lee">Dr. Emily Lee (Pediatrics)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Subject</label>
              <input 
                type="text" 
                disabled={isSendingMessage}
                placeholder="e.g. Question about my prescription" 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Message</label>
              <textarea 
                disabled={isSendingMessage}
                placeholder="Type your message here..." 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[150px] resize-none disabled:opacity-50" 
                required 
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              disabled={isSendingMessage}
              onClick={() => setIsMessageModalOpen(false)}
              className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSendingMessage}
              className="flex-2 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSendingMessage ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Success Overlay */}
        {showMessageSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl"
          >
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Message Sent!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-center max-w-xs">Your message has been delivered to the doctor.</p>
          </motion.div>
        )}
      </div>
    </Modal>

    {/* View Report Modal */}
    <Modal
      isOpen={isViewReportModalOpen}
      onClose={() => setIsViewReportModalOpen(false)}
      title="Report Details"
      maxWidth="md"
    >
      {selectedReport && (
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedReport.name}</h3>
              <p className="text-sm font-medium text-slate-500">ID: #{selectedReport.id}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Date</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedReport.date}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Size</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedReport.size}</p>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsViewReportModalOpen(false)} 
              className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
            >
              Close
            </button>
            <button className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      )}
    </Modal>

    {/* Delete Report Modal */}
    <Modal
      isOpen={isDeleteReportModalOpen}
      onClose={() => !isDeleting && setIsDeleteReportModalOpen(false)}
      title="Delete Report"
      maxWidth="sm"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Confirm Delete</h3>
        <p className="text-sm text-slate-500 mb-6">
          Are you sure you want to delete <span className="font-bold text-red-500">{selectedReport?.name}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={() => setIsDeleteReportModalOpen(false)} 
            disabled={isDeleting}
            className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={confirmDeleteReport}
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

    {/* Edit Report Modal */}
    <Modal
      isOpen={isEditReportModalOpen}
      onClose={() => setIsEditReportModalOpen(false)}
      title="Edit Report"
      maxWidth="lg"
    >
      {selectedReport && (
        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          setReportsList(reportsList.map(r => r.id === selectedReport.id ? selectedReport : r));
          setIsEditReportModalOpen(false);
        }}>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Report Title</label>
            <input 
              type="text" 
              value={selectedReport.name}
              onChange={(e) => setSelectedReport({ ...selectedReport, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsEditReportModalOpen(false)} 
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

export default PatientDashboard;
