import React from 'react';
import { useAuth } from '../context/AuthContext';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';
import AdminDashboard from './AdminDashboard';
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
  Thermometer
} from 'lucide-react';

const FileText = LucideFileText;
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '../utils/cn';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Role-based routing
  if (user?.role === 'PATIENT') {
    return <PatientDashboard />;
  }

  if (user?.role === 'DOCTOR') {
    return <DoctorDashboard />;
  }

  if (user?.role === 'RECEPTIONIST') {
    return <ReceptionistDashboard />;
  }

  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  // Fallback to Admin view if role is unknown or not handled
  const stats = [
    { 
      label: 'Total Patients', 
      value: '1,284', 
      change: '+12.5%', 
      trend: 'up', 
      icon: Users, 
      color: 'blue' 
    },
    { 
      label: 'Appointments', 
      value: '42', 
      change: '+4.2%', 
      trend: 'up', 
      icon: Calendar, 
      color: 'purple' 
    },
    { 
      label: 'Avg. Wait Time', 
      value: '14m', 
      change: '-2.1%', 
      trend: 'down', 
      icon: Clock, 
      color: 'emerald' 
    },
    { 
      label: 'Revenue', 
      value: '$12,450', 
      change: '+8.3%', 
      trend: 'up', 
      icon: Activity, 
      color: 'amber' 
    },
  ];

  const chartData = [
    { name: 'Mon', appointments: 32, revenue: 2400 },
    { name: 'Tue', appointments: 45, revenue: 3100 },
    { name: 'Wed', appointments: 28, revenue: 2200 },
    { name: 'Thu', appointments: 52, revenue: 3800 },
    { name: 'Fri', appointments: 48, revenue: 3500 },
    { name: 'Sat', appointments: 24, revenue: 1800 },
    { name: 'Sun', appointments: 18, revenue: 1200 },
  ];

  const departmentData = [
    { name: 'Cardiology', value: 400, color: '#3b82f6' },
    { name: 'Neurology', value: 300, color: '#8b5cf6' },
    { name: 'Pediatrics', value: 300, color: '#10b981' },
    { name: 'Orthopedics', value: 200, color: '#f59e0b' },
  ];

  const recentPatients = [
    { name: 'Sarah Johnson', id: '#PT-2401', time: '10:30 AM', type: 'Check-up', status: 'In Progress' },
    { name: 'Michael Chen', id: '#PT-2398', time: '09:45 AM', type: 'Emergency', status: 'Completed' },
    { name: 'Emma Wilson', id: '#PT-2395', time: '09:15 AM', type: 'Consultation', status: 'Waiting' },
    { name: 'David Miller', id: '#PT-2392', time: '08:30 AM', type: 'Follow-up', status: 'Completed' },
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

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-8"
    >
      {/* Welcome Header */}
      <motion.div 
        variants={item}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening in your hospital today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
            Export Report
          </button>
          <button className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25">
            + New Appointment
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            variants={item}
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-3xl transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300",
                stat.color === 'blue' && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
                stat.color === 'purple' && "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
                stat.color === 'emerald' && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
                stat.color === 'amber' && "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                stat.trend === 'up' ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-red-600 bg-red-50 dark:bg-red-900/20"
              )}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2 glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Appointments Trend</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Daily appointment volume for the past week</p>
            </div>
            <select className="bg-slate-50 dark:bg-slate-800 border-none text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-0">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(8px)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorApp)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Department Load</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Patient distribution by department</p>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
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
          <div className="space-y-3 mt-4">
            {departmentData.map((dept, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }} />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{dept.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{dept.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <motion.div variants={item} className="lg:col-span-2 glass-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Appointments</h3>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-500">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentPatients.map((patient, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{patient.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{patient.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{patient.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {patient.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold",
                        patient.status === 'Completed' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
                        patient.status === 'In Progress' && "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                        patient.status === 'Waiting' && "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                      )}>
                        {patient.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                        {patient.status === 'In Progress' && <Activity className="w-3 h-3 animate-pulse" />}
                        {patient.status === 'Waiting' && <AlertCircle className="w-3 h-3" />}
                        {patient.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Sidebar Info Cards */}
        <div className="space-y-6">
          <motion.div 
            variants={item}
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-3xl text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group"
          >
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-2">Hospital Capacity</h4>
              <p className="text-blue-100 text-sm mb-6">Your hospital is currently at 84% capacity. Consider optimizing resources.</p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>General Ward</span>
                    <span>92%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '92%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-white rounded-full"
                    ></motion.div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Emergency Room</span>
                    <span>45%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '45%' }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="h-full bg-white rounded-full"
                    ></motion.div>
                  </div>
                </div>
              </div>
            </div>
            <Activity className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-500" />
          </motion.div>

          <motion.div variants={item} className="glass-card p-6 rounded-3xl">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all text-center group">
                <Users className="w-5 h-5 mx-auto mb-2 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-xs font-bold">Add Patient</span>
              </button>
              <button className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all text-center group">
                <FileText className="w-5 h-5 mx-auto mb-2 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-xs font-bold">Write Script</span>
              </button>
              <button className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all text-center group">
                <Calendar className="w-5 h-5 mx-auto mb-2 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-xs font-bold">Schedule</span>
              </button>
              <button className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all text-center group">
                <TrendingUp className="w-5 h-5 mx-auto mb-2 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-xs font-bold">Reports</span>
              </button>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-card p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Live Vitals</h4>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-slate-500">Blood Bank</span>
                </div>
                <span className="text-xs font-bold text-emerald-600">Optimal</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-slate-500">Avg. Temp</span>
                </div>
                <span className="text-xs font-bold">98.6°F</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Activity className="w-3 h-3 animate-pulse text-emerald-500" />
                System Status: Online
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
