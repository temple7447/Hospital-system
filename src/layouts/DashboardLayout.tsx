import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
  HelpCircle,
  Sun,
  Moon,
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
  UsersRound,
  StickyNote,
  CalendarClock,
  UserCheck,
  ListOrdered,
  HeartPulse,
  ClipboardCheck,
  History,
  ScanLine,
  Stethoscope,
  KeyRound,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { cn } from '@/utils/cn';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const dark =
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');

    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
    toast.success(`Switched to ${next ? 'dark' : 'light'} mode`);
  };

  const handleLogout = () => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 800)), {
      loading: 'Signing out…',
      success: () => { logout(); navigate('/login'); return 'Signed out'; },
    });
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard',       path: '/dashboard',               roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGIST'] },
    { icon: UserRound,       label: 'Patients',        path: '/patients',                roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { icon: Calendar,        label: 'Appointments',    path: '/appointments',            roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
    { icon: PlusCircle,      label: 'Book Appointment',path: '/patient/book',            roles: ['PATIENT'] },
    { icon: FolderHeart,     label: 'My Records',      path: '/patient/records',         roles: ['PATIENT'] },
    { icon: CalendarDays,    label: 'My Schedule',     path: '/doctor/schedule',         roles: ['DOCTOR'] },
    { icon: UsersRound,      label: 'My Patients',     path: '/doctor/patients',         roles: ['DOCTOR'] },
    { icon: StickyNote,      label: 'SOAP Notes',      path: '/doctor/consultation-notes', roles: ['DOCTOR'] },
    { icon: ClipboardList,   label: 'Write Rx',        path: '/doctor/prescription/new', roles: ['DOCTOR'] },
    { icon: FlaskConical,    label: 'Lab Orders',      path: '/doctor/lab-orders',       roles: ['DOCTOR'] },
    { icon: CalendarClock,   label: 'Availability',    path: '/doctor/availability',     roles: ['DOCTOR'] },
    { icon: TestTube,        label: 'Lab Results',     path: '/patient/lab-results',     roles: ['PATIENT'] },
    { icon: CalendarDays,    label: 'My Appointments', path: '/patient/appointments',    roles: ['PATIENT'] },
    { icon: Pill,            label: 'Prescriptions',   path: '/patient/prescriptions',   roles: ['PATIENT'] },
    { icon: HeartPulse,      label: 'Health Summary',  path: '/patient/health-summary',  roles: ['PATIENT'] },
    { icon: Stethoscope,     label: 'My Patients',     path: '/nurse/patients',          roles: ['NURSE'] },
    { icon: HeartPulse,      label: 'Record Vitals',   path: '/nurse/vitals',            roles: ['NURSE'] },
    { icon: ClipboardCheck,  label: 'Tasks',           path: '/nurse/tasks',             roles: ['NURSE'] },
    { icon: Pill,            label: 'Rx Queue',        path: '/pharmacist/queue',        roles: ['PHARMACIST'] },
    { icon: Package,         label: 'Drug Inventory',  path: '/pharmacist/inventory',    roles: ['PHARMACIST'] },
    { icon: History,         label: 'Dispense History',path: '/pharmacist/history',      roles: ['PHARMACIST'] },
    { icon: FlaskConical,    label: 'Order Queue',     path: '/lab/queue',               roles: ['LAB_TECHNICIAN'] },
    { icon: TestTube,        label: 'Completed Orders',path: '/lab/completed',           roles: ['LAB_TECHNICIAN'] },
    { icon: ScanLine,        label: 'Imaging Queue',   path: '/radiology/queue',         roles: ['RADIOLOGIST'] },
    { icon: History,         label: 'Report History',  path: '/radiology/history',       roles: ['RADIOLOGIST'] },
    { icon: Bell,            label: 'Notifications',   path: '/notifications',           roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGIST'] },
    { icon: FileText,        label: 'Reports',         path: '/reports',                 roles: ['ADMIN', 'DOCTOR'] },
    { icon: UserPlus,        label: 'Register Patient',path: '/receptionist/register',   roles: ['ADMIN', 'RECEPTIONIST'] },
    { icon: UserCheck,       label: 'Check In',        path: '/receptionist/checkin',    roles: ['ADMIN', 'RECEPTIONIST'] },
    { icon: ListOrdered,     label: 'Arrival Queue',   path: '/receptionist/queue',      roles: ['ADMIN', 'RECEPTIONIST'] },
    { icon: Receipt,         label: 'Billing',         path: '/receptionist/billing',    roles: ['RECEPTIONIST'] },
    { icon: Receipt,         label: 'My Bills',        path: '/patient/bills',           roles: ['PATIENT'] },
    { icon: Users,           label: 'Staff',           path: '/admin/staff',             roles: ['ADMIN'] },
    { icon: Receipt,         label: 'Billing',         path: '/admin/billing',           roles: ['ADMIN'] },
    { icon: Package,         label: 'Inventory',       path: '/admin/inventory',         roles: ['ADMIN'] },
    { icon: ShieldCheck,     label: 'Audit Logs',      path: '/admin/audit-logs',        roles: ['ADMIN'] },
    { icon: Building2,       label: 'Departments',     path: '/admin/departments',       roles: ['ADMIN'] },
    { icon: BedDouble,       label: 'Rooms & Beds',    path: '/admin/rooms',             roles: ['ADMIN'] },
    { icon: KeyRound,        label: 'Roles',           path: '/admin/roles',             roles: ['ADMIN'] },
    { icon: Settings,        label: 'Settings',        path: '/settings',                roles: ['ADMIN'] },
  ];

  const filtered = menuItems.filter(item => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">
      <Toaster position="top-right" richColors closeButton />

      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'w-60 translate-x-0' : 'w-0 -translate-x-full lg:w-60'
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center shrink-0">
            <Hospital className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">CareFlow</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {filtered.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-800 space-y-0.5 shrink-0">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md w-full max-w-sm">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search…"
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-gray-400 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">{user?.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{user?.role?.replace('_', ' ')}</p>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', profileOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm py-1 z-50"
                    >
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button onClick={() => { navigate('/profile'); setProfileOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <User className="w-4 h-4 text-gray-400" />
                          My Profile
                        </button>
                        <button className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                          Support
                        </button>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                        <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
