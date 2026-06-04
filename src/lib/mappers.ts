import type { User, Role } from '@/types/auth';
import type {
  Patient, BloodType, Appointment, Prescription, PrescriptionItem, VitalRecord,
  AppointmentStatus, PrescriptionStatus,
  Staff, StaffRole, StaffStatus, WeekDay,
  Department, Room, LabOrder, LabResult, Invoice, InvoiceItem, PaymentMethod,
  InventoryItem, ConsultationNote, QueueEntry, NursingTask, Notification,
} from '@/types';

// ─── Auth ─────────────────────────────────────────────────────

export interface BackendUser {
  id: string;
  username: string;
  role: string;
  full_name: string;
  phone?: string;
}

const ROLE_MAP: Record<string, Role> = {
  admin: 'ADMIN',
  doctor: 'DOCTOR',
  nurse: 'NURSE',
  receptionist: 'RECEPTIONIST',
  pharmacist: 'PHARMACIST',
  lab_technician: 'LAB_TECHNICIAN',
  radiologist: 'RADIOLOGIST',
  patient: 'PATIENT',
};

export function mapBackendUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.full_name,
    email: user.username,
    role: ROLE_MAP[user.role] || 'DOCTOR',
  };
}

export function mapBackendLoginResponse(data: { token: string; user: BackendUser }) {
  return {
    token: data.token,
    user: mapBackendUser(data.user),
  };
}

// ─── Patients ─────────────────────────────────────────────────

export interface BackendPatient {
  id: string;
  medical_record_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  blood_type: string | null;
  allergies: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function mapBackendPatient(p: BackendPatient): Patient {
  let allergies: string[] = [];
  try {
    if (p.allergies) allergies = JSON.parse(p.allergies);
  } catch { /* ignore */ }

  return {
    id: p.id,
    patientNumber: p.medical_record_number,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email || '',
    phone: p.phone || '',
    dateOfBirth: p.date_of_birth,
    gender: p.gender as 'male' | 'female' | 'other',
    bloodType: (p.blood_type as BloodType) || 'unknown',
    address: p.address || '',
    city: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies,
    chronicConditions: [],
    insuranceProvider: '',
    insuranceNumber: '',
    status: 'active' as const,
    registeredAt: p.created_at,
    assignedDoctorId: undefined,
  };
}

export function toBackendPatient(data: Partial<Patient>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (data.firstName !== undefined) result.first_name = data.firstName;
  if (data.lastName !== undefined) result.last_name = data.lastName;
  if (data.dateOfBirth !== undefined) result.date_of_birth = data.dateOfBirth;
  if (data.gender !== undefined) result.gender = data.gender;
  if (data.phone !== undefined) result.phone = data.phone;
  if (data.email !== undefined) result.email = data.email;
  if (data.address !== undefined) result.address = data.address;
  if (data.bloodType !== undefined) result.blood_type = data.bloodType;
  if (data.allergies !== undefined) result.allergies = JSON.stringify(data.allergies);
  if (data.patientNumber !== undefined) result.medical_record_number = data.patientNumber;
  return result;
}

// ─── Appointments ─────────────────────────────────────────────

export interface BackendAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient_name?: string;
  doctor_name?: string;
}

const APPOINTMENT_STATUS_MAP: Record<string, AppointmentStatus> = {
  scheduled: 'scheduled',
  confirmed: 'confirmed',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
};

