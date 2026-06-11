import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/Login';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import StaffPage from './pages/admin/Staff';
import StaffProfilePage from './pages/admin/StaffProfile';
import PatientDetailPage from './pages/admin/PatientDetail';
import DepartmentsPage from './pages/admin/Departments';
import RoomsPage from './pages/admin/Rooms';
import RegisterPatientPage from './pages/receptionist/RegisterPatient';
import SchedulePage from './pages/doctor/Schedule';
import PatientRecordPage from './pages/doctor/PatientRecord';
import PrescriptionPage from './pages/doctor/Prescription';
import BookAppointmentPage from './pages/patient/BookAppointment';
import MedicalRecordsPage from './pages/patient/MedicalRecords';
import PaymentPage from './pages/receptionist/Payment';
import BillsPage from './pages/patient/Bills';
import AdminBillingPage from './pages/admin/Billing';
import LabOrdersPage from './pages/doctor/LabOrders';
import LabResultsPage from './pages/patient/LabResults';
import InventoryPage from './pages/admin/Inventory';
import AuditLogsPage from './pages/admin/AuditLogs';
import NotificationsPage from './pages/Notifications';
import MyAppointmentsPage from './pages/patient/MyAppointments';
import PrescriptionsPage from './pages/patient/Prescriptions';
import MyPatientsPage from './pages/doctor/MyPatients';
import ConsultationNotesPage from './pages/doctor/ConsultationNotes';
import AvailabilityPage from './pages/doctor/Availability';
import CheckInPage from './pages/receptionist/CheckIn';
import QueuePage from './pages/receptionist/Queue';
import HealthSummaryPage from './pages/patient/HealthSummary';
// Nurse pages
import NurseMyPatients from './pages/nurse/MyPatients';
import NurseVitalEntry from './pages/nurse/VitalEntry';
import NurseTasks from './pages/nurse/Tasks';
// Pharmacist pages
import PrescriptionQueue from './pages/pharmacist/PrescriptionQueue';
import DrugInventory from './pages/pharmacist/DrugInventory';
import DispenseHistory from './pages/pharmacist/DispenseHistory';
// Lab tech pages
import LabOrderQueue from './pages/lab_tech/OrderQueue';
import LabEnterResults from './pages/lab_tech/EnterResults';
import LabCompletedOrders from './pages/lab_tech/CompletedOrders';
// Radiologist pages
import ImagingQueue from './pages/radiologist/ImagingQueue';
import RadiologyEnterReport from './pages/radiologist/EnterReport';
import RadiologyReportHistory from './pages/radiologist/ReportHistory';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected — dashboard layout wraps all these */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout><Dashboard /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/patients" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST']}>
                <DashboardLayout><Patients /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/patients/:id" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST']}>
                <DashboardLayout><PatientDetailPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/appointments" element={
              <ProtectedRoute>
                <DashboardLayout><Appointments /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                <DashboardLayout><Reports /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><Settings /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <DashboardLayout><Profile /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/staff" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><StaffPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/staff/:id" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><StaffProfilePage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/departments" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><DepartmentsPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/rooms" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><RoomsPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/receptionist/register" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <DashboardLayout><RegisterPatientPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/doctor/schedule" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                <DashboardLayout><SchedulePage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/patient/book" element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <DashboardLayout><BookAppointmentPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/doctor/patient/:patientId" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                <DashboardLayout><PatientRecordPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/doctor/prescription/new" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                <DashboardLayout><PrescriptionPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/patient/records" element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <DashboardLayout><MedicalRecordsPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/receptionist/billing" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <DashboardLayout><PaymentPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/patient/bills" element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <DashboardLayout><BillsPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/billing" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><AdminBillingPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/doctor/lab-orders" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                <DashboardLayout><LabOrdersPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/patient/lab-results" element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <DashboardLayout><LabResultsPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/inventory" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><InventoryPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/audit-logs" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><AuditLogsPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/notifications" element={
              <ProtectedRoute>
                <DashboardLayout><NotificationsPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/patient/appointments" element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <DashboardLayout><MyAppointmentsPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/patient/prescriptions" element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <DashboardLayout><PrescriptionsPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/doctor/patients" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                <DashboardLayout><MyPatientsPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/doctor/consultation-notes" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                <DashboardLayout><ConsultationNotesPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/doctor/availability" element={
              <ProtectedRoute allowedRoles={['DOCTOR']}>
                <DashboardLayout><AvailabilityPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/receptionist/checkin" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <DashboardLayout><CheckInPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/receptionist/queue" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <DashboardLayout><QueuePage /></DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/patient/health-summary" element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <DashboardLayout><HealthSummaryPage /></DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Nurse routes */}
            <Route path="/nurse/patients" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'NURSE']}>
                <DashboardLayout><NurseMyPatients /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/nurse/vitals" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'NURSE']}>
                <DashboardLayout><NurseVitalEntry /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/nurse/tasks" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'NURSE']}>
                <DashboardLayout><NurseTasks /></DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Pharmacist routes */}
            <Route path="/pharmacist/queue" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST']}>
                <DashboardLayout><PrescriptionQueue /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/pharmacist/inventory" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST']}>
                <DashboardLayout><DrugInventory /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/pharmacist/history" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST']}>
                <DashboardLayout><DispenseHistory /></DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Lab Technician routes */}
            <Route path="/lab/queue" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'LAB_TECHNICIAN']}>
                <DashboardLayout><LabOrderQueue /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/lab/results" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'LAB_TECHNICIAN']}>
                <DashboardLayout><LabEnterResults /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/lab/completed" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'LAB_TECHNICIAN']}>
                <DashboardLayout><LabCompletedOrders /></DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Radiologist routes */}
            <Route path="/radiology/queue" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RADIOLOGIST']}>
                <DashboardLayout><ImagingQueue /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/radiology/report" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RADIOLOGIST']}>
                <DashboardLayout><RadiologyEnterReport /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/radiology/history" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RADIOLOGIST']}>
                <DashboardLayout><RadiologyReportHistory /></DashboardLayout>
              </ProtectedRoute>
            } />

            {/* System */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
