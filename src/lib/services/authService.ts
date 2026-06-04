import { api, clearToken } from '../api';
import { mapBackendLoginResponse, mapBackendUser, type BackendUser } from '../mappers';
import type { User } from '@/types/auth';

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  const data = await api.post<{ token: string; user: BackendUser }>('/auth/login', { username, password });
  return mapBackendLoginResponse(data);
}

export async function register(data: { username: string; password: string; role: string; full_name: string; phone?: string }) {
  return api.post('/auth/register', data);
}

export async function getMe(): Promise<User> {
  const data = await api.get<BackendUser>('/auth/me');
  return mapBackendUser(data);
}

export function logout(): void {
  clearToken();
  localStorage.removeItem('hospital_user');
}
