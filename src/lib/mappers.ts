import type { User, Role } from '@/types/auth';
import type {
  Patient, BloodType, Appointment, Prescription, PrescriptionItem, VitalRecord,
  AppointmentStatus, PrescriptionStatus, TriageLevel,
  Staff, StaffRole, StaffStatus, WeekDay,
  Department, Room, LabOrder, LabResult, Invoice, InvoiceItem, PaymentMethod,
  InventoryItem, ConsultationNote, QueueEntry, NursingTask, Notification,
  Admission, AdmissionStatus,
} from '@/types';

// ─── Auth ─────────────────────────────────────────────────────

export interface BackendUser {
  id: string;
  username: string;
  role: string;
  full_name: string;
  phone?: string;
}

// Maps every backend role to one of the 7 dashboard categories used for route access control
export const ROLE_MAP: Record<string, Role> = {
  // Administration
  admin: 'ADMIN', chief_medical_officer: 'ADMIN', medical_director: 'ADMIN',
  medical_superintendent: 'ADMIN', coo: 'ADMIN', cfo: 'ADMIN',
  hr_manager: 'ADMIN', quality_manager: 'ADMIN', legal_compliance_officer: 'ADMIN',
  // Doctors & Specialists (all get DOCTOR dashboard)
  doctor: 'DOCTOR', surgeon: 'DOCTOR', trauma_surgeon: 'DOCTOR',
  anesthesiologist: 'DOCTOR', intensivist: 'DOCTOR', emergency_physician: 'DOCTOR',
  pediatrician: 'DOCTOR', cardiologist: 'DOCTOR', neurologist: 'DOCTOR',
  oncologist: 'DOCTOR', gynecologist: 'DOCTOR', psychiatrist: 'DOCTOR',
  pathologist: 'DOCTOR', resident_doctor: 'DOCTOR', intern: 'DOCTOR',
  // Nursing (all get NURSE dashboard)
  chief_nursing_officer: 'NURSE', nurse_manager: 'NURSE', nurse: 'NURSE',
  nurse_practitioner: 'NURSE', icu_nurse: 'NURSE', er_nurse: 'NURSE',
  or_nurse: 'NURSE', midwife: 'NURSE', nursing_assistant: 'NURSE',
  infection_control_nurse: 'NURSE',
  // Reception & Admin Support
  receptionist: 'RECEPTIONIST', admissions_officer: 'RECEPTIONIST',
  medical_records_clerk: 'RECEPTIONIST', billing_specialist: 'RECEPTIONIST',
  patient_relations_officer: 'RECEPTIONIST',
  // Pharmacy
  pharmacist: 'PHARMACIST', pharmacy_technician: 'PHARMACIST',
  // Lab & Diagnostics
  lab_technician: 'LAB_TECHNICIAN', radiologic_technologist: 'LAB_TECHNICIAN',
  phlebotomist: 'LAB_TECHNICIAN', ecg_technician: 'LAB_TECHNICIAN',
  sonographer: 'LAB_TECHNICIAN', surgical_technologist: 'LAB_TECHNICIAN',
  sterilization_technician: 'LAB_TECHNICIAN',
  // Radiology
  radiologist: 'RADIOLOGIST',
  // Therapy & Support (use closest dashboard)
  respiratory_therapist: 'NURSE', physical_therapist: 'NURSE',
  occupational_therapist: 'NURSE', speech_therapist: 'NURSE',
  social_worker: 'RECEPTIONIST', nutritionist: 'NURSE',
  paramedic: 'DOCTOR', patient_care_assistant: 'NURSE',
  // Patient portal
  patient: 'PATIENT',
};

