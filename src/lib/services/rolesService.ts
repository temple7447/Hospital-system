import { api } from '../api';

export interface Role {
  id: string;
  name: string;
  label: string;
  category: string;
  description?: string;
  is_active: number;
  is_system: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRolePayload {
  name: string;
  label: string;
  category: string;
  description?: string;
}

export async function listRoles(params?: { category?: string; is_active?: number }): Promise<Role[]> {
  const sp = new URLSearchParams();
  if (params?.category) sp.set('category', params.category);
  if (params?.is_active !== undefined) sp.set('is_active', String(params.is_active));
  const qs = sp.toString();
  const data = await api.get<{ roles: Role[] }>(`/roles${qs ? `?${qs}` : ''}`);
  return data.roles || [];
}

export async function createRole(data: CreateRolePayload): Promise<{ id: string; name: string }> {
  return api.post<{ id: string; name: string }>('/roles', data);
}

export async function updateRole(id: string, data: Partial<{ label: string; description: string; is_active: number }>): Promise<void> {
  await api.put(`/roles/${id}`, data);
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`);
}
