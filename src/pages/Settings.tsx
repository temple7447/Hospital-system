import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hospital, Clock, Bell, Shield, Globe, Save,
  Loader2, CheckCircle2, Users, Calendar, Phone, Mail,
  MapPin, Building2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';

const TABS = [
  { id: 'hospital',      label: 'Hospital Info',   icon: Hospital },
  { id: 'operations',   label: 'Operations',      icon: Clock },
  { id: 'notifications', label: 'Notifications',   icon: Bell },
  { id: 'security',     label: 'Security',         icon: Shield },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={cn('w-11 h-6 rounded-full transition-colors relative shrink-0',
        enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700')}>
      <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all',
        enabled ? 'left-6' : 'left-1')} />
    </button>
  );
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('hospital');
  const [saving, setSaving] = useState(false);

  const [hospital, setHospital] = useState({
    name:    'CareFlow Medical Center',
    tagline: 'Excellence in Patient Care',
    phone:   '+1 (555) 000-1234',
    email:   'admin@careflow.com',
    address: '123 Medical Drive',
    city:    'San Francisco, CA 94102',
    website: 'www.careflow.com',
    beds:    '250',
    founded: '1985',
    license: 'HOS-2024-001',
  });

  const [ops, setOps] = useState({
    openTime:          '07:00',
    closeTime:         '21:00',
    emergencyHours:    true,
    maxDailyPatients:  '120',
    appointmentSlot:   '30',
    walkinEnabled:     true,
    autoQueueEnabled:  true,
  });

  const [notifs, setNotifs] = useState({
    emailAppointments: true,
    emailBilling:      true,
    emailLab:          false,
    smsReminders:      true,
    smsEmergency:      true,
    inAppAll:          true,
    lowStockAlert:     true,
    lowStockThreshold: '10',
  });

  const [security, setSecurity] = useState({
    sessionTimeout:    '60',
    twoFactor:         false,
    auditAll:          true,
    passwordExpiry:    '90',
    ipWhitelist:       false,
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved successfully');
    }, 600);
  };

  const inputCls = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";
  const labelCls = "text-[10px] font-black text-slate-400 uppercase tracking-widest";

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Hospital configuration and preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tab sidebar */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
          className="lg:col-span-1 space-y-1.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all',
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800')}>
              <t.icon className="w-4 h-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="glass-card rounded-3xl p-8 space-y-6">

              {activeTab === 'hospital' && (
                <>
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Hospital className="w-5 h-5 text-blue-600" /> Hospital Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className={labelCls}>Hospital Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={hospital.name} onChange={e => setHospital(h => ({ ...h, name: e.target.value }))}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Tagline</label>
                      <input value={hospital.tagline} onChange={e => setHospital(h => ({ ...h, tagline: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>License Number</label>
                      <input value={hospital.license} onChange={e => setHospital(h => ({ ...h, license: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={hospital.phone} onChange={e => setHospital(h => ({ ...h, phone: e.target.value }))}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={hospital.email} onChange={e => setHospital(h => ({ ...h, email: e.target.value }))}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                      </div>
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className={labelCls}>Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={hospital.address} onChange={e => setHospital(h => ({ ...h, address: e.target.value }))}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>City / State / ZIP</label>
                      <input value={hospital.city} onChange={e => setHospital(h => ({ ...h, city: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Website</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={hospital.website} onChange={e => setHospital(h => ({ ...h, website: e.target.value }))}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Total Beds</label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="number" value={hospital.beds} onChange={e => setHospital(h => ({ ...h, beds: e.target.value }))}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Founded Year</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={hospital.founded} onChange={e => setHospital(h => ({ ...h, founded: e.target.value }))}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'operations' && (
                <>
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" /> Operational Settings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={labelCls}>Opening Time</label>
                      <input type="time" value={ops.openTime} onChange={e => setOps(o => ({ ...o, openTime: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Closing Time</label>
                      <input type="time" value={ops.closeTime} onChange={e => setOps(o => ({ ...o, closeTime: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Max Daily Patients</label>
                      <input type="number" value={ops.maxDailyPatients} onChange={e => setOps(o => ({ ...o, maxDailyPatients: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Appointment Slot (min)</label>
                      <select value={ops.appointmentSlot} onChange={e => setOps(o => ({ ...o, appointmentSlot: e.target.value }))} className={inputCls + ' cursor-pointer'}>
                        <option value="15">15 minutes</option>
                        <option value="20">20 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    {[
                      { key: 'emergencyHours',   label: '24/7 Emergency Services',   desc: 'Emergency department operates around the clock' },
                      { key: 'walkinEnabled',    label: 'Walk-in Patients',           desc: 'Allow patients to visit without prior appointment' },
                      { key: 'autoQueueEnabled', label: 'Auto Queue Management',      desc: 'Automatically assign queue tokens on check-in' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{item.desc}</p>
                        </div>
                        <Toggle
                          enabled={ops[item.key as keyof typeof ops] as boolean}
                          onChange={() => setOps(o => ({ ...o, [item.key]: !o[item.key as keyof typeof ops] }))}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'notifications' && (
                <>
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-600" /> Notification Preferences
                  </h3>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Alerts</p>
                    {[
                      { key: 'emailAppointments', label: 'Appointment Confirmations', desc: 'Send confirmation emails to patients' },
                      { key: 'emailBilling',      label: 'Billing & Invoices',        desc: 'Email invoices when generated' },
                      { key: 'emailLab',          label: 'Lab Results Ready',         desc: 'Notify patients when lab results are available' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{item.desc}</p>
                        </div>
                        <Toggle
                          enabled={notifs[item.key as keyof typeof notifs] as boolean}
                          onChange={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key as keyof typeof notifs] }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMS Alerts</p>
                    {[
                      { key: 'smsReminders', label: 'Appointment Reminders', desc: '24h before appointment SMS reminder' },
                      { key: 'smsEmergency', label: 'Emergency Alerts',      desc: 'Critical patient alerts to on-call staff' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{item.desc}</p>
                        </div>
                        <Toggle
                          enabled={notifs[item.key as keyof typeof notifs] as boolean}
                          onChange={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key as keyof typeof notifs] }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Alerts</p>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">Low Stock Alerts</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Alert when inventory drops below threshold</p>
                      </div>
                      <Toggle enabled={notifs.lowStockAlert} onChange={() => setNotifs(n => ({ ...n, lowStockAlert: !n.lowStockAlert }))} />
                    </div>
                    {notifs.lowStockAlert && (
                      <div className="space-y-1.5 px-1">
                        <label className={labelCls}>Low Stock Threshold (units)</label>
                        <input type="number" value={notifs.lowStockThreshold}
                          onChange={e => setNotifs(n => ({ ...n, lowStockThreshold: e.target.value }))}
                          className={inputCls} />
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'security' && (
                <>
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-violet-600" /> Security Settings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={labelCls}>Session Timeout (min)</label>
                      <select value={security.sessionTimeout} onChange={e => setSecurity(s => ({ ...s, sessionTimeout: e.target.value }))} className={inputCls + ' cursor-pointer'}>
                        <option value="30">30 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="120">2 hours</option>
                        <option value="480">8 hours</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Password Expiry (days)</label>
                      <select value={security.passwordExpiry} onChange={e => setSecurity(s => ({ ...s, passwordExpiry: e.target.value }))} className={inputCls + ' cursor-pointer'}>
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="0">Never</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { key: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Require 2FA for all staff logins' },
                      { key: 'auditAll',  label: 'Full Audit Logging',         desc: 'Log all user actions including reads' },
                      { key: 'ipWhitelist', label: 'IP Whitelist',             desc: 'Restrict access to approved IPs only' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{item.desc}</p>
                        </div>
                        <Toggle
                          enabled={security[item.key as keyof typeof security] as boolean}
                          onChange={() => setSecurity(s => ({ ...s, [item.key]: !s[item.key as keyof typeof security] }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      Security changes take effect on next login session. Existing sessions are not terminated.
                    </p>
                  </div>
                </>
              )}

              {/* Save button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><Save className="w-3.5 h-3.5" /> Save Settings</>}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