export function mapBackendUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.full_name,
    email: user.username,
    role: ROLE_MAP[user.role] ?? 'DOCTOR',
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
  user_id?: string | null;
  medical_record_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  blood_type: string | null;
  allergies: string | null;
  chronic_conditions: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  assigned_doctor_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function mapBackendPatient(p: BackendPatient): Patient {
  let allergies: string[] = [];
  let chronicConditions: string[] = [];
  try { if (p.allergies) allergies = JSON.parse(p.allergies); } catch { /* ignore */ }
  try { if (p.chronic_conditions) chronicConditions = JSON.parse(p.chronic_conditions); } catch { /* ignore */ }

  return {
    id: p.id,
    userId: p.user_id || undefined,
    patientNumber: p.medical_record_number,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email || '',
    phone: p.phone || '',
    dateOfBirth: p.date_of_birth,
    gender: p.gender as 'male' | 'female' | 'other',
    bloodType: (p.blood_type as BloodType) || 'unknown',
    address: p.address || '',
    city: p.city || '',
    emergencyContactName: p.emergency_contact_name || '',
    emergencyContactPhone: p.emergency_contact_phone || '',
    allergies,
    chronicConditions,
    insuranceProvider: p.insurance_provider || undefined,
    insuranceNumber: p.insurance_number || undefined,
    status: (p.status as Patient['status']) || 'active',
    registeredAt: p.created_at,
    assignedDoctorId: p.assigned_doctor_id || undefined,
  };
}

export function toBackendPatient(data: Partial<Patient>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (data.patientNumber !== undefined) result.medical_record_number = data.patientNumber;
  if (data.firstName !== undefined) result.first_name = data.firstName;
  if (data.lastName !== undefined) result.last_name = data.lastName;
  if (data.dateOfBirth !== undefined) result.date_of_birth = data.dateOfBirth;
  if (data.gender !== undefined) result.gender = data.gender;
  if (data.phone !== undefined) result.phone = data.phone;
  if (data.email !== undefined) result.email = data.email;
  if (data.address !== undefined) result.address = data.address;
  if (data.city !== undefined) result.city = data.city;
  if (data.bloodType !== undefined) result.blood_type = data.bloodType;
  if (data.allergies !== undefined) result.allergies = JSON.stringify(data.allergies);
  if (data.chronicConditions !== undefined) result.chronic_conditions = JSON.stringify(data.chronicConditions);
  if (data.emergencyContactName !== undefined) result.emergency_contact_name = data.emergencyContactName;
  if (data.emergencyContactPhone !== undefined) result.emergency_contact_phone = data.emergencyContactPhone;
  if (data.insuranceProvider !== undefined) result.insurance_provider = data.insuranceProvider;
  if (data.insuranceNumber !== undefined) result.insurance_number = data.insuranceNumber;
  if (data.assignedDoctorId !== undefined) result.assigned_doctor_id = data.assignedDoctorId || null;
  if (data.status !== undefined) result.status = data.status;
  return result;
}

// ─── Appointments ─────────────────────────────────────────────

export interface BackendAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  department_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  type: string | null;
  status: string;
  reason: string | null;
  notes: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient_name?: string;
  doctor_name?: string;
  department_name?: string;
}

const APPOINTMENT_STATUS_MAP: Record<string, AppointmentStatus> = {
  scheduled: 'scheduled',
  confirmed: 'confirmed',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'no_show',
};