export function mapBackendAppointment(a: BackendAppointment): Appointment {
  return {
    id: a.id,
    appointmentNumber: `APT-${a.id.slice(0, 8)}`,
    patientId: a.patient_id,
    doctorId: a.doctor_id,
    departmentId: '',
    date: a.appointment_date,
    time: a.start_time,
    duration: timeToMinutes(a.start_time, a.end_time),
    type: 'consultation' as const,
    status: APPOINTMENT_STATUS_MAP[a.status] || 'scheduled',
    reason: a.reason || '',
    notes: a.notes,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

function timeToMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

export function toBackendAppointment(data: Partial<Appointment>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (data.patientId !== undefined) result.patient_id = data.patientId;
  if (data.doctorId !== undefined) result.doctor_id = data.doctorId;
  if (data.date !== undefined) result.appointment_date = data.date;
  if (data.time !== undefined) result.start_time = data.time;
  if (data.status !== undefined) result.status = data.status.toLowerCase();
  if (data.reason !== undefined) result.reason = data.reason;
  if (data.notes !== undefined) result.notes = data.notes;

  if (data.duration !== undefined && data.time) {
    const [h, m] = data.time.split(':').map(Number);
    const totalMinutes = h * 60 + m + data.duration;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    result.end_time = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  } else if (data.time) {
    result.end_time = data.time;
  }
  return result;
}

// ─── Prescriptions ────────────────────────────────────────────

export interface BackendPrescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient_name?: string;
  doctor_name?: string;
}

const PRESCRIPTION_STATUS_MAP: Record<string, PrescriptionStatus> = {
  active: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
  dispensed: 'dispensed',
};

export function mapBackendPrescription(rx: BackendPrescription): Prescription {
  const item: PrescriptionItem = {
    medicine: rx.medication_name,
    dosage: rx.dosage,
    frequency: rx.frequency,
    duration: rx.duration || '',
    instructions: rx.notes || undefined,
  };

  return {
    id: rx.id,
    prescriptionNumber: `RX-${rx.id.slice(0, 8)}`,
    patientId: rx.patient_id,
    doctorId: rx.doctor_id,
    items: [item],
    diagnosis: rx.notes || '',
    notes: rx.notes,
    status: PRESCRIPTION_STATUS_MAP[rx.status] || 'active',
    createdAt: rx.created_at,
    expiresAt: '',
    dispensedAt: undefined,
    dispensedBy: undefined,
  };
}

export function toBackendPrescription(data: Partial<Prescription>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (data.patientId !== undefined) result.patient_id = data.patientId;
  if (data.doctorId !== undefined) result.doctor_id = data.doctorId;
  if (data.status !== undefined) result.status = data.status.toLowerCase();
  if (data.notes !== undefined) result.notes = data.notes;

  if (data.items && data.items.length > 0) {
    result.medication_name = data.items[0].medicine;
    result.dosage = data.items[0].dosage;
    result.frequency = data.items[0].frequency;
    result.duration = data.items[0].duration || null;
    if (data.items[0].instructions) result.notes = data.items[0].instructions;
  }
  return result;
}

// ─── Vitals ───────────────────────────────────────────────────

export interface BackendVital {
  id: string;
  patient_id: string;
  recorded_by: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature: number | null;
  oxygen_saturation: number | null;
  respiratory_rate: number | null;
  notes: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  recorded_by_name?: string;
}

export function mapBackendVital(v: BackendVital): VitalRecord {
  return {
    id: v.id,
    patientId: v.patient_id,
    recordedBy: v.recorded_by,
    bloodPressureSystolic: v.blood_pressure_systolic || 0,
    bloodPressureDiastolic: v.blood_pressure_diastolic || 0,
    heartRate: v.heart_rate || 0,
    temperature: v.temperature || 0,
    weight: 0,
    height: 0,
    oxygenSaturation: v.oxygen_saturation || 0,
    respiratoryRate: v.respiratory_rate || 0,
    recordedAt: v.recorded_at,
  };
}

export function toBackendVital(data: Partial<VitalRecord>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (data.patientId !== undefined) result.patient_id = data.patientId;
  if (data.recordedBy !== undefined) result.recorded_by = data.recordedBy;
  if (data.bloodPressureSystolic !== undefined) result.blood_pressure_systolic = data.bloodPressureSystolic;
  if (data.bloodPressureDiastolic !== undefined) result.blood_pressure_diastolic = data.bloodPressureDiastolic;
  if (data.heartRate !== undefined) result.heart_rate = data.heartRate;
  if (data.temperature !== undefined) result.temperature = data.temperature;
  if (data.oxygenSaturation !== undefined) result.oxygen_saturation = data.oxygenSaturation;
  if (data.respiratoryRate !== undefined) result.respiratory_rate = data.respiratoryRate;
  if (data.recordedAt !== undefined) result.recorded_at = data.recordedAt;
  return result;
}

// ─── Staff ────────────────────────────────────────────────────

export interface BackendStaff {
  id: string;
  user_id: string | null;
  staff_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department_id: string | null;
  specialization: string | null;
  license_number: string | null;
  date_joined: string | null;
  status: string;
  working_days: string | null;
  working_hours_start: string | null;
  working_hours_end: string | null;
  avatar: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string | null;
  salary: number | null;
  department_name?: string;
}

export function mapBackendStaff(s: BackendStaff): Staff {
  let workingDays: string[] = [];
  try { if (s.working_days) workingDays = JSON.parse(s.working_days); } catch { /* ignore */ }

  return {
    id: s.id,
    staffNumber: s.staff_number,
    firstName: s.first_name,
    lastName: s.last_name,
    email: s.email || '',
    phone: s.phone || '',
    role: mapRole(s.role) as StaffRole,
    departmentId: s.department_id || undefined,
    specialization: s.specialization || undefined,
    licenseNumber: s.license_number || undefined,
    dateJoined: s.date_joined || '',
    status: (s.status as StaffStatus) || 'active',
    workingDays: workingDays as WeekDay[],
    workingHours: { start: s.working_hours_start || '09:00', end: s.working_hours_end || '17:00' },
    avatar: s.avatar || undefined,
    address: s.address || undefined,
    dateOfBirth: s.date_of_birth || undefined,
    gender: s.gender as 'male' | 'female' | 'other' | undefined,
    salary: s.salary || undefined,
  };
}

export function toBackendStaff(data: Partial<Staff>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (data.staffNumber !== undefined) r.staff_number = data.staffNumber;
  if (data.firstName !== undefined) r.first_name = data.firstName;
  if (data.lastName !== undefined) r.last_name = data.lastName;
  if (data.email !== undefined) r.email = data.email;
  if (data.phone !== undefined) r.phone = data.phone;
  if (data.role !== undefined) r.role = data.role.toLowerCase();
  if (data.departmentId !== undefined) r.department_id = data.departmentId;
  if (data.specialization !== undefined) r.specialization = data.specialization;
  if (data.licenseNumber !== undefined) r.license_number = data.licenseNumber;
  if (data.dateJoined !== undefined) r.date_joined = data.dateJoined;
  if (data.status !== undefined) r.status = data.status;
  if (data.workingDays !== undefined) r.working_days = JSON.stringify(data.workingDays);
  if (data.workingHours !== undefined) { r.working_hours_start = data.workingHours.start; r.working_hours_end = data.workingHours.end; }
  if (data.avatar !== undefined) r.avatar = data.avatar;
  if (data.address !== undefined) r.address = data.address;
  if (data.dateOfBirth !== undefined) r.date_of_birth = data.dateOfBirth;
  if (data.gender !== undefined) r.gender = data.gender;
  if (data.salary !== undefined) r.salary = data.salary;
  return r;
}

function mapRole(role: string): string {
  const map: Record<string, string> = { admin: 'ADMIN', doctor: 'DOCTOR', nurse: 'NURSE', receptionist: 'RECEPTIONIST', pharmacist: 'PHARMACIST', lab_technician: 'LAB_TECHNICIAN', radiologist: 'RADIOLOGIST' };
  return map[role] || 'DOCTOR';
}

// ─── Departments ──────────────────────────────────────────────

export interface BackendDepartment {
  id: string;
  name: string;
  description: string | null;
  head_doctor_id: string | null;
  floor: string | null;
  total_beds: number;
  available_beds: number;
  color: string | null;
  icon: string | null;
}

export function mapBackendDepartment(d: BackendDepartment): Department {
  return {
    id: d.id,
    name: d.name,
    description: d.description || '',
    headDoctorId: d.head_doctor_id || undefined,
    floor: d.floor || '',
    totalBeds: d.total_beds,
    availableBeds: d.available_beds,
    color: d.color || '#3b82f6',
    icon: d.icon || 'Building2',
  };
}

export function toBackendDepartment(data: Partial<Department>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (data.name !== undefined) r.name = data.name;
  if (data.description !== undefined) r.description = data.description;
  if (data.headDoctorId !== undefined) r.head_doctor_id = data.headDoctorId;
  if (data.floor !== undefined) r.floor = data.floor;
  if (data.totalBeds !== undefined) r.total_beds = data.totalBeds;
  if (data.availableBeds !== undefined) r.available_beds = data.availableBeds;
  if (data.color !== undefined) r.color = data.color;
  if (data.icon !== undefined) r.icon = data.icon;
  return r;
}

// ─── Rooms ────────────────────────────────────────────────────

export interface BackendRoom {
  id: string;
  room_number: string;
  type: string;
  floor: string | null;
  department_id: string | null;
  capacity: number;
  occupied_beds: number;
  status: string;
  department_name?: string;
}

const ROOM_TYPE_MAP: Record<string, string> = { ward: 'general', private: 'private', icu: 'icu', emergency: 'emergency', operation: 'operation', consultation: 'consultation' };
const ROOM_STATUS_MAP: Record<string, string> = { available: 'available', occupied: 'full', maintenance: 'maintenance', reserved: 'reserved', cleaning: 'maintenance' };

export function mapBackendRoom(r: BackendRoom): Room {
  return {
    id: r.id,
    roomNumber: r.room_number,
    type: (ROOM_TYPE_MAP[r.type] || 'general') as Room['type'],
    floor: parseInt(r.floor || '0'),
    departmentId: r.department_id || '',
    capacity: r.capacity,
    occupiedBeds: r.occupied_beds,
    status: (ROOM_STATUS_MAP[r.status] || 'available') as Room['status'],
  };
}

export function toBackendRoom(data: Partial<Room>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (data.roomNumber !== undefined) r.room_number = data.roomNumber;
  if (data.floor !== undefined) r.floor = String(data.floor);
  if (data.departmentId !== undefined) r.department_id = data.departmentId;
  if (data.capacity !== undefined) r.capacity = data.capacity;
  if (data.occupiedBeds !== undefined) r.occupied_beds = data.occupiedBeds;
  return r;
}

// ─── Lab Orders ───────────────────────────────────────────────

export interface BackendLabOrder {
  id: string;
  lab_number: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  tests: string;
  results: string | null;
  status: string;
  priority: string;
  category: string | null;
  notes: string | null;
  ordered_at: string;
  completed_at: string | null;
  processed_by: string | null;
  patient_name?: string;
  doctor_name?: string;
}

export function mapBackendLabOrder(l: BackendLabOrder): LabOrder {
  let tests: string[] = [];
  let results: LabResult[] | undefined;
  try { tests = JSON.parse(l.tests); } catch { tests = [l.tests]; }
  try { if (l.results) results = JSON.parse(l.results); } catch { /* ignore */ }

  return {
    id: l.id,
    labNumber: l.lab_number,
    patientId: l.patient_id,
    doctorId: l.doctor_id,
    appointmentId: l.appointment_id || undefined,
    tests,
    results,
    status: l.status as LabOrder['status'],
    priority: l.priority as LabOrder['priority'],
    category: (l.category as LabOrder['category']) || undefined,
    notes: l.notes || undefined,
    orderedAt: l.ordered_at,
    completedAt: l.completed_at || undefined,
    processedBy: l.processed_by || undefined,
  };
}

export function toBackendLabOrder(data: Partial<LabOrder>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (data.patientId !== undefined) r.patient_id = data.patientId;
  if (data.doctorId !== undefined) r.doctor_id = data.doctorId;
  if (data.appointmentId !== undefined) r.appointment_id = data.appointmentId;
  if (data.tests !== undefined) r.tests = JSON.stringify(data.tests);
  if (data.results !== undefined) r.results = JSON.stringify(data.results);
  if (data.status !== undefined) r.status = data.status;
  if (data.priority !== undefined) r.priority = data.priority;
  if (data.category !== undefined) r.category = data.category;
  if (data.notes !== undefined) r.notes = data.notes;
  return r;
}

// ─── Invoices ─────────────────────────────────────────────────

export interface BackendInvoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  appointment_id: string | null;
  items: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amount_paid: number;
  status: string;
  payment_method: string | null;
  notes: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  patient_name?: string;
}

