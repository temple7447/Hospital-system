import { KEYS, getAll, setAll, getById, insert, update, remove, query } from './storage';
import type {
  Patient, Staff, Department, Room, Appointment, Prescription,
  LabOrder, LabResult, Invoice, InventoryItem, Notification,
  AuditLog, QueueEntry, ConsultationNote, VitalRecord, NursingTask,
  AppointmentStatus, InvoiceStatus, PaymentMethod,
  AdminStats, DoctorStats, ReceptionistStats, PatientStats,
  NurseStats, PharmacistStats, LabTechStatsType, RadiologistStats,
} from '@/types';

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

const IMAGING_KEYWORDS = ['mri', 'x-ray', 'xray', 'ct ', 'ct scan', 'ultrasound', 'echo', 'scan', 'mammogram', 'fluoroscopy'];
export const isImagingOrder = (order: LabOrder): boolean => {
  if (order.category === 'radiology') return true;
  if (order.category === 'lab') return false;
  return order.tests.some(t => IMAGING_KEYWORDS.some(k => t.toLowerCase().includes(k)));
};

// ─── Patients ──────────────────────────────────────────────────────────────────
export const db = {

  patients: {
    getAll: () => getAll<Patient>(KEYS.PATIENTS),
    getById: (id: string) => getById<Patient>(KEYS.PATIENTS, id),
    getByDoctor: (doctorId: string) => query<Patient>(KEYS.PATIENTS, p => p.assignedDoctorId === doctorId),
    search: (term: string) => {
      const t = term.toLowerCase();
      return query<Patient>(KEYS.PATIENTS, p =>
        p.firstName.toLowerCase().includes(t) ||
        p.lastName.toLowerCase().includes(t) ||
        p.patientNumber.toLowerCase().includes(t) ||
        p.email.toLowerCase().includes(t) ||
        p.phone.includes(t)
      );
    },
    create: (data: Omit<Patient, 'id' | 'patientNumber' | 'registeredAt' | 'status'>) => {
      const all = getAll<Patient>(KEYS.PATIENTS);
      const num = String(all.length + 1).padStart(4, '0');
      return insert<Patient>(KEYS.PATIENTS, {
        ...data,
        patientNumber: `PT-${num}`,
        registeredAt: now(),
        status: 'active',
      });
    },
    update: (id: string, data: Partial<Patient>) => update<Patient>(KEYS.PATIENTS, id, data),
    delete: (id: string) => remove(KEYS.PATIENTS, id),
    getFullName: (patient: Patient) => `${patient.firstName} ${patient.lastName}`,
  },

  // ─── Staff ───────────────────────────────────────────────────────────────────
  staff: {
    getAll: () => getAll<Staff>(KEYS.STAFF),
    getById: (id: string) => getById<Staff>(KEYS.STAFF, id),
    getByRole: (role: Staff['role']) => query<Staff>(KEYS.STAFF, s => s.role === role),
    getDoctors: () => query<Staff>(KEYS.STAFF, s => s.role === 'DOCTOR'),
    getActiveStaff: () => query<Staff>(KEYS.STAFF, s => s.status === 'active'),
    getByEmail: (email: string) => query<Staff>(KEYS.STAFF, s => s.email === email)[0] ?? null,
    getByDepartment: (deptId: string) => query<Staff>(KEYS.STAFF, s => s.departmentId === deptId),
    create: (data: Omit<Staff, 'id' | 'staffNumber'>) => {
      const all = getAll<Staff>(KEYS.STAFF);
      const prefixMap: Record<Staff['role'], string> = {
        DOCTOR: 'DR', NURSE: 'NR', RECEPTIONIST: 'RC', ADMIN: 'AD',
        PHARMACIST: 'PH', LAB_TECHNICIAN: 'LT', RADIOLOGIST: 'RD',
      };
      const prefix = prefixMap[data.role] ?? 'ST';
      const count = all.filter(s => s.role === data.role).length + 1;
      return insert<Staff>(KEYS.STAFF, { ...data, staffNumber: `${prefix}-${String(count).padStart(3, '0')}` });
    },
    update: (id: string, data: Partial<Staff>) => update<Staff>(KEYS.STAFF, id, data),
    getFullName: (staff: Staff) => `${staff.firstName} ${staff.lastName}`,
    getDisplayName: (staff: Staff) => staff.role === 'DOCTOR' ? `Dr. ${staff.firstName} ${staff.lastName}` : `${staff.firstName} ${staff.lastName}`,
  },

  // ─── Departments ─────────────────────────────────────────────────────────────
  departments: {
    getAll: () => getAll<Department>(KEYS.DEPARTMENTS),
    getById: (id: string) => getById<Department>(KEYS.DEPARTMENTS, id),
    update: (id: string, data: Partial<Department>) => update<Department>(KEYS.DEPARTMENTS, id, data),
    create: (data: Omit<Department, 'id'>) => insert<Department>(KEYS.DEPARTMENTS, data),
  },

  // ─── Rooms ───────────────────────────────────────────────────────────────────
  rooms: {
    getAll: () => getAll<Room>(KEYS.ROOMS),
    getById: (id: string) => getById<Room>(KEYS.ROOMS, id),
    getByDepartment: (deptId: string) => query<Room>(KEYS.ROOMS, r => r.departmentId === deptId),
    getAvailable: () => query<Room>(KEYS.ROOMS, r => r.status === 'available'),
    update: (id: string, data: Partial<Room>) => update<Room>(KEYS.ROOMS, id, data),
    create: (data: Omit<Room, 'id'>) => insert<Room>(KEYS.ROOMS, data),
    getTotalBeds: () => getAll<Room>(KEYS.ROOMS).reduce((s, r) => s + r.capacity, 0),
    getOccupiedBeds: () => getAll<Room>(KEYS.ROOMS).reduce((s, r) => s + r.occupiedBeds, 0),
  },

  // ─── Appointments ─────────────────────────────────────────────────────────────
  appointments: {
    getAll: () => getAll<Appointment>(KEYS.APPOINTMENTS),
    getById: (id: string) => getById<Appointment>(KEYS.APPOINTMENTS, id),
    getByPatient: (patientId: string) => query<Appointment>(KEYS.APPOINTMENTS, a => a.patientId === patientId),
    getByDoctor: (doctorId: string) => query<Appointment>(KEYS.APPOINTMENTS, a => a.doctorId === doctorId),
    getByDate: (date: string) => query<Appointment>(KEYS.APPOINTMENTS, a => a.date === date),
    getByStatus: (status: AppointmentStatus) => query<Appointment>(KEYS.APPOINTMENTS, a => a.status === status),
    getToday: () => query<Appointment>(KEYS.APPOINTMENTS, a => a.date === today()),
    getTodayByDoctor: (doctorId: string) => query<Appointment>(KEYS.APPOINTMENTS, a => a.date === today() && a.doctorId === doctorId),
    getUpcoming: () => query<Appointment>(KEYS.APPOINTMENTS, a => a.date >= today() && (a.status === 'scheduled' || a.status === 'confirmed')),
    getUpcomingByPatient: (patientId: string) => query<Appointment>(KEYS.APPOINTMENTS, a => a.patientId === patientId && a.date >= today() && (a.status === 'scheduled' || a.status === 'confirmed')),
    create: (data: Omit<Appointment, 'id' | 'appointmentNumber' | 'createdAt' | 'updatedAt'>) => {
      const all = getAll<Appointment>(KEYS.APPOINTMENTS);
      const num = String(all.length + 1).padStart(4, '0');
      return insert<Appointment>(KEYS.APPOINTMENTS, {
        ...data,
        appointmentNumber: `APT-${num}`,
        createdAt: now(),
        updatedAt: now(),
      });
    },
    update: (id: string, data: Partial<Appointment>) =>
      update<Appointment>(KEYS.APPOINTMENTS, id, { ...data, updatedAt: now() }),
    cancel: (id: string, reason: string) =>
      update<Appointment>(KEYS.APPOINTMENTS, id, { status: 'cancelled', cancelledReason: reason, updatedAt: now() }),
    complete: (id: string, notes?: string) =>
      update<Appointment>(KEYS.APPOINTMENTS, id, { status: 'completed', notes, updatedAt: now() }),
  },

  // ─── Prescriptions ────────────────────────────────────────────────────────────
  prescriptions: {
    getAll: () => getAll<Prescription>(KEYS.PRESCRIPTIONS),
    getById: (id: string) => getById<Prescription>(KEYS.PRESCRIPTIONS, id),
    getByPatient: (patientId: string) => query<Prescription>(KEYS.PRESCRIPTIONS, p => p.patientId === patientId),
    getByDoctor: (doctorId: string) => query<Prescription>(KEYS.PRESCRIPTIONS, p => p.doctorId === doctorId),
    getActive: () => query<Prescription>(KEYS.PRESCRIPTIONS, p => p.status === 'active'),
    getActiveByPatient: (patientId: string) => query<Prescription>(KEYS.PRESCRIPTIONS, p => p.patientId === patientId && p.status === 'active'),
    create: (data: Omit<Prescription, 'id' | 'prescriptionNumber' | 'createdAt'>) => {
      const all = getAll<Prescription>(KEYS.PRESCRIPTIONS);
      const num = String(all.length + 1).padStart(4, '0');
      return insert<Prescription>(KEYS.PRESCRIPTIONS, { ...data, prescriptionNumber: `RX-${num}`, createdAt: now() });
    },
    update: (id: string, data: Partial<Prescription>) => update<Prescription>(KEYS.PRESCRIPTIONS, id, data),
    dispense: (id: string, pharmacistId: string) =>
      update<Prescription>(KEYS.PRESCRIPTIONS, id, { status: 'dispensed', dispensedAt: now(), dispensedBy: pharmacistId }),
    getPendingDispense: () => query<Prescription>(KEYS.PRESCRIPTIONS, p => p.status === 'active' && !p.dispensedAt),
    getDispensedToday: () => query<Prescription>(KEYS.PRESCRIPTIONS, p => !!p.dispensedAt && p.dispensedAt.startsWith(today())),
  },

  // ─── Lab Orders ───────────────────────────────────────────────────────────────
  labOrders: {
    getAll: () => getAll<LabOrder>(KEYS.LAB_ORDERS),
    getById: (id: string) => getById<LabOrder>(KEYS.LAB_ORDERS, id),
    getByPatient: (patientId: string) => query<LabOrder>(KEYS.LAB_ORDERS, l => l.patientId === patientId),
    getByDoctor: (doctorId: string) => query<LabOrder>(KEYS.LAB_ORDERS, l => l.doctorId === doctorId),
    getPending: () => query<LabOrder>(KEYS.LAB_ORDERS, l => l.status !== 'completed' && l.status !== 'cancelled'),
    getPendingByDoctor: (doctorId: string) => query<LabOrder>(KEYS.LAB_ORDERS, l => l.doctorId === doctorId && l.status !== 'completed' && l.status !== 'cancelled'),
    create: (data: Omit<LabOrder, 'id' | 'labNumber' | 'orderedAt'>) => {
      const all = getAll<LabOrder>(KEYS.LAB_ORDERS);
      const num = String(all.length + 1).padStart(4, '0');
      return insert<LabOrder>(KEYS.LAB_ORDERS, { ...data, labNumber: `LAB-${num}`, orderedAt: now() });
    },
    update: (id: string, data: Partial<LabOrder>) => update<LabOrder>(KEYS.LAB_ORDERS, id, data),
    complete: (id: string, results: LabResult[]) =>
      update<LabOrder>(KEYS.LAB_ORDERS, id, { status: 'completed', results, completedAt: now() }),
  },

  // ─── Invoices ─────────────────────────────────────────────────────────────────
  invoices: {
    getAll: () => getAll<Invoice>(KEYS.INVOICES),
    getById: (id: string) => getById<Invoice>(KEYS.INVOICES, id),
    getByPatient: (patientId: string) => query<Invoice>(KEYS.INVOICES, i => i.patientId === patientId),
    getByStatus: (status: InvoiceStatus) => query<Invoice>(KEYS.INVOICES, i => i.status === status),
    getPending: () => query<Invoice>(KEYS.INVOICES, i => i.status === 'pending' || i.status === 'partially_paid' || i.status === 'overdue'),
    create: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
      const all = getAll<Invoice>(KEYS.INVOICES);
      const num = String(all.length + 1).padStart(4, '0');
      return insert<Invoice>(KEYS.INVOICES, { ...data, invoiceNumber: `INV-${num}`, createdAt: now() });
    },
    update: (id: string, data: Partial<Invoice>) => update<Invoice>(KEYS.INVOICES, id, data),
    markPaid: (id: string, method: PaymentMethod) =>
      update<Invoice>(KEYS.INVOICES, id, { status: 'paid', amountPaid: getById<Invoice>(KEYS.INVOICES, id)?.total ?? 0, paymentMethod: method, paidAt: now() }),
    getTotalRevenue: () => getAll<Invoice>(KEYS.INVOICES).filter(i => i.status === 'paid').reduce((s, i) => s + i.amountPaid, 0),
    getMonthlyRevenue: (year: number, month: number) => {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      return getAll<Invoice>(KEYS.INVOICES)
        .filter(i => i.status === 'paid' && i.paidAt?.startsWith(prefix))
        .reduce((s, i) => s + i.amountPaid, 0);
    },
  },

  // ─── Inventory ────────────────────────────────────────────────────────────────
  inventory: {
    getAll: () => getAll<InventoryItem>(KEYS.INVENTORY),
    getById: (id: string) => getById<InventoryItem>(KEYS.INVENTORY, id),
    getLowStock: () => query<InventoryItem>(KEYS.INVENTORY, i => i.quantity <= i.minQuantity),
    getByCategory: (cat: InventoryItem['category']) => query<InventoryItem>(KEYS.INVENTORY, i => i.category === cat),
    create: (data: Omit<InventoryItem, 'id'>) => insert<InventoryItem>(KEYS.INVENTORY, data),
    update: (id: string, data: Partial<InventoryItem>) => update<InventoryItem>(KEYS.INVENTORY, id, data),
    restock: (id: string, quantity: number) => {
      const item = getById<InventoryItem>(KEYS.INVENTORY, id);
      if (!item) return null;
      return update<InventoryItem>(KEYS.INVENTORY, id, { quantity: item.quantity + quantity, lastRestocked: today() });
    },
    delete: (id: string) => remove(KEYS.INVENTORY, id),
  },

  // ─── Notifications ────────────────────────────────────────────────────────────
  notifications: {
    getByUser: (userId: string) => query<Notification>(KEYS.NOTIFICATIONS, n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getUnreadByUser: (userId: string) => query<Notification>(KEYS.NOTIFICATIONS, n => n.userId === userId && !n.read),
    countUnread: (userId: string) => query<Notification>(KEYS.NOTIFICATIONS, n => n.userId === userId && !n.read).length,
    markRead: (id: string) => update<Notification>(KEYS.NOTIFICATIONS, id, { read: true }),
    markAllRead: (userId: string) => {
      const all = getAll<Notification>(KEYS.NOTIFICATIONS);
      setAll(KEYS.NOTIFICATIONS, all.map(n => n.userId === userId ? { ...n, read: true } : n));
    },
    create: (data: Omit<Notification, 'id' | 'createdAt' | 'read'>) =>
      insert<Notification>(KEYS.NOTIFICATIONS, { ...data, read: false, createdAt: now() }),
    delete: (id: string) => remove(KEYS.NOTIFICATIONS, id),
  },

  // ─── Audit Logs ───────────────────────────────────────────────────────────────
  auditLogs: {
    getAll: () => getAll<AuditLog>(KEYS.AUDIT_LOGS).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    getByUser: (userId: string) => query<AuditLog>(KEYS.AUDIT_LOGS, l => l.userId === userId),
    create: (data: Omit<AuditLog, 'id' | 'timestamp'>) =>
      insert<AuditLog>(KEYS.AUDIT_LOGS, { ...data, timestamp: now() }),
  },

  // ─── Queue ────────────────────────────────────────────────────────────────────
  queue: {
    getAll: () => getAll<QueueEntry>(KEYS.QUEUE),
    getActive: () => query<QueueEntry>(KEYS.QUEUE, q => q.status === 'waiting' || q.status === 'called' || q.status === 'in_progress'),
    getByDoctor: (doctorId: string) => query<QueueEntry>(KEYS.QUEUE, q => q.doctorId === doctorId && q.status !== 'completed' && q.status !== 'no_show'),
    add: (data: Omit<QueueEntry, 'id' | 'tokenNumber' | 'checkedInAt'>) => {
      const all = getAll<QueueEntry>(KEYS.QUEUE);
      const todayEntries = all.filter(q => q.checkedInAt.startsWith(today()));
      const num = String(todayEntries.length + 1).padStart(3, '0');
      return insert<QueueEntry>(KEYS.QUEUE, { ...data, tokenNumber: `Q-${num}`, checkedInAt: now() });
    },
    update: (id: string, data: Partial<QueueEntry>) => update<QueueEntry>(KEYS.QUEUE, id, data),
    call: (id: string) => update<QueueEntry>(KEYS.QUEUE, id, { status: 'called', calledAt: now() }),
    complete: (id: string) => update<QueueEntry>(KEYS.QUEUE, id, { status: 'completed', completedAt: now() }),
    remove: (id: string) => remove(KEYS.QUEUE, id),
  },

  // ─── Consultation Notes ───────────────────────────────────────────────────────
  consultationNotes: {
    getByAppointment: (appointmentId: string) => query<ConsultationNote>(KEYS.CONSULTATION_NOTES, n => n.appointmentId === appointmentId)[0] ?? null,
    getByPatient: (patientId: string) => query<ConsultationNote>(KEYS.CONSULTATION_NOTES, n => n.patientId === patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getByDoctor: (doctorId: string) => query<ConsultationNote>(KEYS.CONSULTATION_NOTES, n => n.doctorId === doctorId),
    create: (data: Omit<ConsultationNote, 'id' | 'createdAt' | 'updatedAt'>) =>
      insert<ConsultationNote>(KEYS.CONSULTATION_NOTES, { ...data, createdAt: now(), updatedAt: now() }),
    update: (id: string, data: Partial<ConsultationNote>) =>
      update<ConsultationNote>(KEYS.CONSULTATION_NOTES, id, { ...data, updatedAt: now() }),
  },

  // ─── Vitals ───────────────────────────────────────────────────────────────────
  vitals: {
    getByPatient: (patientId: string) => query<VitalRecord>(KEYS.VITALS, v => v.patientId === patientId).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    getLatest: (patientId: string) => query<VitalRecord>(KEYS.VITALS, v => v.patientId === patientId).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? null,
    add: (data: Omit<VitalRecord, 'id'>) => insert<VitalRecord>(KEYS.VITALS, data),
    countByRecorderToday: (recorderId: string) => query<VitalRecord>(KEYS.VITALS, v => v.recordedBy === recorderId && v.recordedAt.startsWith(today())).length,
  },

  // ─── Nursing Tasks ────────────────────────────────────────────────────────────
  nursingTasks: {
    getAll: () => getAll<NursingTask>(KEYS.NURSING_TASKS),
    getByNurse: (nurseId: string) => query<NursingTask>(KEYS.NURSING_TASKS, t => t.nurseId === nurseId).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    getByPatient: (patientId: string) => query<NursingTask>(KEYS.NURSING_TASKS, t => t.patientId === patientId).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
    getTodayByNurse: (nurseId: string) => query<NursingTask>(KEYS.NURSING_TASKS, t => t.nurseId === nurseId && t.scheduledAt.startsWith(today())),
    getPendingByNurse: (nurseId: string) => query<NursingTask>(KEYS.NURSING_TASKS, t => t.nurseId === nurseId && (t.status === 'pending' || t.status === 'in_progress')),
    create: (data: Omit<NursingTask, 'id'>) => insert<NursingTask>(KEYS.NURSING_TASKS, data),
    update: (id: string, data: Partial<NursingTask>) => update<NursingTask>(KEYS.NURSING_TASKS, id, data),
    complete: (id: string, notes?: string) =>
      update<NursingTask>(KEYS.NURSING_TASKS, id, { status: 'completed', completedAt: now(), notes }),
  },

  // ─── Dashboard Stats ──────────────────────────────────────────────────────────
  stats: {
    admin: (): AdminStats => {
      const d = new Date();
      return {
        totalPatients:    getAll<Patient>(KEYS.PATIENTS).filter(p => p.status === 'active').length,
        totalStaff:       getAll<Staff>(KEYS.STAFF).filter(s => s.status === 'active').length,
        todayAppointments: query<Appointment>(KEYS.APPOINTMENTS, a => a.date === today()).length,
        availableBeds:    getAll<Room>(KEYS.ROOMS).reduce((s, r) => s + (r.capacity - r.occupiedBeds), 0),
        totalBeds:        getAll<Room>(KEYS.ROOMS).reduce((s, r) => s + r.capacity, 0),
        pendingInvoices:  query<Invoice>(KEYS.INVOICES, i => i.status === 'pending' || i.status === 'overdue').length,
        monthlyRevenue:   getAll<Invoice>(KEYS.INVOICES).filter(i => i.status === 'paid' && i.paidAt?.startsWith(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)).reduce((s, i) => s + i.amountPaid, 0),
        lowStockItems:    query<InventoryItem>(KEYS.INVENTORY, i => i.quantity <= i.minQuantity).length,
      };
    },
    doctor: (doctorId: string): DoctorStats => ({
      todayAppointments: query<Appointment>(KEYS.APPOINTMENTS, a => a.doctorId === doctorId && a.date === today()).length,
      totalPatients:     query<Patient>(KEYS.PATIENTS, p => p.assignedDoctorId === doctorId).length,
      pendingLabOrders:  query<LabOrder>(KEYS.LAB_ORDERS, l => l.doctorId === doctorId && l.status !== 'completed' && l.status !== 'cancelled').length,
      completedToday:    query<Appointment>(KEYS.APPOINTMENTS, a => a.doctorId === doctorId && a.date === today() && a.status === 'completed').length,
    }),
    receptionist: (): ReceptionistStats => ({
      waitingQueue:        query<QueueEntry>(KEYS.QUEUE, q => q.status === 'waiting').length,
      todayRegistrations:  query<Patient>(KEYS.PATIENTS, p => p.registeredAt.startsWith(today())).length,
      todayAppointments:   query<Appointment>(KEYS.APPOINTMENTS, a => a.date === today()).length,
      pendingPayments:     query<Invoice>(KEYS.INVOICES, i => i.status === 'pending' || i.status === 'overdue').length,
    }),
    patient: (patientId: string): PatientStats => ({
      upcomingAppointments: query<Appointment>(KEYS.APPOINTMENTS, a => a.patientId === patientId && a.date >= today() && (a.status === 'scheduled' || a.status === 'confirmed')).length,
      activePrescriptions:  query<Prescription>(KEYS.PRESCRIPTIONS, p => p.patientId === patientId && p.status === 'active').length,
      pendingBills:         query<Invoice>(KEYS.INVOICES, i => i.patientId === patientId && (i.status === 'pending' || i.status === 'overdue')).length,
      totalVisits:          query<Appointment>(KEYS.APPOINTMENTS, a => a.patientId === patientId && a.status === 'completed').length,
    }),
    nurse: (nurseId: string): NurseStats => {
      const nurse = getById<Staff>(KEYS.STAFF, nurseId);
      const deptPatients = nurse?.departmentId
        ? query<Patient>(KEYS.PATIENTS, p => {
            const apt = query<Appointment>(KEYS.APPOINTMENTS, a => a.patientId === p.id && a.departmentId === nurse.departmentId);
            return apt.length > 0;
          }).length
        : 0;
      return {
        myPatients:           deptPatients,
        tasksToday:           query<NursingTask>(KEYS.NURSING_TASKS, t => t.nurseId === nurseId && t.scheduledAt.startsWith(today())).length,
        tasksCompleted:       query<NursingTask>(KEYS.NURSING_TASKS, t => t.nurseId === nurseId && t.status === 'completed' && (t.completedAt?.startsWith(today()) ?? false)).length,
        vitalsRecordedToday:  query<VitalRecord>(KEYS.VITALS, v => v.recordedBy === nurseId && v.recordedAt.startsWith(today())).length,
      };
    },
    pharmacist: (): PharmacistStats => ({
      pendingPrescriptions:  query<Prescription>(KEYS.PRESCRIPTIONS, p => p.status === 'active' && !p.dispensedAt).length,
      dispensedToday:        query<Prescription>(KEYS.PRESCRIPTIONS, p => !!p.dispensedAt && p.dispensedAt.startsWith(today())).length,
      lowStockMedicines:     query<InventoryItem>(KEYS.INVENTORY, i => i.category === 'medicine' && i.quantity <= i.minQuantity).length,
      totalActive:           query<Prescription>(KEYS.PRESCRIPTIONS, p => p.status === 'active').length,
    }),
    labTech: (): LabTechStatsType => {
      const all = getAll<LabOrder>(KEYS.LAB_ORDERS).filter(o => !isImagingOrder(o));
      return {
        pendingOrders:    all.filter(o => o.status === 'ordered' || o.status === 'collected').length,
        inProgress:       all.filter(o => o.status === 'processing').length,
        completedToday:   all.filter(o => o.status === 'completed' && (o.completedAt?.startsWith(today()) ?? false)).length,
        urgentOrders:     all.filter(o => (o.priority === 'urgent' || o.priority === 'stat') && o.status !== 'completed' && o.status !== 'cancelled').length,
      };
    },
    radiologist: (): RadiologistStats => {
      const all = getAll<LabOrder>(KEYS.LAB_ORDERS).filter(o => isImagingOrder(o));
      return {
        pendingImaging:   all.filter(o => o.status === 'ordered' || o.status === 'collected').length,
        inProgress:       all.filter(o => o.status === 'processing').length,
        completedToday:   all.filter(o => o.status === 'completed' && (o.completedAt?.startsWith(today()) ?? false)).length,
        urgentImaging:    all.filter(o => (o.priority === 'urgent' || o.priority === 'stat') && o.status !== 'completed' && o.status !== 'cancelled').length,
      };
    },
  },
};
