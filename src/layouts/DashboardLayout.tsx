import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Hospital,
  LayoutDashboard,
  UserRound,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  ChevronDown,
  User,
  CreditCard,
  HelpCircle,
  Sun,
  Moon,
  Command,
  X,
  Users,
  Building2,
  BedDouble,
  UserPlus,
  CalendarDays,
  PlusCircle,
  FolderHeart,
  ClipboardList,
  Receipt,
  FlaskConical,
  TestTube,
  Package,
  ShieldCheck,
  Pill,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { cn } from '../utils/cn';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }

    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
    toast.success(`Switched to ${newTheme ? 'dark' : 'light'} mode`);
  };

  const handleLogout = () => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 800)), {
      loading: 'Signing out...',
      success: () => {
        logout();
        navigate('/login');
        return 'Signed out successfully';
      },
    });
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard',          roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
    { icon: UserRound,       label: 'Patients',        path: '/patients',               roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { icon: Calendar,        label: 'Appointments',    path: '/appointments',           roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
    { icon: PlusCircle,      label: 'Book Appointment',path: '/patient/book',           roles: ['PATIENT'] },
    { icon: FolderHeart,     label: 'My Records',      path: '/patient/records',        roles: ['PATIENT'] },
    { icon: CalendarDays,    label: 'My Schedule',     path: '/doctor/schedule',        roles: ['DOCTOR'] },
    { icon: ClipboardList,   label: 'Write Rx',        path: '/doctor/prescription/new',roles: ['DOCTOR'] },
    { icon: FlaskConical,    label: 'Lab Orders',      path: '/doctor/lab-orders',      roles: ['DOCTOR'] },
    { icon: TestTube,        label: 'Lab Results',     path: '/patient/lab-results',    roles: ['PATIENT'] },
    { icon: CalendarDays,    label: 'My Appointments', path: '/patient/appointments',   roles: ['PATIENT'] },
    { icon: Pill,            label: 'My Prescriptions',path: '/patient/prescriptions',  roles: ['PATIENT'] },
    { icon: Bell,            label: 'Notifications',   path: '/notifications',          roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
    { icon: FileText,        label: 'Medical Reports', path: '/reports',                roles: ['ADMIN', 'DOCTOR'] },
    { icon: UserPlus,        label: 'Register Patient',path: '/receptionist/register',  roles: ['ADMIN', 'RECEPTIONIST'] },
    { icon: Receipt,         label: 'Billing',         path: '/receptionist/billing',   roles: ['RECEPTIONIST'] },
    { icon: Receipt,         label: 'My Bills',        path: '/patient/bills',          roles: ['PATIENT'] },
    { icon: Users,           label: 'Staff',           path: '/admin/staff',            roles: ['ADMIN'] },
    { icon: Receipt,         label: 'Billing',         path: '/admin/billing',          roles: ['ADMIN'] },
    { icon: Package,         label: 'Inventory',       path: '/admin/inventory',        roles: ['ADMIN'] },
    { icon: ShieldCheck,     label: 'Audit Logs',      path: '/admin/audit-logs',       roles: ['ADMIN'] },
    { icon: Building2,       label: 'Departments',    path: '/admin/departments',  roles: ['ADMIN'] },
    { icon: BedDouble,       label: 'Rooms & Beds',   path: '/admin/rooms',        roles: ['ADMIN'] },
    { icon: Settings,        label: 'Settings',       path: '/settings',           roles: ['ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && isMobile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 lg:static lg:inset-0 shadow-2xl lg:shadow-none",
          isSidebarOpen ? "w-72" : "w-0 -translate-x-full lg:w-24 lg:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Logo Section */}
          <div className="h-24 flex items-center px-6 gap-4 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group cursor-pointer transition-transform hover:scale-105 active:scale-95">
              <Hospital className="w-7 h-7 text-white" />
            </div>
            <motion.span 
              animate={{ opacity: isSidebarOpen ? 1 : 0, x: isSidebarOpen ? 0 : -10 }}
              className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter whitespace-nowrap"
            >
              CareFlow
            </motion.span>
          </div>

          {/* Navigation Section */}
          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
            {filteredMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative",
                    isActive 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-500/25" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-blue-400"
                  )}
                >
                  <item.icon className={cn("w-6 h-6 flex-shrink-0 transition-transform group-hover:scale-110", isActive && "text-white")} />
                  <motion.span 
                    animate={{ opacity: isSidebarOpen ? 1 : 0, x: isSidebarOpen ? 0 : -10 }}
                    className="whitespace-nowrap font-bold"
                  >
                    {item.label}
                  </motion.span>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-blue-600 rounded-2xl -z-10 shadow-lg shadow-blue-500/20"
                    />
                  )}
                  
                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl border border-white/10">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 space-y-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all group"
            >
              <div className="relative w-6 h-6 flex-shrink-0">
                <AnimatePresence mode="wait">
                  {isDark ? (
                    <motion.div key="sun" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}>
                      <Sun className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div key="moon" initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: -90 }}>
                      <Moon className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <motion.span animate={{ opacity: isSidebarOpen ? 1 : 0 }} className="whitespace-nowrap">
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group"
            >
              <LogOut className="w-6 h-6 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
              <motion.span animate={{ opacity: isSidebarOpen ? 1 : 0 }} className="whitespace-nowrap">Logout</motion.span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Navbar */}
        <header className="h-24 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 lg:px-12 sticky top-0 z-40 transition-colors duration-300">
          <div className="flex items-center gap-8 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all active:scale-90"
            >
              {isSidebarOpen ? <Menu className="w-6 h-6" /> : <Command className="w-6 h-6" />}
            </button>
            
            <div className="hidden md:flex items-center gap-4 px-5 py-3.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-full max-w-lg focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all border border-transparent focus-within:border-blue-500/20">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patient, doctor, or reports..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 text-slate-900 dark:text-white font-medium"
              />
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                <span className="text-[10px] font-black text-slate-400">⌘</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">K</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/notifications')} className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 relative text-slate-500 dark:text-slate-400 transition-all group active:scale-90">
              <Bell className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></span>
            </button>

            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />

            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-4 pl-4 pr-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group active:scale-95"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1.5">{user?.name}</p>
                  <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{user?.role}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-xl shadow-blue-500/30 ring-4 ring-white dark:ring-slate-900 transition-transform group-hover:scale-105">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", isProfileOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl py-3 z-50 overflow-hidden"
                    >
                      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{user?.name}</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-1">{user?.email}</p>
                      </div>
                      
                      <div className="p-2">
                        <button onClick={() => { navigate('/profile'); setIsProfileOpen(false); }} className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                          <User className="w-5 h-5 text-blue-500" />
                          My Profile
                        </button>
                        <button className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                          <CreditCard className="w-5 h-5 text-emerald-500" />
                          Billing
                        </button>
                        <button className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800/50 pb-4 mb-2">
                          <HelpCircle className="w-5 h-5 text-amber-500" />
                          Support
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        >
                          <LogOut className="w-5 h-5" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
