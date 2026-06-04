export const KEYS = {
  USER:               'hospital_user',
  PATIENTS:           'hospital_patients',
  STAFF:              'hospital_staff',
  DEPARTMENTS:        'hospital_departments',
  APPOINTMENTS:       'hospital_appointments',
  ROOMS:              'hospital_rooms',
  PRESCRIPTIONS:      'hospital_prescriptions',
  LAB_ORDERS:         'hospital_lab_orders',
  INVOICES:           'hospital_invoices',
  INVENTORY:          'hospital_inventory',
  NOTIFICATIONS:      'hospital_notifications',
  AUDIT_LOGS:         'hospital_audit_logs',
  QUEUE:              'hospital_queue',
  CONSULTATION_NOTES: 'hospital_consultation_notes',
  VITALS:             'hospital_vitals',
  NURSING_TASKS:      'hospital_nursing_tasks',
  SEEDED:             'hospital_seeded',
  SETTINGS:           'hospital_settings',
} as const;

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getAll<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[];
  } catch {
    return [];
  }
}

export function setAll<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getById<T extends { id: string }>(key: string, id: string): T | null {
  return getAll<T>(key).find(item => item.id === id) ?? null;
}

export function insert<T extends { id: string }>(key: string, item: Omit<T, 'id'>): T {
  const newItem = { ...item, id: generateId() } as T;
  setAll(key, [...getAll<T>(key), newItem]);
  return newItem;
}

export function update<T extends { id: string }>(key: string, id: string, changes: Partial<T>): T | null {
  const all = getAll<T>(key);
  const index = all.findIndex(item => item.id === id);
  if (index === -1) return null;
  all[index] = { ...all[index], ...changes };
  setAll(key, all);
  return all[index];
}

export function remove(key: string, id: string): void {
  setAll(key, getAll<{ id: string }>(key).filter(item => item.id !== id));
}

export function query<T>(key: string, predicate: (item: T) => boolean): T[] {
  return getAll<T>(key).filter(predicate);
}