export function mapBackendAppointment(a: BackendAppointment): Appointment {
  return {
    id: a.id,
    appointmentNumber: `APT-${a.id.slice(0, 8)}`,
    patientId: a.patient_id,
    doctorId: a.doctor_id,
    departmentId: a.department_id || '',
    departmentName: a.department_name || undefined,
    date: a.appointment_date,
    time: a.start_time,
    duration: timeToMinutes(a.start_time, a.end_time),
    type: (a.type as Appointment['type']) || 'consultation',
    status: APPOINTMENT_STATUS_MAP[a.status] || 'scheduled',
    reason: a.reason || '',
    notes: a.notes ?? undefined,
    cancelledReason: a.cancelled_reason ?? undefined,
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
  if (data.departmentId !== undefined) result.department_id = data.departmentId || null;
  if (data.date !== undefined) result.appointment_date = data.date;
  if (data.time !== undefined) result.start_time = data.time;
  if (data.type !== undefined) result.type = data.type;
  if (data.status !== undefined) result.status = data.status.toLowerCase();
  if (data.reason !== undefined) result.reason = data.reason;
  if (data.notes !== undefined) result.notes = data.notes;
  if (data.cancelledReason !== undefined) result.cancelled_reason = data.cancelledReason;

  if (data.duration !== undefined && data.time) {
    const [h, m] = data.time.split(':').map(Number);
    const totalMinutes = h * 60 + m + data.duration;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    result.end_time = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }
  return result;
}

// ─── Prescriptions ────────────────────────────────────────────

export interface BackendPrescription {
  id: string;
  prescription_number: string | null;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  diagnosis: string | null;
  notes: string | null;
  expires_at: string | null;
  dispensed_at: string | null;
  dispensed_by: string | null;
  status: string;
  items: string | null;
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
  let items: PrescriptionItem[] = [];
  if (rx.items) {
    try {
      const parsed = JSON.parse(rx.items);
      if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
    } catch { /* ignore */ }
  }
  if (items.length === 0) {
    items = [{
      medicine: rx.medication_name,
      dosage: rx.dosage,
      frequency: rx.frequency,
      duration: rx.duration || '',
      instructions: rx.notes || undefined,
    }];
  }

  return {
    id: rx.id,
    prescriptionNumber: rx.prescription_number || `RX-${rx.id.slice(0, 8)}`,
    patientId: rx.patient_id,
    doctorId: rx.doctor_id,
    appointmentId: rx.appointment_id || undefined,
    items,
    diagnosis: rx.diagnosis || rx.notes || '',
    notes: rx.notes ?? undefined,
    status: PRESCRIPTION_STATUS_MAP[rx.status] || 'active',
    createdAt: rx.created_at,
    expiresAt: rx.expires_at || '',
    dispensedAt: rx.dispensed_at || undefined,
    dispensedBy: rx.dispensed_by || undefined,
  };
}

export function toBackendPrescription(data: Partial<Prescription>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (data.patientId !== undefined) result.patient_id = data.patientId;
  if (data.doctorId !== undefined) result.doctor_id = data.doctorId;
  if (data.appointmentId !== undefined) result.appointment_id = data.appointmentId || null;
  if (data.diagnosis !== undefined) result.diagnosis = data.diagnosis;
  if (data.status !== undefined) result.status = data.status.toLowerCase();
  if (data.notes !== undefined) result.notes = data.notes;
  if (data.expiresAt !== undefined) result.expires_at = data.expiresAt || null;
  if (data.dispensedAt !== undefined) result.dispensed_at = data.dispensedAt;
  if (data.dispensedBy !== undefined) result.dispensed_by = data.dispensedBy;

  if (data.items && data.items.length > 0) {
    // Send full items array for multi-medication support
    result.items = data.items.map(it => ({
      medication_name: it.medicine,
      medicine: it.medicine,
      dosage: it.dosage,
      frequency: it.frequency,
      duration: it.duration || null,
      instructions: it.instructions || null,
    }));
    // Also populate flat columns (from items[0]) for pharmacist dispense workflow
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
  weight: number | null;
  height: number | null;
  bmi: number | null;
  triage_level: string | null;
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
    weight: v.weight || 0,
    height: v.height || 0,
    bmi: v.bmi ?? undefined,
    oxygenSaturation: v.oxygen_saturation || 0,
    respiratoryRate: v.respiratory_rate || 0,
    triageLevel: (v.triage_level as TriageLevel) ?? undefined,
    notes: v.notes ?? undefined,
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
  if (data.weight !== undefined) result.weight = data.weight;
  if (data.height !== undefined) result.height = data.height;
  if (data.triageLevel !== undefined) result.triage_level = data.triageLevel;
  if (data.notes !== undefined) result.notes = data.notes;
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
  try {
    if (s.working_days) {
      let parsed = JSON.parse(s.working_days);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (Array.isArray(parsed)) workingDays = parsed;
    }
  } catch { /* ignore */ }

  return {
    id: s.id,
    userId: s.user_id || undefined,
    staffNumber: s.staff_number,
    firstName: s.first_name,
    lastName: s.last_name,
    email: s.email || '',
    phone: s.phone || '',
    role: mapRole(s.role) as StaffRole,
    departmentId: s.department_id || undefined,
    departmentName: s.department_name || undefined,
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
  if (data.departmentId !== undefined) r.department_id = data.departmentId || null;
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
  return (role || 'doctor').toUpperCase();
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
  is_active: number;
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
    isActive: d.is_active !== 0,
  };
}

export function toBackendDepartment(data: Partial<Department>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (data.name !== undefined) r.name = data.name;
  if (data.description !== undefined) r.description = data.description;
  if (data.headDoctorId !== undefined) r.head_doctor_id = data.headDoctorId || null;
  if (data.floor !== undefined) r.floor = data.floor;
  if (data.totalBeds !== undefined) r.total_beds = data.totalBeds;
  if (data.availableBeds !== undefined) r.available_beds = data.availableBeds;
  if (data.color !== undefined) r.color = data.color;
  if (data.icon !== undefined) r.icon = data.icon;
  if (data.isActive !== undefined) r.is_active = data.isActive ? 1 : 0;
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

const ROOM_TYPE_MAP: Record<string, string> = { ward: 'general', private: 'private', icu: 'icu', emergency: 'emergency', operation: 'operation', consultation: 'consultation', lab: 'lab' };
const ROOM_STATUS_MAP: Record<string, string> = { available: 'available', occupied: 'full', maintenance: 'maintenance', reserved: 'reserved', cleaning: 'maintenance' };

export function mapBackendRoom(r: BackendRoom): Room {
  return {
    id: r.id,
    roomNumber: r.room_number,
    type: (ROOM_TYPE_MAP[r.type] || 'general') as Room['type'],
    floor: parseInt(r.floor || '0'),
    departmentId: r.department_id || '',
    departmentName: r.department_name || undefined,
    capacity: r.capacity,
    occupiedBeds: r.occupied_beds,
    status: (ROOM_STATUS_MAP[r.status] || 'available') as Room['status'],
  };
}

const ROOM_TYPE_TO_BACKEND: Record<string, string> = {
  general: 'ward', private: 'private', icu: 'icu',
  emergency: 'emergency', operation: 'operation', consultation: 'consultation', lab: 'lab',
};
const ROOM_STATUS_TO_BACKEND: Record<string, string> = {
  available: 'available', full: 'occupied',
  maintenance: 'maintenance', reserved: 'reserved',
};

export function toBackendRoom(data: Partial<Room>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (data.roomNumber !== undefined) r.room_number = data.roomNumber;
  if (data.type !== undefined) r.type = ROOM_TYPE_TO_BACKEND[data.type] ?? data.type;
  if (data.floor !== undefined) r.floor = String(data.floor);
  if (data.departmentId !== undefined) r.department_id = data.departmentId || null;
  if (data.capacity !== undefined) r.capacity = data.capacity;
  if (data.occupiedBeds !== undefined) r.occupied_beds = data.occupiedBeds;
  if (data.status !== undefined) r.status = ROOM_STATUS_TO_BACKEND[data.status] ?? data.status;
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
  try {
    const parsed = JSON.parse(l.tests);
    tests = Array.isArray(parsed)
      ? parsed.map((t: unknown) =>
          typeof t === 'string' ? t : (t as { name?: string; code?: string })?.name ?? JSON.stringify(t)
        )
      : [l.tests];
  } catch { tests = [l.tests]; }
  try {
    if (l.results) {
      const parsed = JSON.parse(l.results);
      if (Array.isArray(parsed)) {
        results = parsed.map((r: LabResult) => ({
          ...r,
          testName: typeof r.testName === 'string'
            ? r.testName
            : (r.testName as unknown as { name?: string })?.name ?? String(r.testName),
        }));
      }
    }
  } catch { /* ignore */ }

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
  if (data.appointmentId !== undefined) r.appointment_id = data.appointmentId || null;
  if (data.tests !== undefined) r.tests = JSON.stringify(data.tests);
  if (data.results !== undefined) r.results = JSON.stringify(data.results);
  if (data.status !== undefined) r.status = data.status;
  if (data.priority !== undefined) r.priority = data.priority;
  if (data.category !== undefined) r.category = data.category;
  if (data.notes !== undefined) r.notes = data.notes;
  if (data.completedAt !== undefined) r.completed_at = data.completedAt;
  if (data.processedBy !== undefined) r.processed_by = data.processedBy;
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
  if (data.appointmentId !== undefined) r.appointment_id = data.appointmentId || null;
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
  if (data.paidAt !== undefined) r.paid_at = data.paidAt;
  return r;
}

// ─── Inventory ────────────────────────────────────────────────

// Map frontend categories → backend categories (for writes & filter params)
export const INVENTORY_CATEGORY_TO_BACKEND: Record<string, string> = {
  medicine: 'medicine',
  equipment: 'equipment',
  consumable: 'supply',
  lab_supply: 'lab_reagent',
};
// Map backend categories → frontend categories (for reads)
export const INVENTORY_CATEGORY_FROM_BACKEND: Record<string, string> = {
  medicine: 'medicine',
  supply: 'consumable',
  equipment: 'equipment',
  lab_reagent: 'lab_supply',
  ppe: 'consumable',
};

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
    category: (INVENTORY_CATEGORY_FROM_BACKEND[i.category] || i.category) as InventoryItem['category'],
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
  if (data.category !== undefined) r.category = INVENTORY_CATEGORY_TO_BACKEND[data.category] ?? data.category;
  if (data.unit !== undefined) r.unit = data.unit;
  if (data.quantity !== undefined) r.quantity = data.quantity;
  if (data.minQuantity !== undefined) r.min_quantity = data.minQuantity;
  if (data.unitPrice !== undefined) r.unit_price = data.unitPrice;
  if (data.supplier !== undefined) r.supplier = data.supplier;
  if (data.expiryDate !== undefined) r.expiry_date = data.expiryDate;
  if (data.location !== undefined) r.location = data.location;
  if (data.lastRestocked !== undefined) r.last_restocked = data.lastRestocked;
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
  if (data.appointmentId !== undefined) r.appointment_id = data.appointmentId || null;
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
    patientName: q.patient_name || undefined,
    doctorName: q.doctor_name || undefined,
  };
}

export function toBackendQueueEntry(data: Partial<QueueEntry>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (data.patientId !== undefined) result.patient_id = data.patientId;
  if (data.doctorId !== undefined) result.doctor_id = data.doctorId || null;
  if (data.appointmentId !== undefined) result.appointment_id = data.appointmentId || null;
  if (data.status !== undefined) result.status = data.status;
  if (data.priority !== undefined) result.priority = data.priority;
  if (data.estimatedWait !== undefined) result.estimated_wait = data.estimatedWait;
  if (data.tokenNumber !== undefined) result.token_number = data.tokenNumber;
  if (data.calledAt !== undefined) result.called_at = data.calledAt;
  if (data.completedAt !== undefined) result.completed_at = data.completedAt;
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
  if (data.completedAt !== undefined) r.completed_at = data.completedAt;
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

// ─── Admissions ───────────────────────────────────────────────

export interface BackendAdmission {
  id: string;
  patient_id: string;
  room_id: string;
  appointment_id: string | null;
  admitted_by: string;
  admission_reason: string | null;
  admitted_at: string;
  discharged_at: string | null;
  discharge_diagnosis: string | null;
  discharge_summary: string | null;
  follow_up_plan: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  // joined
  patient_name?: string;
  medical_record_number?: string;
  room_number?: string;
  room_type?: string;
  admitted_by_name?: string;
}

export function mapBackendAdmission(a: BackendAdmission): Admission {
  return {
    id: a.id,
    patientId: a.patient_id,
    roomId: a.room_id,
    appointmentId: a.appointment_id || undefined,
    admittedBy: a.admitted_by,
    admissionReason: a.admission_reason || undefined,
    admittedAt: a.admitted_at,
    dischargedAt: a.discharged_at || undefined,
    dischargeDiagnosis: a.discharge_diagnosis || undefined,
    dischargeSummary: a.discharge_summary || undefined,
    followUpPlan: a.follow_up_plan || undefined,
    status: a.status as AdmissionStatus,
    patientName: a.patient_name,
    medicalRecordNumber: a.medical_record_number,
    roomNumber: a.room_number,
    roomType: a.room_type,
    admittedByName: a.admitted_by_name,
  };
}

export function toBackendAdmission(data: Partial<Admission>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (data.patientId !== undefined) r.patient_id = data.patientId;
  if (data.roomId !== undefined) r.room_id = data.roomId;
  if (data.appointmentId !== undefined) r.appointment_id = data.appointmentId || null;
  if (data.admittedBy !== undefined) r.admitted_by = data.admittedBy;
  if (data.admissionReason !== undefined) r.admission_reason = data.admissionReason;
  if (data.status !== undefined) r.status = data.status;
  if (data.dischargeDiagnosis !== undefined) r.discharge_diagnosis = data.dischargeDiagnosis;
  if (data.dischargeSummary !== undefined) r.discharge_summary = data.dischargeSummary;
  if (data.followUpPlan !== undefined) r.follow_up_plan = data.followUpPlan;
  return r;
}
