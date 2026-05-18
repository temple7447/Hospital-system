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
            <Route path="/register" element={<RegisterPage />} />
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
