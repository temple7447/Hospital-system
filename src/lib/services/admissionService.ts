import { api } from '../api';
import type { Admission } from '@/types';
import { mapBackendAdmission, toBackendAdmission, type BackendAdmission } from '../mappers';

export interface AdmissionListParams {
  patient_id?: string;
  room_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listAdmissions(params?: AdmissionListParams): Promise<Admission[]> {
  const searchParams = new URLSearchParams();
  if (params?.patient_id) searchParams.set('patient_id', params.patient_id);
  if (params?.room_id) searchParams.set('room_id', params.room_id);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();
  const data = await api.get<{ admissions: BackendAdmission[] }>(`/admissions${qs ? `?${qs}` : ''}`);
  return (data.admissions || []).map(mapBackendAdmission);
}

export async function getAdmission(id: string): Promise<Admission> {
  const data = await api.get<BackendAdmission>(`/admissions/${id}`);
  return mapBackendAdmission(data);
}

export async function createAdmission(data: Partial<Admission>): Promise<string> {
  const result = await api.post<{ id: string }>('/admissions', toBackendAdmission(data));
  return result.id;
}

export async function updateAdmission(id: string, data: Partial<Admission>): Promise<void> {
  await api.put(`/admissions/${id}`, toBackendAdmission(data));
}

export async function dischargePatient(
  id: string,
  discharge: {
    dischargeDiagnosis?: string;
    dischargeSummary?: string;
    followUpPlan?: string;
  }
): Promise<void> {
  await api.put(`/admissions/${id}`, toBackendAdmission({ ...discharge, status: 'discharged' }));
}

export async function deleteAdmission(id: string): Promise<void> {
  await api.delete(`/admissions/${id}`);
}
