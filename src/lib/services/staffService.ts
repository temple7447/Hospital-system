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
  if (params?.role) sp.set('role', params.role);
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
