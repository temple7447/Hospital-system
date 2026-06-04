import { api } from '../api';
import type { Invoice } from '@/types';
import { mapBackendInvoice, toBackendInvoice, type BackendInvoice } from '../mappers';

export interface InvoiceListParams {
  patient_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listInvoices(params?: InvoiceListParams): Promise<Invoice[]> {
  const sp = new URLSearchParams();
  if (params?.patient_id) sp.set('patient_id', params.patient_id);
  if (params?.status) sp.set('status', params.status);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  const data = await api.get<{ invoices: BackendInvoice[] }>(`/invoices${qs ? `?${qs}` : ''}`);
  return (data.invoices || []).map(mapBackendInvoice);
}

export async function getInvoice(id: string): Promise<Invoice> {
  const data = await api.get<BackendInvoice>(`/invoices/${id}`);
  return mapBackendInvoice(data);
}

export async function createInvoice(data: Partial<Invoice>): Promise<string> {
  const result = await api.post<{ id: string }>('/invoices', toBackendInvoice(data));
  return result.id;
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<void> {
  await api.put(`/invoices/${id}`, toBackendInvoice(data));
}

export async function deleteInvoice(id: string): Promise<void> {
  await api.delete(`/invoices/${id}`);
}
