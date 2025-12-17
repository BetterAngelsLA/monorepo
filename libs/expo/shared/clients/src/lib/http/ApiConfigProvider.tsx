import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import NitroCookies from 'react-native-nitro-cookies';
import { CSRF_HEADER_NAME, getCSRFToken } from '../common';

type Env = 'production' | 'demo';

interface ApiConfigContextType {
  baseUrl: string;
  environment: Env;
  switchEnvironment: (env: Env) => Promise<void>;
  fetchClient: (path: string, options?: RequestInit) => Promise<Response>;
}

const ApiConfigContext = createContext<ApiConfigContextType | null>(null);

export const ApiConfigProvider = ({
  children,
  productionUrl,
  demoUrl,
}: {
  children: ReactNode;
  productionUrl: string;
  demoUrl: string;
}) => {
  const [environment, setEnvironment] = useState<Env | null>(null);
  const baseUrl = environment === 'demo' ? demoUrl : productionUrl;

  useEffect(() => {
    const loadEnvironment = async () => {
      const saved = await AsyncStorage.getItem('currentEnvironment');
      setEnvironment(saved === 'demo' ? 'demo' : 'production');
    };
    loadEnvironment();
  }, []);

  const switchEnvironment = async (env: Env) => {
    if (env === environment) return;
    await NitroCookies.clearAll();
    await AsyncStorage.setItem('currentEnvironment', env);
    setEnvironment(env);
  };

  const fetchClient = useMemo(() => {
    return async (path: string, options: RequestInit = {}) => {
      const token = await getCSRFToken(baseUrl, `${baseUrl}/admin/login/`);
      const { headers: userHeaders = {}, ...otherOptions } = options;
      const headers = new Headers(userHeaders as HeadersInit);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set(CSRF_HEADER_NAME, token);
      if (Platform.OS !== 'web') headers.set('Referer', baseUrl);

      return fetch(`${baseUrl}${path}`, {
        credentials: 'include',
        headers,
        ...otherOptions,
      });
    };
  }, [baseUrl]);

  if (environment === null) {
    return null;
  }

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
