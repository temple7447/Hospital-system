import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/context/PermissionsContext';
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
  ToggleRight,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { cn } from '@/utils/cn';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { canAccess } = usePermissions();
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
    logout();
    navigate('/login');
    toast.success('Signed out');
  };

  type MenuItem = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
    roles: string[];
    pageKey?: string;
    group?: string;
  };

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard',               roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGIST'] },
    { icon: UserRound,       label: 'Patients',         path: '/patients',                roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'],  pageKey: 'patients', group: 'Front Desk' },
    { icon: Calendar,        label: 'Appointments',     path: '/appointments',            roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT', 'NURSE'], pageKey: 'appointments', group: 'Front Desk' },
    { icon: PlusCircle,      label: 'Book Appointment', path: '/patient/book',            roles: ['PATIENT'], group: 'My Health' },
    { icon: FolderHeart,     label: 'My Records',       path: '/patient/records',         roles: ['PATIENT'], group: 'My Health' },
    { icon: CalendarDays,    label: 'My Schedule',      path: '/doctor/schedule',         roles: ['DOCTOR'],         pageKey: 'doctor_schedule', group: 'Clinical' },
    { icon: UsersRound,      label: 'My Patients',      path: '/doctor/patients',         roles: ['DOCTOR'],         pageKey: 'doctor_patients', group: 'Clinical' },
    { icon: StickyNote,      label: 'SOAP Notes',       path: '/doctor/consultation-notes', roles: ['DOCTOR'],       pageKey: 'doctor_soap_notes', group: 'Clinical' },
    { icon: ClipboardList,   label: 'Write Rx',         path: '/doctor/prescription/new', roles: ['DOCTOR'],         pageKey: 'doctor_write_rx', group: 'Clinical' },
    { icon: FlaskConical,    label: 'Lab Orders',       path: '/doctor/lab-orders',       roles: ['DOCTOR'],         pageKey: 'doctor_lab_orders', group: 'Clinical' },
    { icon: CalendarClock,   label: 'Availability',     path: '/doctor/availability',     roles: ['DOCTOR'],         pageKey: 'doctor_availability', group: 'Clinical' },
    { icon: TestTube,        label: 'Lab Results',      path: '/patient/lab-results',     roles: ['PATIENT'], group: 'My Health' },
    { icon: CalendarDays,    label: 'My Appointments',  path: '/patient/appointments',    roles: ['PATIENT'], group: 'My Health' },
    { icon: Pill,            label: 'Prescriptions',    path: '/patient/prescriptions',   roles: ['PATIENT'], group: 'My Health' },
    { icon: HeartPulse,      label: 'Health Summary',   path: '/patient/health-summary',  roles: ['PATIENT'], group: 'My Health' },
    { icon: Stethoscope,     label: 'My Patients',      path: '/nurse/patients',          roles: ['NURSE'],          pageKey: 'nurse_patients', group: 'Clinical' },
    { icon: HeartPulse,      label: 'Record Vitals',    path: '/nurse/vitals',            roles: ['NURSE'],          pageKey: 'nurse_vitals', group: 'Clinical' },
    { icon: ClipboardCheck,  label: 'Tasks',            path: '/nurse/tasks',             roles: ['NURSE'],          pageKey: 'nurse_tasks', group: 'Clinical' },
    { icon: StickyNote,      label: 'Shift Handover',   path: '/nurse/handover',          roles: ['NURSE'],          pageKey: 'nurse_handover', group: 'Clinical' },
    { icon: UsersRound,      label: 'Patient Education',path: '/nurse/education',         roles: ['NURSE'],          pageKey: 'nurse_education', group: 'Clinical' },
    { icon: Pill,            label: 'Rx Queue',         path: '/pharmacist/queue',        roles: ['PHARMACIST'],     pageKey: 'pharmacist_queue', group: 'Pharmacy' },
    { icon: Package,         label: 'Drug Inventory',   path: '/pharmacist/inventory',    roles: ['PHARMACIST'],     pageKey: 'pharmacist_inventory', group: 'Pharmacy' },
    { icon: History,         label: 'Dispense History', path: '/pharmacist/history',      roles: ['PHARMACIST'],     pageKey: 'pharmacist_history', group: 'Pharmacy' },
    { icon: FlaskConical,    label: 'Order Queue',      path: '/lab/queue',               roles: ['LAB_TECHNICIAN'], pageKey: 'lab_queue', group: 'Laboratory' },
    { icon: TestTube,        label: 'Completed Orders', path: '/lab/completed',           roles: ['LAB_TECHNICIAN'], pageKey: 'lab_completed', group: 'Laboratory' },
    { icon: ScanLine,        label: 'Imaging Queue',    path: '/radiology/queue',         roles: ['RADIOLOGIST'],    pageKey: 'radiology_queue', group: 'Radiology' },
    { icon: History,         label: 'Report History',   path: '/radiology/history',       roles: ['RADIOLOGIST'],    pageKey: 'radiology_history', group: 'Radiology' },
    { icon: Bell,            label: 'Notifications',    path: '/notifications',           roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGIST'] },
    { icon: FileText,        label: 'Reports',          path: '/reports',                 roles: ['ADMIN', 'DOCTOR'], pageKey: 'reports' },
    { icon: UserPlus,        label: 'Register Patient', path: '/receptionist/register',   roles: ['ADMIN', 'RECEPTIONIST'], pageKey: 'receptionist_register', group: 'Front Desk' },
    { icon: UserCheck,       label: 'Check In',         path: '/receptionist/checkin',    roles: ['ADMIN', 'RECEPTIONIST'], pageKey: 'receptionist_checkin', group: 'Front Desk' },
    { icon: ListOrdered,     label: 'Arrival Queue',    path: '/receptionist/queue',      roles: ['ADMIN', 'RECEPTIONIST'], pageKey: 'receptionist_queue', group: 'Front Desk' },
    { icon: Receipt,         label: 'Billing',          path: '/receptionist/billing',    roles: ['RECEPTIONIST'],   pageKey: 'receptionist_billing', group: 'Front Desk' },
    { icon: Receipt,         label: 'My Bills',         path: '/patient/bills',           roles: ['PATIENT'], group: 'My Health' },
    { icon: Users,           label: 'Staff',            path: '/admin/staff',             roles: ['ADMIN'], group: 'Administration' },
    { icon: Receipt,         label: 'Billing',          path: '/admin/billing',           roles: ['ADMIN'], group: 'Administration' },
    { icon: Package,         label: 'Inventory',        path: '/admin/inventory',         roles: ['ADMIN'], group: 'Administration' },
    { icon: ShieldCheck,     label: 'Audit Logs',       path: '/admin/audit-logs',        roles: ['ADMIN'], group: 'Administration' },
    { icon: Building2,       label: 'Departments',      path: '/admin/departments',       roles: ['ADMIN'], group: 'Administration' },
    { icon: BedDouble,       label: 'Rooms & Beds',     path: '/admin/rooms',             roles: ['ADMIN'], group: 'Administration' },
    { icon: KeyRound,        label: 'Roles',            path: '/admin/roles',             roles: ['ADMIN'], group: 'Administration' },
    { icon: ToggleRight,     label: 'Page Permissions', path: '/admin/permissions',       roles: ['ADMIN'], group: 'Administration' },
    { icon: Settings,        label: 'Settings',         path: '/settings',                roles: ['ADMIN'] },
  ];

  // Icon shown next to each collapsible group header
  const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    'Front Desk':     UserCheck,
    'Clinical':       Stethoscope,
    'My Health':      HeartPulse,
    'Pharmacy':       Pill,
    'Laboratory':     FlaskConical,
    'Radiology':      ScanLine,
    'Administration': ShieldCheck,
  };

  const filtered = menuItems.filter(item => {
    if (!user || !item.roles.includes(user.role)) return false;
    if (item.pageKey && user.role !== 'ADMIN' && !canAccess(item.pageKey)) return false;
    return true;
  });

  // Build an ordered render list: standalone items render on their own,
  // grouped items collapse under a header positioned at the group's first item.
  type Section =
    | { type: 'item'; item: MenuItem }
    | { type: 'group'; group: string; items: MenuItem[] };

  const sections: Section[] = [];
  const groupIndex: Record<string, Extract<Section, { type: 'group' }>> = {};
  for (const item of filtered) {
    if (!item.group) {
      sections.push({ type: 'item', item });
    } else if (groupIndex[item.group]) {
      groupIndex[item.group].items.push(item);
    } else {
      const group = { type: 'group' as const, group: item.group, items: [item] };
      groupIndex[item.group] = group;
      sections.push(group);
    }
  }

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (group: string) =>
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));

  // Auto-open the group that contains the active route
  useEffect(() => {
    const active = menuItems.find(i => i.path === location.pathname);
    if (active?.group) setExpandedGroups(prev => ({ ...prev, [active.group!]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const renderLink = (item: MenuItem) => {
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
  };

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
          {sections.map(section => {
            if (section.type === 'item') return renderLink(section.item);

            const expanded = !!expandedGroups[section.group];
            const hasActive = section.items.some(i => i.path === location.pathname);
            const GroupIcon = GROUP_ICONS[section.group] ?? ListOrdered;

            return (
              <div key={section.group}>
                <button
                  onClick={() => toggleGroup(section.group)}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm transition-colors',
                    hasActive && !expanded
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <GroupIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1 text-left">{section.group}</span>
                  <ChevronDown className={cn('w-4 h-4 shrink-0 text-gray-400 transition-transform', expanded && 'rotate-180')} />
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-0.5 ml-4 pl-2 border-l border-gray-200 dark:border-gray-800 space-y-0.5">
                        {section.items.map(renderLink)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
                  {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
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
