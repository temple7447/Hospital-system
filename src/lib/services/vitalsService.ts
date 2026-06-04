import { api } from '../api';
import type { VitalRecord } from '@/types';
import { mapBackendVital, toBackendVital, type BackendVital } from '../mappers';

export interface VitalListParams {
  patient_id?: string;
  page?: number;
  limit?: number;
}

export async function listVitals(params?: VitalListParams): Promise<VitalRecord[]> {
  const searchParams = new URLSearchParams();
  if (params?.patient_id) searchParams.set('patient_id', params.patient_id);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();
  const data = await api.get<{ vitals: BackendVital[] }>(`/vitals${qs ? `?${qs}` : ''}`);
  return (data.vitals || []).map(mapBackendVital);
}

export async function getVital(id: string): Promise<VitalRecord> {
  const data = await api.get<BackendVital>(`/vitals/${id}`);
  return mapBackendVital(data);
}

export async function createVital(data: Partial<VitalRecord>): Promise<string> {
  const result = await api.post<{ id: string }>('/vitals', toBackendVital(data));
  return result.id;
}

export async function updateVital(id: string, data: Partial<VitalRecord>): Promise<void> {
  await api.put(`/vitals/${id}`, toBackendVital(data));
}

export async function deleteVital(id: string): Promise<void> {
  await api.delete(`/vitals/${id}`);
}
