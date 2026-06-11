import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Role } from '@/types/auth';
import type { User, AuthState } from '@/types/auth';
import { KEYS } from '@/lib/storage';
import { login as apiLogin, getMe } from '@/lib/services';
import { getToken, setToken, ApiError } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
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
    const init = async () => {
      const token = getToken();
      if (token) {
        try {
          const user = await getMe();
          setState({ user, isAuthenticated: true, isLoading: false });
          syncAll();
          return;
        } catch {
          setToken('');
        }
      }

      const storedUser = localStorage.getItem(KEYS.USER);
      if (storedUser) {
        setState({ user: JSON.parse(storedUser), isAuthenticated: true, isLoading: false });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken('');
      localStorage.removeItem(KEYS.USER);
      setState({ user: null, isAuthenticated: false, isLoading: false });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await apiLogin(username, password);
      setToken(result.token);
      localStorage.setItem(KEYS.USER, JSON.stringify(result.user));
      setState({ user: result.user, isAuthenticated: true, isLoading: false });
      return;
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }));
      if (err instanceof ApiError && err.status === 401) {
        throw new Error('Invalid username or password.');
      }
      if (err instanceof ApiError) {
        throw new Error(err.message);
      }
      throw new Error('Cannot reach the server. Please make sure the backend is running.');
    }
  }, []);

  const logout = useCallback(() => {
    setToken('');
    localStorage.removeItem(KEYS.USER);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const hasRole = useCallback((roles: Role[]) =>
    state.user ? roles.includes(state.user.role) : false,
  [state.user]);

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
