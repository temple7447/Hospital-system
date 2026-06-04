import { api } from '../api';
import type { Department } from '@/types';
import { mapBackendDepartment, toBackendDepartment, type BackendDepartment } from '../mappers';

export async function listDepartments(): Promise<Department[]> {
  const data = await api.get<{ departments: BackendDepartment[] }>('/departments');
  return (data.departments || []).map(mapBackendDepartment);
}

export async function getDepartment(id: string): Promise<Department> {
  const data = await api.get<BackendDepartment>(`/departments/${id}`);
  return mapBackendDepartment(data);
}

export async function createDepartment(data: Partial<Department>): Promise<string> {
  const result = await api.post<{ id: string }>('/departments', toBackendDepartment(data));
  return result.id;
}

export async function updateDepartment(id: string, data: Partial<Department>): Promise<void> {
  await api.put(`/departments/${id}`, toBackendDepartment(data));
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete(`/departments/${id}`);
}