export function mapBackendInvoice(i: BackendInvoice): Invoice {
  let items: InvoiceItem[] = [];
  try { items = JSON.parse(i.items); } catch { /* ignore */ }

  return {
    id: i.id,
    invoiceNumber: i.invoice_number,
    patientId: i.patient_id,
    appointmentId: i.appointment_id || undefined,
    items,
    subtotal: i.subtotal,
    tax: i.tax,
    discount: i.discount,
    total: i.total,
    amountPaid: i.amount_paid,
    status: i.status as Invoice['status'],
    paymentMethod: (i.payment_method as PaymentMethod) || undefined,
    notes: i.notes || undefined,
    createdAt: i.created_at,
    dueDate: i.due_date || '',
    paidAt: i.paid_at || undefined,
  };
}

export function toBackendInvoice(data: Partial<Invoice>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (data.patientId !== undefined) r.patient_id = data.patientId;
  if (data.appointmentId !== undefined) r.appointment_id = data.appointmentId;
  if (data.items !== undefined) r.items = JSON.stringify(data.items);
  if (data.subtotal !== undefined) r.subtotal = data.subtotal;
  if (data.tax !== undefined) r.tax = data.tax;
  if (data.discount !== undefined) r.discount = data.discount;
  if (data.total !== undefined) r.total = data.total;
  if (data.amountPaid !== undefined) r.amount_paid = data.amountPaid;
  if (data.status !== undefined) r.status = data.status;
  if (data.paymentMethod !== undefined) r.payment_method = data.paymentMethod;
  if (data.notes !== undefined) r.notes = data.notes;
  if (data.dueDate !== undefined) r.due_date = data.dueDate;
  return r;
}

