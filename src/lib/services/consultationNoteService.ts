import { api } from '../api';
import type { ConsultationNote } from '@/types';
import { mapBackendConsultationNote, toBackendConsultationNote, type BackendConsultationNote } from '../mappers';

export interface NoteListParams {
  patient_id?: string;
  doctor_id?: string;
  appointment_id?: string;
  page?: number;
  limit?: number;
}

export async function listConsultationNotes(params?: NoteListParams): Promise<ConsultationNote[]> {
  const sp = new URLSearchParams();
  if (params?.patient_id) sp.set('patient_id', params.patient_id);
  if (params?.doctor_id) sp.set('doctor_id', params.doctor_id);
  if (params?.appointment_id) sp.set('appointment_id', params.appointment_id);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  const data = await api.get<{ notes: BackendConsultationNote[] }>(`/consultation-notes${qs ? `?${qs}` : ''}`);
  return (data.notes || []).map(mapBackendConsultationNote);
}

export async function getConsultationNote(id: string): Promise<ConsultationNote> {
  const data = await api.get<BackendConsultationNote>(`/consultation-notes/${id}`);
  return mapBackendConsultationNote(data);
}

export async function createConsultationNote(data: Partial<ConsultationNote>): Promise<string> {
  const result = await api.post<{ id: string }>('/consultation-notes', toBackendConsultationNote(data));
  return result.id;
}

export async function updateConsultationNote(id: string, data: Partial<ConsultationNote>): Promise<void> {
  await api.put(`/consultation-notes/${id}`, toBackendConsultationNote(data));
}

export async function deleteConsultationNote(id: string): Promise<void> {
  await api.delete(`/consultation-notes/${id}`);
}
