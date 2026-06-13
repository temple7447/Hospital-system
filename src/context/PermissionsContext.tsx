import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '@/lib/services';
import { hasPagePermission } from '@/lib/pageRegistry';
import type { PagePermissions } from '@/lib/pageRegistry';
import { useAuth } from './AuthContext';

interface PermissionsContextValue {
  permissions: PagePermissions;
  canAccess: (pageKey: string) => boolean;
  updatePermissions: (perms: PagePermissions) => Promise<void>;
  isLoaded: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: {},
  canAccess: () => false,
  updatePermissions: async () => {},
  isLoaded: false,
});

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PagePermissions>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    getSettings()
      .then(settings => {
        const perms = settings.page_permissions as PagePermissions | undefined;
        if (perms && typeof perms === 'object') setPermissions(perms);
      })
      .catch((err) => console.error('Failed to load permissions:', err))
      .finally(() => setIsLoaded(true));
  }, [user?.id]);

  const canAccess = useCallback((pageKey: string): boolean => {
    if (!user) return false;
    return hasPagePermission(permissions, user.role, pageKey);
  }, [permissions, user?.role]);

  const updatePermissions = useCallback(async (perms: PagePermissions) => {
    await saveSettings({ page_permissions: perms });
    setPermissions(perms);
  }, []);

  return (
    <PermissionsContext.Provider value={{ permissions, canAccess, updatePermissions, isLoaded }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
