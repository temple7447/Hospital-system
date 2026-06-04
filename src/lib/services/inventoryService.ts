import { api } from '../api';
import type { InventoryItem } from '@/types';
import { mapBackendInventoryItem, toBackendInventoryItem, type BackendInventoryItem } from '../mappers';

export interface InventoryListParams {
  category?: string;
  low_stock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listInventory(params?: InventoryListParams): Promise<InventoryItem[]> {
  const sp = new URLSearchParams();
  if (params?.category) sp.set('category', params.category);
  if (params?.low_stock) sp.set('low_stock', 'true');
  if (params?.search) sp.set('search', params.search);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  const data = await api.get<{ inventory: BackendInventoryItem[] }>(`/inventory${qs ? `?${qs}` : ''}`);
  return (data.inventory || []).map(mapBackendInventoryItem);
}

export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const data = await api.get<BackendInventoryItem>(`/inventory/${id}`);
  return mapBackendInventoryItem(data);
}

export async function createInventoryItem(data: Partial<InventoryItem>): Promise<string> {
  const result = await api.post<{ id: string }>('/inventory', toBackendInventoryItem(data));
  return result.id;
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<void> {
  await api.put(`/inventory/${id}`, toBackendInventoryItem(data));
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await api.delete(`/inventory/${id}`);
}
