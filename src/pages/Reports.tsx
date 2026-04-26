import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  MoreVertical,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  ChevronRight,
  FileSpreadsheet,
  File as FileIcon,
  Upload,
  User,
  Calendar,
  CheckCircle2,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const reportStats = [
  { name: 'Blood Test', count: 124, color: '#3b82f6' },
  { name: 'X-Ray', count: 86, color: '#10b981' },
  { name: 'MRI', count: 42, color: '#8b5cf6' },
  { name: 'ECG', count: 64, color: '#f59e0b' },
];

const Reports: React.FC = () => {
  const reportsData = [
    { 
      id: 'REP-001', 
      title: 'Annual Physical Examination', 
      patient: 'Robert Fox', 
      doctor: 'Dr. Sarah Johnson', 
      date: 'Apr 24, 2026', 
      type: 'Full Report',
      status: 'Ready',
      size: '2.4 MB'
    },
    { 
      id: 'REP-002', 
      title: 'Blood Analysis (Lipid Profile)', 
      patient: 'Jane Cooper', 
      doctor: 'Dr. Michael Chen', 
      date: 'Apr 22, 2026', 
      type: 'Lab Result',
      status: 'Ready',
      size: '1.1 MB'
    },
    { 
      id: 'REP-003', 
      title: 'Chest X-Ray Analysis', 
      patient: 'Bessie Cooper', 
      doctor: 'Dr. Sarah Johnson', 
      date: 'Apr 20, 2026', 
      type: 'Radiology',
      status: 'Pending',
      size: '-'
    },
  ];

  const { user } = useAuth();
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [reportsList, setReportsList] = useState(reportsData);
  const [selectedReport, setSelectedReport] = useState<typeof reportsData[0] | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsNewReportModalOpen(false);
      }, 2000);
    }, 1500);
  };

  const handleViewReport = (report: typeof reportsData[0]) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  const handleEditReport = (report: typeof reportsData[0]) => {
    setSelectedReport(report);
    setIsEditModalOpen(true);
  };

  const handleDeleteReport = (report: typeof reportsData[0]) => {
    setSelectedReport(report);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setReportsList(reportsList.filter(r => r.id !== selectedReport?.id));
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setSelectedReport(null);
    }, 1000);
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* New Report Modal */}
      <Modal 
        isOpen={isNewReportModalOpen} 
        onClose={() => !(isGenerating || showSuccess) && setIsNewReportModalOpen(false)} 
        title="Generate New Report"
        maxWidth="lg"
      >
        <div className="relative">
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl"
            >
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Report Generated!</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-center max-w-xs">The medical report has been generated and signed successfully.</p>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleGenerateReport}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Report Title</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. Lab Results - Blood Count" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                    disabled={isGenerating}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Select Patient</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                    required
                    disabled={isGenerating}
                  >
                    <option value="">Choose Patient...</option>
                    <option value="1">Robert Fox</option>
                    <option value="2">Jane Cooper</option>
                    <option value="3">Bessie Cooper</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Report Type</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50" 
                  required
                  disabled={isGenerating}
                >
                  <option value="lab">Lab Result</option>
                  <option value="radiology">Radiology (X-Ray/MRI)</option>
                  <option value="physical">Physical Examination</option>
                  <option value="cardiology">Cardiology (ECG)</option>
                  <option value="other">Other Medical Document</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Report Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date" 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50" 
                    required 
                    disabled={isGenerating}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Upload Source Files (Optional)</label>
              <div className={cn(
                "border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group",
                !isGenerating && "hover:border-blue-500/50",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:text-blue-600 transition-colors">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Click to upload or drag and drop</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">PDF, JPG, PNG or DICOM (Max. 20MB)</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Clinical Observations & Notes</label>
              <textarea 
                placeholder="Enter detailed findings and medical notes here..." 
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[150px] disabled:opacity-50" 
                required 
                disabled={isGenerating}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsNewReportModalOpen(false)} 
                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
                disabled={isGenerating}
              >
                Discard
              </button>
              <button 
                type="submit" 
                className="flex-[2] px-12 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Generate & Sign Report</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View Report Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Report Details"
        maxWidth="lg"
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                {selectedReport.type === 'Lab Result' ? <FileSpreadsheet className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedReport.title}</h3>
                <p className="text-sm font-medium text-slate-500">{selectedReport.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Patient</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedReport.patient}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Doctor</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedReport.doctor}</p>
              </div>
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
                onClick={() => setIsViewModalOpen(false)} 
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title="Delete Report"
        maxWidth="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Confirm Delete</h3>
          <p className="text-sm text-slate-500 mb-6">
            Are you sure you want to delete <span className="font-bold text-red-500">{selectedReport?.title}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={() => setIsDeleteModalOpen(false)} 
              disabled={isDeleting}
              className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={confirmDelete}
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
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Report"
        maxWidth="lg"
      >
        {selectedReport && (
          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault();
            setReportsList(reportsList.map(r => r.id === selectedReport.id ? selectedReport : r));
            setIsEditModalOpen(false);
          }}>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Report Title</label>
              <input 
                type="text" 
                value={selectedReport.title}
                onChange={(e) => setSelectedReport({ ...selectedReport, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Patient</label>
                <input 
                  type="text" 
                  value={selectedReport.patient}
                  onChange={(e) => setSelectedReport({ ...selectedReport, patient: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Doctor</label>
                <input 
                  type="text" 
                  value={selectedReport.doctor}
                  onChange={(e) => setSelectedReport({ ...selectedReport, doctor: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Type</label>
                <select 
                  value={selectedReport.type}
                  onChange={(e) => setSelectedReport({ ...selectedReport, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="Full Report">Full Report</option>
                  <option value="Lab Result">Lab Result</option>
                  <option value="Radiology">Radiology</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Status</label>
                <select 
                  value={selectedReport.status}
                  onChange={(e) => setSelectedReport({ ...selectedReport, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="Ready">Ready</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Medical Reports 📄
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Access and manage patient medical documentation</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsNewReportModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>New Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Quick Stats Chart */}
          <motion.div variants={item} className="glass-card p-8 rounded-[2rem]">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-8">Reports by Type</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportStats}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(8px)' }}
                  />
                  <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={40}>
                    {reportStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search reports by ID, title, or patient..." 
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            <AnimatePresence>
              {reportsList.map((report) => (
                <motion.div 
                  key={report.id}
                  variants={item}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-all">
                      {report.type === 'Lab Result' ? <FileSpreadsheet className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-md">{report.title}</h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{report.id}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-1">
                        <span className="text-xs font-bold text-blue-600">{report.patient}</span>
                        <span className="text-xs font-medium text-slate-400">• {report.doctor}</span>
                        <span className="text-xs font-medium text-slate-400">• {report.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mb-1",
                        report.status === 'Ready' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {report.status}
                      </span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{report.size}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewReport(report)}
                        className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleEditReport(report)}
                        className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Edit"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteReport(report)}
                        className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Security & Access */}
          <motion.div variants={item} className="glass-card p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-wider text-xs">Secure Access</h3>
            </div>
            <p className="text-xs font-medium text-emerald-800/70 dark:text-emerald-400/70 leading-relaxed">
              All medical records are encrypted and HIPAA compliant. Only authorized medical personnel can access full reports.
            </p>
            <button className="w-full mt-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95">
              Access Logs
            </button>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={item} className="glass-card p-6 rounded-3xl">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm mb-6">Recent Updates</h3>
            <div className="space-y-6">
              {[
                { action: 'Report Signed', user: 'Dr. Johnson', time: '12m ago', icon: ShieldCheck, color: 'blue' },
                { action: 'Results Uploaded', user: 'Lab Dept', time: '1h ago', icon: Activity, color: 'emerald' },
                { action: 'Report Accessed', user: 'Michael Chen', time: '2h ago', icon: Eye, color: 'purple' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    activity.color === 'blue' && "bg-blue-50 text-blue-600",
                    activity.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                    activity.color === 'purple' && "bg-purple-50 text-purple-600",
                  )}>
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-slate-900 dark:text-white">{activity.action}</p>
                      <span className="text-[10px] font-bold text-slate-400">{activity.time}</span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">by {activity.user}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
              View Activity History
              <ChevronRight className="w-3 h-3" />
            </button>
          </motion.div>

          {/* Storage Status */}
          <motion.div variants={item} className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Cloud Storage</h3>
              <span className="text-[10px] font-black text-blue-600">82%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '82%' }}
                className="h-full bg-blue-600 rounded-full"
              />
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest text-center">
              41.2 GB of 50 GB Used
            </p>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  export default Reports;
