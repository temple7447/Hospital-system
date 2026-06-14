import { listPatients } from './services/patientService';
import { listAppointments } from './services/appointmentService';
import { listPrescriptions } from './services/prescriptionService';
import { listVitals } from './services/vitalsService';
import { listStaff } from './services/staffService';
import { listDepartments } from './services/departmentService';
import { listRooms } from './services/roomService';
import { listLabOrders } from './services/labOrderService';
import { listInvoices } from './services/invoiceService';
import { listInventory } from './services/inventoryService';
import { listConsultationNotes } from './services/consultationNoteService';
import { listQueue } from './services/queueService';
import { listNursingTasks } from './services/nursingTaskService';
import { KEYS, setAll } from './storage';
import { getToken } from './api';
import type {
  Patient, Appointment, Prescription, VitalRecord,
  Staff, Department, Room, LabOrder, Invoice, InventoryItem,
  ConsultationNote, QueueEntry, NursingTask,
} from '@/types';

export async function syncAll(): Promise<void> {
  if (!getToken()) return;

  await Promise.allSettled([
    syncPatients(),
    syncAppointments(),
    syncPrescriptions(),
    syncVitals(),
    syncStaff(),
    syncDepartments(),
    syncRooms(),
    syncLabOrders(),
    syncInvoices(),
    syncInventory(),
    syncConsultationNotes(),
    syncQueue(),
    syncNursingTasks(),
  ]);
}

async function syncPatients(): Promise<void> {
  const patients = await listPatients({ limit: 500 });
  setAll<Patient>(KEYS.PATIENTS, patients);
}

async function syncAppointments(): Promise<void> {
  const appointments = await listAppointments({ limit: 500 });
  setAll<Appointment>(KEYS.APPOINTMENTS, appointments);
}

async function syncPrescriptions(): Promise<void> {
  const prescriptions = await listPrescriptions({ limit: 500 });
  setAll<Prescription>(KEYS.PRESCRIPTIONS, prescriptions);
}

async function syncVitals(): Promise<void> {
  const vitals = await listVitals({ limit: 500 });
  setAll<VitalRecord>(KEYS.VITALS, vitals);
}

async function syncStaff(): Promise<void> {
  const staff = await listStaff({ limit: 500 });
  setAll<Staff>(KEYS.STAFF, staff);
}

async function syncDepartments(): Promise<void> {
  const departments = await listDepartments({ onlyActive: true });
  setAll<Department>(KEYS.DEPARTMENTS, departments);
}

async function syncRooms(): Promise<void> {
  const rooms = await listRooms({ limit: 500 });
  setAll<Room>(KEYS.ROOMS, rooms);
}

async function syncLabOrders(): Promise<void> {
  const orders = await listLabOrders({ limit: 500 });
  if (orders.length > 0) setAll<LabOrder>(KEYS.LAB_ORDERS, orders);
}

async function syncInvoices(): Promise<void> {
  const invoices = await listInvoices({ limit: 500 });
  setAll<Invoice>(KEYS.INVOICES, invoices);
}

async function syncInventory(): Promise<void> {
  const items = await listInventory({ limit: 500 });
  setAll<InventoryItem>(KEYS.INVENTORY, items);
}

async function syncConsultationNotes(): Promise<void> {
  const notes = await listConsultationNotes({ limit: 500 });
  setAll<ConsultationNote>(KEYS.CONSULTATION_NOTES, notes);
}

async function syncQueue(): Promise<void> {
  const queue = await listQueue({ limit: 500 });
  setAll<QueueEntry>(KEYS.QUEUE, queue);
}

async function syncNursingTasks(): Promise<void> {
  const tasks = await listNursingTasks({ limit: 500 });
  setAll<NursingTask>(KEYS.NURSING_TASKS, tasks);
}
