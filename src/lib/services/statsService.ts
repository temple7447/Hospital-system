import { api } from '../api';
import type { AdminStats, DoctorStats, ReceptionistStats, PatientStats, NurseStats, PharmacistStats, LabTechStatsType, RadiologistStats } from '@/types';

export async function getAdminStats(): Promise<AdminStats> {
  const data = await api.get<{
    total_patients: number; total_staff: number; today_appointments: number;
    available_beds: number; total_beds: number; pending_invoices: number;
    monthly_revenue: number; low_stock_items: number;
  }>('/stats/admin');
  return {
    totalPatients: data.total_patients,
    totalStaff: data.total_staff,
    todayAppointments: data.today_appointments,
    availableBeds: data.available_beds,
    totalBeds: data.total_beds,
    pendingInvoices: data.pending_invoices,
    monthlyRevenue: data.monthly_revenue,
    lowStockItems: data.low_stock_items,
  };
}

export async function getDoctorStats(): Promise<DoctorStats> {
  const data = await api.get<{
    today_appointments: number; total_patients: number;
    pending_lab_orders: number; completed_today: number;
  }>('/stats/doctor');
  return {
    todayAppointments: data.today_appointments,
    totalPatients: data.total_patients,
    pendingLabOrders: data.pending_lab_orders,
    completedToday: data.completed_today,
  };
}

export async function getReceptionistStats(): Promise<ReceptionistStats> {
  const data = await api.get<{
    waiting_queue: number; today_registrations: number;
    today_appointments: number; pending_payments: number;
  }>('/stats/receptionist');
  return {
    waitingQueue: data.waiting_queue,
    todayRegistrations: data.today_registrations,
    todayAppointments: data.today_appointments,
    pendingPayments: data.pending_payments,
  };
}

export async function getPatientStats(): Promise<PatientStats> {
  const data = await api.get<{
    upcoming_appointments: number; active_prescriptions: number;
    pending_bills: number; total_visits: number;
  }>('/stats/patient');
  return {
    upcomingAppointments: data.upcoming_appointments,
    activePrescriptions: data.active_prescriptions,
    pendingBills: data.pending_bills,
    totalVisits: data.total_visits,
  };
}

export async function getNurseStats(): Promise<NurseStats> {
  const data = await api.get<{
    tasks_today: number; tasks_completed: number; vitals_recorded_today: number;
  }>('/stats/nurse');
  return {
    myPatients: 0,
    tasksToday: data.tasks_today,
    tasksCompleted: data.tasks_completed,
    vitalsRecordedToday: data.vitals_recorded_today,
  };
}

export async function getPharmacistStats(): Promise<PharmacistStats> {
  const data = await api.get<{
    pending_prescriptions: number; dispensed_today: number;
    low_stock_medicines: number; total_active: number;
  }>('/stats/pharmacist');
  return {
    pendingPrescriptions: data.pending_prescriptions,
    dispensedToday: data.dispensed_today,
    lowStockMedicines: data.low_stock_medicines,
    totalActive: data.total_active,
  };
}

export async function getLabTechStats(): Promise<LabTechStatsType> {
  const data = await api.get<{
    pending_orders: number; in_progress: number;
    completed_today: number; urgent_orders: number;
  }>('/stats/lab-tech');
  return {
    pendingOrders: data.pending_orders,
    inProgress: data.in_progress,
    completedToday: data.completed_today,
    urgentOrders: data.urgent_orders,
  };
}

export async function getRadiologistStats(): Promise<RadiologistStats> {
  const data = await api.get<{
    pending_imaging: number; in_progress: number;
    completed_today: number; urgent_imaging: number;
  }>('/stats/radiologist');
  return {
    pendingImaging: data.pending_imaging,
    inProgress: data.in_progress,
    completedToday: data.completed_today,
    urgentImaging: data.urgent_imaging,
  };
}
