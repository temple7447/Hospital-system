import { api } from '../api';
import type { Notification } from '@/types';
import { mapBackendNotification, type BackendNotification } from '../mappers';

export async function listNotifications(unreadOnly = false): Promise<Notification[]> {
  const qs = unreadOnly ? '?unread_only=true' : '';
  const data = await api.get<{ notifications: BackendNotification[] }>(`/notifications${qs}`);
  return (data.notifications || []).map(mapBackendNotification);
}

export async function getUnreadCount(): Promise<number> {
  const data = await api.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function createNotification(data: { user_id: string; type: string; title: string; message?: string; link?: string }): Promise<string> {
  const result = await api.post<{ id: string }>('/notifications', data);
  return result.id;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.put('/notifications/read-all');
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