// ─── Inventory ────────────────────────────────────────────────

export interface BackendInventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  unit_price: number;
  supplier: string | null;
  expiry_date: string | null;
  location: string | null;
  last_restocked: string | null;
}

export function mapBackendInventoryItem(i: BackendInventoryItem): InventoryItem {
  return {
    id: i.id,
    name: i.name,
    category: i.category as InventoryItem['category'],
    unit: i.unit,
    quantity: i.quantity,
    minQuantity: i.min_quantity,
    unitPrice: i.unit_price,
    supplier: i.supplier || '',
    expiryDate: i.expiry_date || undefined,
    location: i.location || '',
    lastRestocked: i.last_restocked || '',
  };
}

export function toBackendInventoryItem(data: Partial<InventoryItem>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (data.name !== undefined) r.name = data.name;
  if (data.category !== undefined) r.category = data.category;
  if (data.unit !== undefined) r.unit = data.unit;
  if (data.quantity !== undefined) r.quantity = data.quantity;
  if (data.minQuantity !== undefined) r.min_quantity = data.minQuantity;
  if (data.unitPrice !== undefined) r.unit_price = data.unitPrice;
  if (data.supplier !== undefined) r.supplier = data.supplier;
  if (data.expiryDate !== undefined) r.expiry_date = data.expiryDate;
  if (data.location !== undefined) r.location = data.location;
  return r;
}

