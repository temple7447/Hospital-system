import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Role } from '../types/auth';
import type { User, AuthState } from '../types/auth';
import { KEYS, getAll } from '../lib/storage';
import type { Staff, Patient } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem(KEYS.USER);
    if (storedUser) {
      setState({ user: JSON.parse(storedUser), isAuthenticated: true, isLoading: false });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    await new Promise(resolve => setTimeout(resolve, 800));

    const normalizedEmail = email.trim().toLowerCase();

    // Look up staff first
    const staffList = getAll<Staff>(KEYS.STAFF);
    const staffMatch = staffList.find(s => s.email.toLowerCase() === normalizedEmail);

    if (staffMatch) {
      const user: User = {
        id: staffMatch.id,
        name: `${staffMatch.firstName} ${staffMatch.lastName}`,
        email: staffMatch.email,
        role: staffMatch.role as Role,
      };
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
      setState({ user, isAuthenticated: true, isLoading: false });
      return;
    }

    // Look up patients
    const patientList = getAll<Patient>(KEYS.PATIENTS);
    const patientMatch = patientList.find(p => p.email.toLowerCase() === normalizedEmail);

    if (patientMatch) {
      const user: User = {
        id: patientMatch.id,
        name: `${patientMatch.firstName} ${patientMatch.lastName}`,
        email: patientMatch.email,
        role: 'PATIENT',
      };
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
      setState({ user, isAuthenticated: true, isLoading: false });
      return;
    }

    setState(prev => ({ ...prev, isLoading: false }));
    throw new Error('No account found with this email address.');
  };

  const logout = () => {
    localStorage.removeItem(KEYS.USER);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  const hasRole = (roles: Role[]) =>
    state.user ? roles.includes(state.user.role) : false;

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
