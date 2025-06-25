import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
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
  const [environment, setEnvironment] = useState<Env>('production');
  const [loaded, setLoaded] = useState(false);
  const baseUrl = environment === 'demo' ? demoUrl : productionUrl;

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('currentEnvironment');
      if (saved === 'demo') setEnvironment('demo');
      setLoaded(true);
    })();
  }, []);

  const fetchClient = useMemo(() => {
    return async (path: string, options: RequestInit = {}) => {
      const token = await getCSRFToken(baseUrl, `${baseUrl}/admin/login/`);
      const { headers: userHeaders = {}, ...otherOptions } = options;
      const headers = new Headers(userHeaders);
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

  const switchEnvironment = async (env: Env) => {
    if (env === environment) return;
    await CookieManager.clearAll();
    await AsyncStorage.setItem('currentEnvironment', env);
    setEnvironment(env);
  };

  if (!loaded) {
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
  const ctx = useContext(ApiConfigContext);
  if (!ctx) throw new Error('useApiConfig must be inside ApiConfigProvider');
  return ctx;
};