// ─── Consultation Notes ───────────────────────────────────────

export interface BackendConsultationNote {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  doctor_name?: string;
}

export function mapBackendConsultationNote(n: BackendConsultationNote): ConsultationNote {
  return {
    id: n.id,
    patientId: n.patient_id,
    doctorId: n.doctor_id,
    appointmentId: n.appointment_id || '',
    subjective: n.subjective || '',
    objective: n.objective || '',
    assessment: n.assessment || '',
    plan: n.plan || '',
    createdAt: n.created_at,
    updatedAt: n.updated_at,
  };
}

export function toBackendConsultationNote(data: Partial<ConsultationNote>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (data.patientId !== undefined) r.patient_id = data.patientId;
  if (data.doctorId !== undefined) r.doctor_id = data.doctorId;
  if (data.appointmentId !== undefined) r.appointment_id = data.appointmentId;
  if (data.subjective !== undefined) r.subjective = data.subjective;
  if (data.objective !== undefined) r.objective = data.objective;
  if (data.assessment !== undefined) r.assessment = data.assessment;
  if (data.plan !== undefined) r.plan = data.plan;
  return r;
}

// ─── Queue ────────────────────────────────────────────────────

export interface BackendQueueEntry {
  id: string;
  token_number: string;
  patient_id: string;
  doctor_id: string | null;
  appointment_id: string | null;
  status: string;
  priority: string;
  estimated_wait: number | null;
  checked_in_at: string;
  called_at: string | null;
  completed_at: string | null;
  patient_name?: string;
  doctor_name?: string;
}

