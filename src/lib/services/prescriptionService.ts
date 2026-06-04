import { api } from '../api';
import type { Prescription } from '@/types';
import { mapBackendPrescription, toBackendPrescription, type BackendPrescription } from '../mappers';

export interface PrescriptionListParams {
  patient_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listPrescriptions(params?: PrescriptionListParams): Promise<Prescription[]> {
  const searchParams = new URLSearchParams();
  if (params?.patient_id) searchParams.set('patient_id', params.patient_id);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();
  const data = await api.get<{ prescriptions: BackendPrescription[] }>(`/prescriptions${qs ? `?${qs}` : ''}`);
  return (data.prescriptions || []).map(mapBackendPrescription);
}

export async function getPrescription(id: string): Promise<Prescription> {
  const data = await api.get<BackendPrescription>(`/prescriptions/${id}`);
  return mapBackendPrescription(data);
}

export async function createPrescription(data: Partial<Prescription>): Promise<string> {
  const result = await api.post<{ id: string }>('/prescriptions', toBackendPrescription(data));
  return result.id;
}

export async function updatePrescription(id: string, data: Partial<Prescription>): Promise<void> {
  await api.put(`/prescriptions/${id}`, toBackendPrescription(data));
}

export async function deletePrescription(id: string): Promise<void> {
  await api.delete(`/prescriptions/${id}`);
}
