import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Activity, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  FileText as LucideFileText,
  Stethoscope,
  Heart,
  Droplets,
  Thermometer,
  ShieldCheck,
  Building2,
  DollarSign,
  UserPlus,
  Megaphone,
  Mail,
  Briefcase,
  Pencil,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
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

const revenueData = [
  { name: 'Mon', revenue: 4200, expenses: 2100 },
  { name: 'Tue', revenue: 5100, expenses: 2400 },
  { name: 'Wed', revenue: 4800, expenses: 2200 },
  { name: 'Thu', revenue: 6200, expenses: 2800 },
  { name: 'Fri', revenue: 5800, expenses: 2600 },
  { name: 'Sat', revenue: 3400, expenses: 1800 },
  { name: 'Sun', revenue: 2800, expenses: 1500 },
];

const departmentData = [
  { name: 'Cardiology', value: 35, color: '#3b82f6' },
  { name: 'Pediatrics', value: 25, color: '#10b981' },
  { name: 'Neurology', value: 20, color: '#8b5cf6' },
  { name: 'Orthopedics', value: 20, color: '#f59e0b' },
];

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isViewStaffModalOpen, setIsViewStaffModalOpen] = useState(false);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [isDeleteStaffModalOpen, setIsDeleteStaffModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const staffData: StaffMember[] = [
    { id: '1', name: 'Dr. Sarah Johnson', role: 'Head of Cardiology', department: 'Cardiology', email: 's.johnson@hospital.com', status: 'Active' },
    { id: '2', name: 'Michael Chen', role: 'Admin Assistant', department: 'Administration', email: 'm.chen@hospital.com', status: 'Active' },
    { id: '3', name: 'Nurse Joy', role: 'Head Nurse', department: 'Emergency', email: 'joy.martinez@hospital.com', status: 'On Leave' },
    { id: '4', name: 'Dr. Michael Chen', role: 'Neurologist', department: 'Neurology', email: 'm.chen2@hospital.com', status: 'Active' },
    { id: '5', name: 'Emily Davis', role: 'Receptionist', department: 'Reception', email: 'e.davis@hospital.com', status: 'Active' },
  ];
  const [staffList, setStaffList] = useState(staffData);
  
  // Submission states
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [showStaffSuccess, setShowStaffSuccess] = useState(false);
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  const [showAnnouncementSuccess, setShowAnnouncementSuccess] = useState(false);

  const handleViewStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsViewStaffModalOpen(true);
  };

  const handleEditStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsEditStaffModalOpen(true);
  };

  const handleDeleteStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsDeleteStaffModalOpen(true);
  };

  const confirmDeleteStaff = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setStaffList(staffList.filter(s => s.id !== selectedStaff?.id));
      setIsDeleting(false);
      setIsDeleteStaffModalOpen(false);
      setSelectedStaff(null);
    }, 1000);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStaff(true);
    // Simulate API call
    setTimeout(() => {
      setIsSavingStaff(false);
      setShowStaffSuccess(true);
      setTimeout(() => {
        setShowStaffSuccess(false);
        setIsAddStaffModalOpen(false);
      }, 2000);
    }, 1500);
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPostingAnnouncement(true);
    // Simulate API call
    setTimeout(() => {
      setIsPostingAnnouncement(false);
      setShowAnnouncementSuccess(true);
      setTimeout(() => {
        setShowAnnouncementSuccess(false);
        setIsAnnouncementModalOpen(false);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hospital Administration 🏛️
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Global overview and facility management</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAnnouncementModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 border border-slate-200 dark:border-slate-700"
          >
            <Megaphone className="w-5 h-5 text-amber-500" />
            <span>Post Announcement</span>
          </button>
          <button 
            onClick={() => setIsAddStaffModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add Staff</span>
          </button>
          <button className="flex items-center justify-center p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-all hover:bg-slate-200 active:scale-95">
            <ShieldCheck className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: '$124,500', change: '+12.5%', icon: DollarSign, color: 'emerald' },
          { label: 'Active Staff', value: '156', change: '+4', icon: Users, color: 'blue' },
          { label: 'Bed Occupancy', value: '84%', change: '+2.1%', icon: Building2, color: 'purple' },
          { label: 'Critical Alerts', value: '3', change: '-1', icon: AlertCircle, color: 'red' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={item}
            className="glass-card p-6 rounded-3xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "p-3 rounded-2xl",
                stat.color === 'emerald' && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
                stat.color === 'blue' && "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
                stat.color === 'purple' && "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
                stat.color === 'red' && "bg-red-50 dark:bg-red-900/20 text-red-600",
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={cn(
                "text-[10px] font-black px-2 py-1 rounded-lg",
                stat.change.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Analytics */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div variants={item} className="glass-card p-6 rounded-[2rem]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Financial Performance</h3>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="text-[10px] font-bold text-slate-500">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-bold text-slate-500">Expenses</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#adminRevenue)" />
                  <Area type="monotone" dataKey="expenses" stroke="#cbd5e1" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Department Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div variants={item} className="glass-card p-6 rounded-[2rem]">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-6">Patient Load</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {departmentData.map((dept, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{dept.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={item} className="glass-card p-6 rounded-[2rem] flex flex-col justify-between">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-4">Resource Status</h3>
              <div className="space-y-4">
                {[
                  { label: 'Oxygen Supply', value: 92, color: 'blue' },
                  { label: 'Blood Bank', value: 45, color: 'amber' },
                  { label: 'Medical Supplies', value: 78, color: 'emerald' },
                ].map((resource, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{resource.label}</span>
                      <span className="text-[10px] font-black text-slate-900 dark:text-white">{resource.value}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${resource.value}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={cn(
                          "h-full rounded-full",
                          resource.color === 'blue' && "bg-blue-600",
                          resource.color === 'amber' && "bg-amber-500",
                          resource.color === 'emerald' && "bg-emerald-500",
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 transition-all">
                Inventory Report
              </button>
            </motion.div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Critical Alerts */}
          <motion.div variants={item} className="glass-card p-6 rounded-3xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
            <h3 className="font-black text-red-600 uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Critical Alerts
            </h3>
            <div className="space-y-4">
              {[
                { title: 'Server Latency', desc: 'High load on primary database.', time: '2m ago' },
                { title: 'ER Overload', desc: 'Waiting time exceeding 2 hours.', time: '15m ago' },
                { title: 'Blood Bank', desc: 'Type O- levels below threshold.', time: '1h ago' },
              ].map((alert, i) => (
                <div key={i} className="relative pl-4 border-l-4 border-red-500 py-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{alert.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{alert.desc}</p>
                  <p className="text-[8px] text-red-400 mt-1 font-bold uppercase">{alert.time}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* User Management Quick View */}
          <motion.div variants={item} className="glass-card p-6 rounded-3xl">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-6">Staff Management</h3>
            <div className="space-y-4">
              {staffList.slice(0, 3).map((staff, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{staff.name}</p>
                      <p className="text-[10px] text-slate-500">{staff.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5 rounded mr-2",
                      staff.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {staff.status}
                    </span>
                    <button 
                      onClick={() => handleViewStaff(staff)}
                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all text-slate-400 hover:text-blue-600"
                      title="View"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleEditStaff(staff)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-slate-600"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteStaff(staff)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all text-slate-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95">
              Manage All Staff
            </button>
          </motion.div>

          {/* System Status */}
          <motion.div variants={item} className="p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-black uppercase tracking-wider text-xs mb-4">System Status</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold">All services operational</span>
              </div>
              <div className="space-y-2 text-[10px] font-medium text-slate-400">
                <div className="flex justify-between">
                  <span>Uptime</span>
                  <span className="text-white">99.98%</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Backup</span>
                  <span className="text-white">14m ago</span>
                </div>
              </div>
            </div>
            <Activity className="absolute -bottom-6 -right-6 w-24 h-24 text-white/5 rotate-12" />
          </motion.div>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddStaffModalOpen}
        onClose={() => !isSavingStaff && setIsAddStaffModalOpen(false)}
        title="Register New Staff Member"
        maxWidth="2xl"
      >
        <div className="relative">
          {showStaffSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Staff Registered!</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">Invitation email has been sent.</p>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleAddStaff}>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-start gap-3 mb-6 border border-slate-100 dark:border-slate-700">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Staff members will receive an email to set up their password and complete their profile registration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. Dr. Emily Smith" 
                    disabled={isSavingStaff}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    disabled={isSavingStaff}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                    required
                  >
                    <option value="">Select Role...</option>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Administrator</option>
                    <option value="pharmacist">Pharmacist</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="staff@hospital.com" 
                    disabled={isSavingStaff}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Department</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    disabled={isSavingStaff}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                    required
                  >
                    <option value="">Select Department...</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="neurology">Neurology</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="emergency">Emergency</option>
                    <option value="pharmacy">Pharmacy</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsAddStaffModalOpen(false)}
                disabled={isSavingStaff}
                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSavingStaff}
                className="flex-2 px-12 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-70"
              >
                {isSavingStaff ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Announcement Modal */}
      <Modal
        isOpen={isAnnouncementModalOpen}
        onClose={() => !isPostingAnnouncement && setIsAnnouncementModalOpen(false)}
        title="Post System Announcement"
        maxWidth="lg"
      >
        <div className="relative">
          {showAnnouncementSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl"
            >
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Announcement Posted!</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">Notification sent to selected audience.</p>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handlePostAnnouncement}>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Announcement Title</label>
              <input 
                type="text" 
                placeholder="e.g. Scheduled System Maintenance" 
                disabled={isPostingAnnouncement}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 transition-all outline-none disabled:opacity-50" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Target Audience</label>
              <div className="grid grid-cols-2 gap-3">
                {['All Staff', 'Doctors Only', 'Patients Only', 'Admins Only'].map((target) => (
                  <label key={target} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                    <input 
                      type="checkbox" 
                      disabled={isPostingAnnouncement}
                      className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 disabled:opacity-50" 
                    />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">{target}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Announcement Content</label>
              <textarea 
                rows={4} 
                placeholder="Enter details here..." 
                disabled={isPostingAnnouncement}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 transition-all outline-none resize-none disabled:opacity-50" 
                required 
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsAnnouncementModalOpen(false)}
                disabled={isPostingAnnouncement}
                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Discard
              </button>
              <button 
                type="submit"
                disabled={isPostingAnnouncement}
                className="flex-2 px-12 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/25 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-70"
              >
                {isPostingAnnouncement ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Posting...</span>
                  </div>
                ) : 'Post Now'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Staff Modal */}
      <Modal
        isOpen={isViewStaffModalOpen}
        onClose={() => setIsViewStaffModalOpen(false)}
        title="Staff Details"
        maxWidth="md"
      >
        {selectedStaff && (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xl font-black">
                {selectedStaff.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedStaff.name}</h3>
                <p className="text-sm font-medium text-slate-500">ID: #{selectedStaff.id.padStart(4, '0')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Role</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedStaff.role}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Department</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedStaff.department}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedStaff.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                selectedStaff.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
              )}>
                {selectedStaff.status}
              </span>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsViewStaffModalOpen(false)} 
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsViewStaffModalOpen(false);
                    setIsEditStaffModalOpen(true);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all"
                >
                  Edit Staff
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Staff Modal */}
      <Modal
        isOpen={isDeleteStaffModalOpen}
        onClose={() => !isDeleting && setIsDeleteStaffModalOpen(false)}
        title="Delete Staff Member"
        maxWidth="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Confirm Delete</h3>
          <p className="text-sm text-slate-500 mb-6">
            Are you sure you want to remove <span className="font-bold text-red-500">{selectedStaff?.name}</span> from the system?
          </p>
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={() => setIsDeleteStaffModalOpen(false)} 
              disabled={isDeleting}
              className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={confirmDeleteStaff}
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

      {/* Edit Staff Modal */}
      <Modal
        isOpen={isEditStaffModalOpen}
        onClose={() => setIsEditStaffModalOpen(false)}
        title="Edit Staff Member"
        maxWidth="lg"
      >
        {selectedStaff && (
          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault();
            setStaffList(staffList.map(s => s.id === selectedStaff.id ? selectedStaff : s));
            setIsEditStaffModalOpen(false);
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                <input 
                  type="text" 
                  value={selectedStaff.name}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Role</label>
                <input 
                  type="text" 
                  value={selectedStaff.role}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, role: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Department</label>
                <input 
                  type="text" 
                  value={selectedStaff.department}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, department: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Email</label>
                <input 
                  type="email" 
                  value={selectedStaff.email}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Status</label>
                <select 
                  value={selectedStaff.status}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, status: e.target.value as StaffMember['status'] })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsEditStaffModalOpen(false)} 
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
    </motion.div>
  );
};

export default AdminDashboard;
