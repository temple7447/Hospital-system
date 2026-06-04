import { api } from '../api';
import type { NursingTask } from '@/types';
import { mapBackendNursingTask, toBackendNursingTask, type BackendNursingTask } from '../mappers';

export interface TaskListParams {
  nurse_id?: string;
  patient_id?: string;
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export async function listNursingTasks(params?: TaskListParams): Promise<NursingTask[]> {
  const sp = new URLSearchParams();
  if (params?.nurse_id) sp.set('nurse_id', params.nurse_id);
  if (params?.patient_id) sp.set('patient_id', params.patient_id);
  if (params?.status) sp.set('status', params.status);
  if (params?.date) sp.set('date', params.date);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  const data = await api.get<{ tasks: BackendNursingTask[] }>(`/nursing-tasks${qs ? `?${qs}` : ''}`);
  return (data.tasks || []).map(mapBackendNursingTask);
}

export async function getNursingTask(id: string): Promise<NursingTask> {
  const data = await api.get<BackendNursingTask>(`/nursing-tasks/${id}`);
  return mapBackendNursingTask(data);
}

export async function createNursingTask(data: Partial<NursingTask>): Promise<string> {
  const result = await api.post<{ id: string }>('/nursing-tasks', toBackendNursingTask(data));
  return result.id;
}

export async function updateNursingTask(id: string, data: Partial<NursingTask>): Promise<void> {
  await api.put(`/nursing-tasks/${id}`, toBackendNursingTask(data));
}

export async function deleteNursingTask(id: string): Promise<void> {
  await api.delete(`/nursing-tasks/${id}`);
}
