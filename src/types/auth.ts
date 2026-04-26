export type Role = 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'RECEPTIONIST';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
