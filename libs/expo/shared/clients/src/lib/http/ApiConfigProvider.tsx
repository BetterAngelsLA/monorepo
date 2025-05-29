import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CSRF_HEADER_NAME, getCSRFToken } from '../common';

interface ApiConfigContextType {
  baseUrl: string;
  environment: 'production' | 'demo';
  switchEnvironment: (env: 'production' | 'demo') => Promise<void>;
  fetchClient: (path: string, options?: RequestInit) => Promise<Response>;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(
  undefined
);

interface ApiConfigProviderProps {
  children: React.ReactNode;
  productionUrl: string;
  demoUrl: string;
}

export const ApiConfigProvider = ({
  children,
  productionUrl,
  demoUrl,
}: ApiConfigProviderProps) => {
  const [environment, setEnvironment] = useState<'production' | 'demo'>(
    'production'
  );
  const baseUrl = environment === 'demo' ? demoUrl : productionUrl;

  useEffect(() => {
    AsyncStorage.getItem('currentEnvironment').then((env) => {
      if (env === 'demo') setEnvironment('demo');
    });
  }, []);

  const switchEnvironment = async (env: 'production' | 'demo') => {
    if (environment === env) return;

    await CookieManager.clearAll();
    await AsyncStorage.setItem('currentEnvironment', env);
    setEnvironment(env);
  };

  const fetchClient = useMemo(() => {
    return async (path: string, options: RequestInit = {}) => {
      const token = await getCSRFToken(baseUrl, `${baseUrl}/admin/login/`);
      return fetch(`${baseUrl}${path}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
        },
        ...options,
      });
    };
  }, [baseUrl]);

  return (
    <ApiConfigContext.Provider
      value={{ baseUrl, environment, switchEnvironment, fetchClient }}
    >
      {children}
    </ApiConfigContext.Provider>
  );
};

export const useApiConfig = () => {
  const context = useContext(ApiConfigContext);
  if (!context) {
    throw new Error('useApiConfig must be used within an ApiConfigProvider');
  }
  return context;
};
