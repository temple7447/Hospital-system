import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Phone,
  CreditCard,
  UserPlus,
  MapPin,
  User,
  Heart,
  Stethoscope,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { QuickStats } from '../components/QuickStats';
import { DoctorAvailability } from '../components/DoctorAvailability';
import { ArrivalQueue } from '../components/ArrivalQueue';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const ReceptionistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const [isSavingCheckIn, setIsSavingCheckIn] = useState(false);
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const [isRegisteringPatient, setIsRegisteringPatient] = useState(false);
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);

  interface Arrival {
    id: string;
    name: string;
    idP: string;
    time: string;
    dr: string;
    status: 'Arrived' | 'In Transit' | 'Delayed';
    location: string;
  }

  const initialArrivals: Arrival[] = [
    { id: '1', name: 'Albert Flores', idP: '#P-1024', time: '10:15 AM', dr: 'Dr. Johnson', status: 'Arrived', location: 'Waiting Area A' },
    { id: '2', name: 'Bessie Cooper', idP: '#P-1025', time: '10:30 AM', dr: 'Dr. Smith', status: 'In Transit', location: 'On the way' },
    { id: '3', name: 'Courtney Henry', idP: '#P-1026', time: '10:45 AM', dr: 'Dr. Wilson', status: 'Arrived', location: 'Waiting Area B' },
    { id: '4', name: 'Dianne Russell', idP: '#P-1027', time: '11:00 AM', dr: 'Dr. Lee', status: 'Delayed', location: '-' },
  ];

  const statsData = [
    { label: "Today's Appointments", value: '42', change: '+5', icon: Calendar, color: 'blue' },
    { label: 'Checked In', value: '28', change: '65%', icon: CheckCircle2, color: 'emerald' },
    { label: 'Pending Payment', value: '12', change: '$1.2k', icon: CreditCard, color: 'amber' },
    { label: 'Avg. Wait Time', value: '14m', change: '-2m', icon: Loader2, color: 'purple' },
  ];

  const doctorsData = [
    { name: 'Dr. Johnson', department: 'Cardiology', status: 'Available' as const, room: 'Rm 402' },
    { name: 'Dr. Smith', department: 'Pediatrics', status: 'In Session' as const, room: 'Rm 201' },
    { name: 'Dr. Wilson', department: 'Neurology', status: 'On Break' as const, room: 'Lounge' },
    { name: 'Dr. Lee', department: 'General', status: 'Available' as const, room: 'Rm 105' },
  ];

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCheckIn(true);
    setTimeout(() => {
      setIsSavingCheckIn(false);
      setShowCheckInSuccess(true);
      setTimeout(() => {
        setShowCheckInSuccess(false);
        setIsCheckInModalOpen(false);
      }, 2000);
    }, 1500);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisteringPatient(true);
    setTimeout(() => {
      setIsRegisteringPatient(false);
      setShowRegisterSuccess(true);
      setTimeout(() => {
        setShowRegisterSuccess(false);
        setIsRegisterModalOpen(false);
      }, 2000);
    }, 1500);
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 lg:p-8 space-y-8"
    >
      {/* New Check-in Modal */}
      <Modal 
        isOpen={isCheckInModalOpen} 
        onClose={() => !isSavingCheckIn && setIsCheckInModalOpen(false)} 
        title="Patient Arrival Check-in"
        maxWidth="lg"
      >
        <div className="relative">
          {showCheckInSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Check-in Complete!</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">Patient added to arrival queue.</p>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleCheckInSubmit}>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-blue-800 dark:text-blue-400">
                Verify patient ID and update contact information before completing the check-in process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Patient Name/ID</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search registered patient..." 
                    disabled={isSavingCheckIn}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Appointment</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    disabled={isSavingCheckIn}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                    required
                  >
                    <option value="">Select Scheduled Slot...</option>
                    <option value="1">10:15 AM - Dr. Johnson</option>
                    <option value="2">10:45 AM - Dr. Wilson</option>
                    <option value="walk-in">Walk-in (No Appointment)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Assigned Room</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    disabled={isSavingCheckIn}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                    required
                  >
                    <option value="waiting-a">Waiting Area A</option>
                    <option value="waiting-b">Waiting Area B</option>
                    <option value="rm-101">Examination Room 101</option>
                    <option value="rm-102">Examination Room 102</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Primary Complaint</label>
                <div className="relative">
                  <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. Headache, Fever..." 
                    disabled={isSavingCheckIn}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Initial Vitals Taken?</label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="vitals" disabled={isSavingCheckIn} className="w-4 h-4 text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="vitals" disabled={isSavingCheckIn} className="w-4 h-4 text-blue-600 focus:ring-blue-500 disabled:opacity-50" defaultChecked />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Pending</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsCheckInModalOpen(false)} 
                disabled={isSavingCheckIn}
                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSavingCheckIn}
                className="flex-2 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70"
              >
                {isSavingCheckIn ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : 'Confirm Check-in'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Register Patient Modal */}
      <Modal 
        isOpen={isRegisterModalOpen} 
        onClose={() => !isRegisteringPatient && setIsRegisterModalOpen(false)} 
        title="Register New Patient"
        maxWidth="2xl"
      >
        <div className="relative">
          {showRegisterSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Registration Success!</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">Patient record has been created.</p>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleRegisterSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    disabled={isRegisteringPatient}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date" 
                    disabled={isRegisteringPatient}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Gender</label>
                <select 
                  disabled={isRegisteringPatient}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Blood Group</label>
                <div className="relative">
                  <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    disabled={isRegisteringPatient}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                    required
                  >
                    <option value="">Select Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="tel" 
                    placeholder="+1 234 567 890" 
                    disabled={isRegisteringPatient}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="john@example.com" 
                    disabled={isRegisteringPatient}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                <textarea 
                  placeholder="Full residential address..." 
                  disabled={isRegisteringPatient}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[80px] resize-none disabled:opacity-50" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Emergency Contact Name</label>
                <input 
                  type="text" 
                  placeholder="Jane Doe" 
                  disabled={isRegisteringPatient}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Emergency Contact Phone</label>
                <input 
                  type="tel" 
                  placeholder="+1 234 567 890" 
                  disabled={isRegisteringPatient}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                  required 
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsRegisterModalOpen(false)} 
                disabled={isRegisteringPatient}
                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isRegisteringPatient}
                className="flex-2 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70"
              >
                {isRegisteringPatient ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registering...</span>
                  </div>
                ) : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Reception Desk
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Hello, {user?.name.split(' ')[0]}. Manage patient arrivals and scheduling.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCheckInModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            <span>New Check-in</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats stats={statsData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Arrival Queue */}
          <motion.div variants={item}>
            <ArrivalQueue 
              arrivals={initialArrivals}
              className="w-full"
            />
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Register Patient', icon: UserPlus, color: 'blue', onClick: () => setIsRegisterModalOpen(true) },
              { label: 'Reschedule', icon: Calendar, color: 'purple', onClick: () => {} },
              { label: 'Billing/Invoicing', icon: CreditCard, color: 'amber', onClick: () => {} },
              { label: 'Contact Support', icon: Phone, color: 'emerald', onClick: () => {} },
            ].map((action, i) => (
              <motion.button 
                key={i}
                onClick={action.onClick}
                variants={item}
                className="glass-card p-4 rounded-3xl flex flex-col items-center gap-3 hover:bg-white dark:hover:bg-slate-800 transition-all group text-center"
              >
                <div className={cn(
                  "p-3 rounded-2xl group-hover:scale-110 transition-transform",
                  action.color === 'blue' && "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
                  action.color === 'purple' && "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
                  action.color === 'amber' && "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
                  action.color === 'emerald' && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
                )}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <motion.div variants={item}>
            <DoctorAvailability doctors={doctorsData} className="glass-card p-6 rounded-3xl" />
          </motion.div>

          {/* Facility Status */}
          <motion.div variants={item} className="glass-card p-6 rounded-3xl">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-6">Facility Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Rooms</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">124</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Available</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">18</p>
              </div>
            </div>
            <div className="mt-4 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Cleaning in Progress</span>
              </div>
              <span className="text-xs font-black text-slate-400">4 Rooms</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReceptionistDashboard;