import { api } from '../api';
import type { Patient } from '@/types';
import { mapBackendPatient, toBackendPatient, type BackendPatient } from '../mappers';

export interface PatientListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export async function listPatients(params?: PatientListParams): Promise<Patient[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();
  const data = await api.get<{ patients: BackendPatient[] }>(`/patients${qs ? `?${qs}` : ''}`);
  return (data.patients || []).map(mapBackendPatient);
}

export async function getPatient(id: string): Promise<Patient> {
  const data = await api.get<BackendPatient>(`/patients/${id}`);
  return mapBackendPatient(data);
}

export async function createPatient(data: Partial<Patient>): Promise<{ id: string; patientNumber: string }> {
  const result = await api.post<{ id: string; medical_record_number: string }>('/patients', toBackendPatient(data));
  return { id: result.id, patientNumber: result.medical_record_number };
}

export async function updatePatient(id: string, data: Partial<Patient>): Promise<void> {
  await api.put(`/patients/${id}`, toBackendPatient(data));
}

export async function deletePatient(id: string): Promise<void> {
  await api.delete(`/patients/${id}`);
}
