import { api } from '../api';
import type { LabOrder } from '@/types';
import { mapBackendLabOrder, toBackendLabOrder, type BackendLabOrder } from '../mappers';

export interface LabOrderListParams {
  patient_id?: string;
  doctor_id?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export async function listLabOrders(params?: LabOrderListParams): Promise<LabOrder[]> {
  const sp = new URLSearchParams();
  if (params?.patient_id) sp.set('patient_id', params.patient_id);
  if (params?.doctor_id) sp.set('doctor_id', params.doctor_id);
  if (params?.status) sp.set('status', params.status);
  if (params?.category) sp.set('category', params.category);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  const data = await api.get<{ lab_orders: BackendLabOrder[] }>(`/lab-orders${qs ? `?${qs}` : ''}`);
  return (data.lab_orders || []).map(mapBackendLabOrder);
}

export async function getLabOrder(id: string): Promise<LabOrder> {
  const data = await api.get<BackendLabOrder>(`/lab-orders/${id}`);
  return mapBackendLabOrder(data);
}

export async function createLabOrder(data: Partial<LabOrder>): Promise<string> {
  const result = await api.post<{ id: string }>('/lab-orders', toBackendLabOrder(data));
  return result.id;
}

export async function updateLabOrder(id: string, data: Partial<LabOrder>): Promise<void> {
  await api.put(`/lab-orders/${id}`, toBackendLabOrder(data));
}

export async function deleteLabOrder(id: string): Promise<void> {
  await api.delete(`/lab-orders/${id}`);
}
