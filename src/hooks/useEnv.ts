import { useState, useEffect } from 'react';

interface EnvConfig {
  appName: string;
  appVersion: string;
  apiBaseUrl: string;
  apiTimeout: number;
  enableAnalytics: boolean;
  enableDebug: boolean;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
}

export const useEnv = (): EnvConfig => {
  const [config, setConfig] = useState<EnvConfig>({
    appName: import.meta.env.VITE_APP_NAME || 'Hospital Management System',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
    apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    hospitalName: import.meta.env.VITE_HOSPITAL_NAME || 'General Hospital',
    hospitalAddress: import.meta.env.VITE_HOSPITAL_ADDRESS || '',
    hospitalPhone: import.meta.env.VITE_HOSPITAL_PHONE || '',
  });

  useEffect(() => {
    if (config.enableDebug) {
      console.log('Environment config loaded:', config);
    }
  }, [config.enableDebug]);

  return config;
};

export const getEnv = (key: string): string | undefined => {
  return import.meta.env[key] as string | undefined;
};

export default useEnv;