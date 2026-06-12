import { api } from '../api';
import type { QueueEntry } from '@/types';
import { mapBackendQueueEntry, type BackendQueueEntry } from '../mappers';

export interface QueueListParams {
  doctor_id?: string;
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export async function listQueue(params?: QueueListParams): Promise<QueueEntry[]> {
  const sp = new URLSearchParams();
  if (params?.doctor_id) sp.set('doctor_id', params.doctor_id);
  if (params?.status) sp.set('status', params.status);
  if (params?.date) sp.set('date', params.date);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  const data = await api.get<{ queue: BackendQueueEntry[] }>(`/queue${qs ? `?${qs}` : ''}`);
  return (data.queue || []).map(mapBackendQueueEntry);
}

export async function getQueueEntry(id: string): Promise<QueueEntry> {
  const data = await api.get<BackendQueueEntry>(`/queue/${id}`);
  return mapBackendQueueEntry(data);
}

export async function createQueueEntry(data: Partial<QueueEntry>): Promise<{ id: string; tokenNumber: string }> {
  const result = await api.post<{ id: string; token_number: string }>('/queue', {
    patient_id: data.patientId,
    doctor_id: data.doctorId,
    appointment_id: data.appointmentId,
    priority: data.priority,
    estimated_wait: data.estimatedWait,
  });
  return { id: result.id, tokenNumber: result.token_number };
}

export async function updateQueueEntry(id: string, data: Partial<QueueEntry>): Promise<void> {
  const body: Record<string, unknown> = {};
  if (data.status) {
    body.status = data.status;
    if (data.status === 'called')    body.called_at    = new Date().toISOString();
    if (data.status === 'completed') body.completed_at = new Date().toISOString();
  }
  if (data.priority)     body.priority      = data.priority;
  if (data.doctorId)     body.doctor_id     = data.doctorId;
  if (data.estimatedWait) body.estimated_wait = data.estimatedWait;
  await api.put(`/queue/${id}`, body);
}
