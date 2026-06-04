import { api } from '../api';
import type { Room } from '@/types';
import { mapBackendRoom, toBackendRoom, type BackendRoom } from '../mappers';

export interface RoomListParams {
  department_id?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listRooms(params?: RoomListParams): Promise<Room[]> {
  const sp = new URLSearchParams();
  if (params?.department_id) sp.set('department_id', params.department_id);
  if (params?.type) sp.set('type', params.type);
  if (params?.status) sp.set('status', params.status);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  const data = await api.get<{ rooms: BackendRoom[] }>(`/rooms${qs ? `?${qs}` : ''}`);
  return (data.rooms || []).map(mapBackendRoom);
}

export async function getRoom(id: string): Promise<Room> {
  const data = await api.get<BackendRoom>(`/rooms/${id}`);
  return mapBackendRoom(data);
}

export async function createRoom(data: Partial<Room>): Promise<string> {
  const result = await api.post<{ id: string }>('/rooms', toBackendRoom(data));
  return result.id;
}

export async function updateRoom(id: string, data: Partial<Room>): Promise<void> {
  await api.put(`/rooms/${id}`, toBackendRoom(data));
}

export async function deleteRoom(id: string): Promise<void> {
  await api.delete(`/rooms/${id}`);
}
