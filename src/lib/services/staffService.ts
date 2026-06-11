import { api } from '../api';
import type { Staff } from '@/types';
import { mapBackendStaff, toBackendStaff, type BackendStaff } from '../mappers';

export interface StaffListParams {
  role?: string;
  department_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listStaff(params?: StaffListParams): Promise<Staff[]> {
  const sp = new URLSearchParams();
  if (params?.role) sp.set('role', params.role.toLowerCase());
  if (params?.department_id) sp.set('department_id', params.department_id);
  if (params?.status) sp.set('status', params.status);
  if (params?.search) sp.set('search', params.search);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  const data = await api.get<{ staff: BackendStaff[] }>(`/staff${qs ? `?${qs}` : ''}`);
  return (data.staff || []).map(mapBackendStaff);
}

export async function getStaff(id: string): Promise<Staff> {
  const data = await api.get<BackendStaff>(`/staff/${id}`);
  return mapBackendStaff(data);
}

export async function createStaff(data: Partial<Staff>): Promise<string> {
  const result = await api.post<{ id: string }>('/staff', toBackendStaff(data));
  return result.id;
}

export async function updateStaff(id: string, data: Partial<Staff>): Promise<void> {
  await api.put(`/staff/${id}`, toBackendStaff(data));
}

export async function deleteStaff(id: string): Promise<void> {
  await api.delete(`/staff/${id}`);
}

export interface OnboardStaffPayload {
  username: string;
  password: string;
  role: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department_id?: string;
  specialization?: string;
  license_number?: string;
  working_days?: string[];
  working_hours_start?: string;
  working_hours_end?: string;
  date_joined?: string;
  status?: string;
}

export interface OnboardStaffResult {
  user_id: string;
  staff_id: string;
  staff_number: string;
  username: string;
  role: string;
  full_name: string;
}

export async function onboardStaff(data: OnboardStaffPayload): Promise<OnboardStaffResult> {
  return api.post<OnboardStaffResult>('/admin/onboard-staff', data);
}

export async function resetStaffPassword(staffId: string, newPassword: string): Promise<void> {
  await api.put(`/admin/staff/${staffId}/reset-password`, { new_password: newPassword });
}
