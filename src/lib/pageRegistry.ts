export interface PageDef {
  key: string;
  label: string;
  description: string;
  path: string;
  roles: string[];
  group: string;
}

export const PAGE_REGISTRY: PageDef[] = [
  // Shared
  { key: 'patients',              label: 'Patients List',       description: 'View and search patient records',        path: '/patients',                  roles: ['DOCTOR', 'RECEPTIONIST'],          group: 'Shared' },
  { key: 'appointments',          label: 'Appointments',        description: 'View and manage all appointments',       path: '/appointments',              roles: ['DOCTOR', 'RECEPTIONIST', 'NURSE'], group: 'Shared' },
  { key: 'reports',               label: 'Reports & Analytics', description: 'Hospital statistics and reports',        path: '/reports',                   roles: ['DOCTOR'],                          group: 'Shared' },
  // Doctor
  { key: 'doctor_schedule',       label: 'My Schedule',         description: 'Appointment schedule and calendar',      path: '/doctor/schedule',           roles: ['DOCTOR'],                          group: 'Doctor' },
  { key: 'doctor_patients',       label: 'My Patients',         description: 'List of assigned patients',              path: '/doctor/patients',           roles: ['DOCTOR'],                          group: 'Doctor' },
  { key: 'doctor_soap_notes',     label: 'SOAP Notes',          description: 'Write and review consultation notes',    path: '/doctor/consultation-notes', roles: ['DOCTOR'],                          group: 'Doctor' },
  { key: 'doctor_write_rx',       label: 'Write Prescription',  description: 'Create new prescriptions',               path: '/doctor/prescription/new',   roles: ['DOCTOR'],                          group: 'Doctor' },
  { key: 'doctor_lab_orders',     label: 'Lab Orders',          description: 'Order lab and radiology tests',          path: '/doctor/lab-orders',         roles: ['DOCTOR'],                          group: 'Doctor' },
  { key: 'doctor_availability',   label: 'Availability',        description: 'Set working days and hours',             path: '/doctor/availability',       roles: ['DOCTOR'],                          group: 'Doctor' },
  // Nurse
  { key: 'nurse_patients',        label: 'My Patients',         description: "Patients in nurse's department",         path: '/nurse/patients',            roles: ['NURSE'],                           group: 'Nurse' },
  { key: 'nurse_vitals',          label: 'Record Vitals',       description: 'Enter patient vital signs',              path: '/nurse/vitals',              roles: ['NURSE'],                           group: 'Nurse' },
  { key: 'nurse_tasks',           label: 'Nursing Tasks',       description: 'Manage and complete nursing tasks',      path: '/nurse/tasks',               roles: ['NURSE'],                           group: 'Nurse' },
  { key: 'nurse_handover',        label: 'Shift Handover',      description: 'Document patient handover for incoming shift', path: '/nurse/handover',       roles: ['NURSE'],                           group: 'Nurse' },
  { key: 'nurse_education',       label: 'Patient Education',   description: 'Record health education sessions given to patients', path: '/nurse/education', roles: ['NURSE'],                        group: 'Nurse' },
  // Receptionist
  { key: 'receptionist_register', label: 'Register Patient',    description: 'Register new patients into the system',  path: '/receptionist/register',     roles: ['RECEPTIONIST'],                    group: 'Receptionist' },
  { key: 'receptionist_checkin',  label: 'Patient Check-in',    description: 'Check in arriving patients',             path: '/receptionist/checkin',      roles: ['RECEPTIONIST'],                    group: 'Receptionist' },
  { key: 'receptionist_queue',    label: 'Arrival Queue',       description: 'Manage patient arrival queue',           path: '/receptionist/queue',        roles: ['RECEPTIONIST'],                    group: 'Receptionist' },
  { key: 'receptionist_billing',  label: 'Billing & Payments',  description: 'Process patient bills and payments',     path: '/receptionist/billing',      roles: ['RECEPTIONIST'],                    group: 'Receptionist' },
  // Pharmacist
  { key: 'pharmacist_queue',      label: 'Prescription Queue',  description: 'Pending prescriptions to dispense',      path: '/pharmacist/queue',          roles: ['PHARMACIST'],                      group: 'Pharmacist' },
  { key: 'pharmacist_inventory',  label: 'Drug Inventory',      description: 'View and manage drug stock levels',      path: '/pharmacist/inventory',      roles: ['PHARMACIST'],                      group: 'Pharmacist' },
  { key: 'pharmacist_history',    label: 'Dispense History',    description: 'History of dispensed prescriptions',     path: '/pharmacist/history',        roles: ['PHARMACIST'],                      group: 'Pharmacist' },
  // Lab Technician
  { key: 'lab_queue',             label: 'Order Queue',         description: 'Pending lab orders to process',          path: '/lab/queue',                 roles: ['LAB_TECHNICIAN'],                  group: 'Lab Technician' },
  { key: 'lab_results',           label: 'Enter Results',       description: 'Enter results for completed lab tests',  path: '/lab/results',               roles: ['LAB_TECHNICIAN'],                  group: 'Lab Technician' },
  { key: 'lab_completed',         label: 'Completed Orders',    description: 'History of completed lab orders',        path: '/lab/completed',             roles: ['LAB_TECHNICIAN'],                  group: 'Lab Technician' },
  // Radiologist
  { key: 'radiology_queue',       label: 'Imaging Queue',       description: 'Pending imaging orders',                 path: '/radiology/queue',           roles: ['RADIOLOGIST'],                     group: 'Radiologist' },
  { key: 'radiology_report',      label: 'Enter Report',        description: 'Write and submit radiology reports',     path: '/radiology/report',          roles: ['RADIOLOGIST'],                     group: 'Radiologist' },
  { key: 'radiology_history',     label: 'Report History',      description: 'Completed radiology reports',            path: '/radiology/history',         roles: ['RADIOLOGIST'],                     group: 'Radiologist' },
];

export type PagePermissions = Record<string, Record<string, boolean>>;

export function hasPagePermission(permissions: PagePermissions, role: string, pageKey: string): boolean {
  if (role === 'ADMIN') return true;
  const rolePerms = permissions[role];
  if (!rolePerms || !(pageKey in rolePerms)) return true;
  return rolePerms[pageKey] === true;
}
