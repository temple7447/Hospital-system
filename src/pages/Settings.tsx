import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun,
  Camera,
  Mail,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Moon },
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={container}
      className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your account preferences and hospital settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm",
                activeTab === tab.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-sm">
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-8 space-y-8"
          >
            {activeTab === 'profile' && (
              <form onSubmit={handleSave} className="space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-4xl font-black overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                      {user?.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <button type="button" className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg border-2 border-white dark:border-slate-800 hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center md:text-left space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{user?.name}</h3>
                    <p className="text-slate-500 font-medium">{user?.role} • Hospital ID: #8824</p>
                    <div className="flex items-center gap-2 justify-center md:justify-start pt-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-full">Verified Profile</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={user?.name}
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email}
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      defaultValue="+1 234 567 890"
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Department</label>
                    <input 
                      type="text" 
                      defaultValue="Cardiology"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-bold opacity-70 cursor-not-allowed"
                      readOnly
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div className={cn(
                    "flex items-center gap-2 text-emerald-600 transition-all duration-500",
                    showSuccess ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}>
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-bold">Changes saved successfully!</span>
                  </div>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px]"
                  >
                    {isSaving ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h4>
                      <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Enable</button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Change Password</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Current Password</label>
                      <input type="password" placeholder="••••••••" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">New Password</label>
                        <input type="password" placeholder="••••••••" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
                        <input type="password" placeholder="••••••••" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <div className={cn(
                      "flex items-center gap-2 text-emerald-600 transition-all duration-500",
                      showSuccess ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    )}>
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-bold">Password updated successfully!</span>
                    </div>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px]"
                    >
                      {isSaving ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                          <span>Updating...</span>
                        </div>
                      ) : 'Update Password'}
                    </button>
                  </div>
                </form>

                <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-black text-red-500 uppercase tracking-wider mb-4">Danger Zone</h4>
                  <button type="button" className="flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-3 rounded-2xl font-bold text-sm transition-all">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete My Account</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Email Notifications</h4>
                    <p className="text-xs text-slate-500">Receive daily reports and appointment alerts via email</p>
                  </div>
                  <button 
                    onClick={() => setIsNotificationsEnabled(!isNotificationsEnabled)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      isNotificationsEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      isNotificationsEnabled ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Push Notifications</h4>
                    <p className="text-xs text-slate-500">Real-time alerts for critical patient updates</p>
                  </div>
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">SMS Alerts</h4>
                    <p className="text-xs text-slate-500">Emergency notifications on your mobile device</p>
                  </div>
                  <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full relative cursor-pointer">
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-6 rounded-3xl border-2 border-blue-600 bg-white dark:bg-slate-900 space-y-4 text-left">
                    <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Light Mode</h4>
                      <p className="text-xs text-slate-500">Clean and bright appearance</p>
                    </div>
                  </button>
                  <button className="p-6 rounded-3xl border-2 border-transparent bg-slate-900 space-y-4 text-left">
                    <div className="w-full aspect-video bg-slate-800 rounded-xl" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Dark Mode</h4>
                      <p className="text-xs text-slate-400">Easy on the eyes in low light</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
