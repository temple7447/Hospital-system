import { api } from '../api';
import type { Appointment } from '@/types';
import { mapBackendAppointment, toBackendAppointment, type BackendAppointment } from '../mappers';

export interface AppointmentListParams {
  date?: string;
  doctor_id?: string;
  patient_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listAppointments(params?: AppointmentListParams): Promise<Appointment[]> {
  const searchParams = new URLSearchParams();
  if (params?.date) searchParams.set('date', params.date);
  if (params?.doctor_id) searchParams.set('doctor_id', params.doctor_id);
  if (params?.patient_id) searchParams.set('patient_id', params.patient_id);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();
  const data = await api.get<{ appointments: BackendAppointment[] }>(`/appointments${qs ? `?${qs}` : ''}`);
  return (data.appointments || []).map(mapBackendAppointment);
}

export async function getAppointment(id: string): Promise<Appointment> {
  const data = await api.get<BackendAppointment>(`/appointments/${id}`);
  return mapBackendAppointment(data);
}

export async function createAppointment(data: Partial<Appointment>): Promise<string> {
  const result = await api.post<{ id: string }>('/appointments', toBackendAppointment(data));
  return result.id;
}

export async function updateAppointment(id: string, data: Partial<Appointment>): Promise<void> {
  await api.put(`/appointments/${id}`, toBackendAppointment(data));
}

export async function deleteAppointment(id: string): Promise<void> {
  await api.delete(`/appointments/${id}`);
}
