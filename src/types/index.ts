// ─── Auth ────────────────────────────────────────────────────────────────────
export type Role = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'NURSE' | 'PHARMACIST' | 'LAB_TECHNICIAN' | 'RADIOLOGIST';

export interface AuthUser {
  id: string;         // matches staff.id or patient.id
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

// ─── Department ───────────────────────────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  description: string;
  headDoctorId?: string;
  floor: string;
  totalBeds: number;
  availableBeds: number;
  color: string;
  icon: string;
  isActive: boolean;
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export type StaffRole = string;
export type StaffStatus = 'active' | 'inactive' | 'on_leave';
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Staff {
  id: string;
  userId?: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  departmentId?: string;
  departmentName?: string;
  specialization?: string;
  licenseNumber?: string;
  dateJoined: string;
  status: StaffStatus;
  workingDays: WeekDay[];
  workingHours: { start: string; end: string };
  avatar?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  salary?: number;
}

// ─── Patient ──────────────────────────────────────────────────────────────────
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
export type PatientStatus = 'active' | 'inactive' | 'deceased';

export interface Patient {
  id: string;
  userId?: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodType: BloodType;
  address: string;
  city: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string[];
  chronicConditions: string[];
  insuranceProvider?: string;
  insuranceNumber?: string;
  status: PatientStatus;
  registeredAt: string;
  assignedDoctorId?: string;
}

// ─── Room ─────────────────────────────────────────────────────────────────────
export type RoomType = 'general' | 'private' | 'icu' | 'emergency' | 'operation' | 'consultation' | 'lab';
export type RoomStatus = 'available' | 'full' | 'maintenance' | 'reserved';

export interface Room {
  id: string;
  roomNumber: string;
  type: RoomType;
  floor: number;
  departmentId: string;
  departmentName?: string;
  capacity: number;
  occupiedBeds: number;
  status: RoomStatus;
}

// ─── Appointment ──────────────────────────────────────────────────────────────
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'check_up' | 'consultation' | 'follow_up' | 'emergency' | 'procedure';

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  departmentName?: string;
  date: string;
  time: string;
  duration: number;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  cancelledReason?: string;
}

// ─── Prescription ─────────────────────────────────────────────────────────────
export interface PrescriptionItem {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export type PrescriptionStatus = 'active' | 'completed' | 'cancelled' | 'dispensed';

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  items: PrescriptionItem[];
  diagnosis: string;
  notes?: string;
  status: PrescriptionStatus;
  createdAt: string;
  expiresAt: string;
  dispensedAt?: string;
  dispensedBy?: string;
}

// ─── Lab Order ────────────────────────────────────────────────────────────────
export type LabTestStatus = 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled';
export type ResultFlag = 'normal' | 'abnormal' | 'critical';

export interface LabResult {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: ResultFlag;
}

export interface LabOrder {
  id: string;
  labNumber: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  tests: string[];
  results?: LabResult[];
  status: LabTestStatus;
  priority: 'routine' | 'urgent' | 'stat';
  category?: 'lab' | 'radiology';
  notes?: string;
  orderedAt: string;
  completedAt?: string;
  processedBy?: string;
}

// ─── Invoice ──────────────────────────────────────────────────────────────────
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'card' | 'insurance' | 'bank_transfer';
export type InvoiceStatus = 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  appointmentId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  dueDate: string;
  paidAt?: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export type InventoryCategory = 'medicine' | 'equipment' | 'consumable' | 'lab_supply';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  supplier: string;
  expiryDate?: string;
  location: string;
  lastRestocked: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType = 'appointment' | 'lab_result' | 'prescription' | 'billing' | 'system' | 'alert';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// ─── Admission ────────────────────────────────────────────────────────────────
export type AdmissionStatus = 'admitted' | 'discharged' | 'transferred';

export interface Admission {
  id: string;
  patientId: string;
  roomId: string;
  appointmentId?: string;
  admittedBy: string;
  admissionReason?: string;
  admittedAt: string;
  dischargedAt?: string;
  dischargeDiagnosis?: string;
  dischargeSummary?: string;
  followUpPlan?: string;
  status: AdmissionStatus;
  // joined fields
  patientName?: string;
  medicalRecordNumber?: string;
  roomNumber?: string;
  roomType?: string;
  admittedByName?: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  timestamp: string;
}

// ─── Queue ────────────────────────────────────────────────────────────────────
export type QueueStatus = 'waiting' | 'called' | 'in_progress' | 'completed' | 'no_show';

export interface QueueEntry {
  id: string;
  tokenNumber: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  status: QueueStatus;
  priority: 'normal' | 'urgent' | 'emergency';
  estimatedWait: number;
  checkedInAt: string;
  calledAt?: string;
  completedAt?: string;
  patientName?: string;
  doctorName?: string;
}

// ─── Consultation Note ────────────────────────────────────────────────────────
export interface ConsultationNote {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Vitals ───────────────────────────────────────────────────────────────────
export type TriageLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface VitalRecord {
  id: string;
  patientId: string;
  recordedBy: string;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  temperature: number;
  weight: number;
  height: number;
  bmi?: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  triageLevel?: TriageLevel;
  notes?: string;
  recordedAt: string;
}

// ─── Nursing Task ─────────────────────────────────────────────────────────────
export type NursingTaskType = 'medication' | 'vitals' | 'wound_care' | 'assessment' | 'other';
export type NursingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface NursingTask {
  id: string;
  patientId: string;
  nurseId: string;
  type: NursingTaskType;
  description: string;
  scheduledAt: string;
  completedAt?: string;
  status: NursingTaskStatus;
  notes?: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface AdminStats {
  totalPatients: number;
  totalStaff: number;
  todayAppointments: number;
  availableBeds: number;
  totalBeds: number;
  pendingInvoices: number;
  monthlyRevenue: number;
  lowStockItems: number;
}

export interface DoctorStats {
  todayAppointments: number;
  totalPatients: number;
  pendingLabOrders: number;
  completedToday: number;
}

export interface ReceptionistStats {
  waitingQueue: number;
  todayRegistrations: number;
  todayAppointments: number;
  pendingPayments: number;
}

export interface PatientStats {
  upcomingAppointments: number;
  activePrescriptions: number;
  pendingBills: number;
  totalVisits: number;
}

export interface NurseStats {
  myPatients: number;
  tasksToday: number;
  tasksCompleted: number;
  vitalsRecordedToday: number;
}

export interface PharmacistStats {
  pendingPrescriptions: number;
  dispensedToday: number;
  lowStockMedicines: number;
  totalActive: number;
}

export interface LabTechStatsType {
  pendingOrders: number;
  inProgress: number;
  completedToday: number;
  urgentOrders: number;
}

export interface RadiologistStats {
  pendingImaging: number;
  inProgress: number;
  completedToday: number;
  urgentImaging: number;
}