export function mapBackendQueueEntry(q: BackendQueueEntry): QueueEntry {
  return {
    id: q.id,
    tokenNumber: q.token_number,
    patientId: q.patient_id,
    doctorId: q.doctor_id || '',
    appointmentId: q.appointment_id || undefined,
    status: q.status as QueueEntry['status'],
    priority: q.priority as QueueEntry['priority'],
    estimatedWait: q.estimated_wait || 0,
    checkedInAt: q.checked_in_at,
    calledAt: q.called_at || undefined,
    completedAt: q.completed_at || undefined,
  };
}

export function toBackendQueueEntry(data: Partial<QueueEntry>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (data.patientId !== undefined) result.patient_id = data.patientId;
  if (data.doctorId !== undefined) result.doctor_id = data.doctorId;
  if (data.appointmentId !== undefined) result.appointment_id = data.appointmentId;
  if (data.status !== undefined) result.status = data.status;
  if (data.priority !== undefined) result.priority = data.priority;
  if (data.estimatedWait !== undefined) result.estimated_wait = data.estimatedWait;
  if (data.tokenNumber !== undefined) result.token_number = data.tokenNumber;
  return result;
}

// ─── Nursing Tasks ────────────────────────────────────────────

export interface BackendNursingTask {
  id: string;
  patient_id: string;
  nurse_id: string;
  type: string;
  description: string | null;
  scheduled_at: string;
  completed_at: string | null;
  status: string;
  notes: string | null;
  patient_name?: string;
  nurse_name?: string;
}

export function mapBackendNursingTask(t: BackendNursingTask): NursingTask {
  return {
    id: t.id,
    patientId: t.patient_id,
    nurseId: t.nurse_id,
    type: t.type as NursingTask['type'],
    description: t.description || '',
    scheduledAt: t.scheduled_at,
    completedAt: t.completed_at || undefined,
    status: t.status as NursingTask['status'],
    notes: t.notes || undefined,
  };
}

export function toBackendNursingTask(data: Partial<NursingTask>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (data.patientId !== undefined) r.patient_id = data.patientId;
  if (data.nurseId !== undefined) r.nurse_id = data.nurseId;
  if (data.type !== undefined) r.type = data.type;
  if (data.description !== undefined) r.description = data.description;
  if (data.scheduledAt !== undefined) r.scheduled_at = data.scheduledAt;
  if (data.status !== undefined) r.status = data.status;
  if (data.notes !== undefined) r.notes = data.notes;
  return r;
}

// ─── Notifications ────────────────────────────────────────────

export interface BackendNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  read: number;
  link: string | null;
  created_at: string;
}

export function mapBackendNotification(n: BackendNotification): Notification {
  return {
    id: n.id,
    userId: n.user_id,
    type: n.type as Notification['type'],
    title: n.title,
    message: n.message || '',
    read: n.read === 1,
    link: n.link || undefined,
    createdAt: n.created_at,
  };
}
