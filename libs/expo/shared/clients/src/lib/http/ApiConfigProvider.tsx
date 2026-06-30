import {
  ENVIRONMENT_STORAGE_KEY,
} from '@monorepo/expo/shared/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

type Env = 'production' | 'demo';

interface ApiConfigContextType {
  baseUrl: string;
  environment: Env;
  switchEnvironment: (env: Env) => Promise<void>;
  fetchClient: (path: string, options?: RequestInit) => Promise<Response>;
}

const ApiConfigContext = createContext<ApiConfigContextType | null>(null);

interface ApiConfigProviderProps {
  children: ReactNode;
  productionUrl: string;
  demoUrl: string;
  /** CSRF + Org-ID pre-wired fetch function. */
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export const ApiConfigProvider = ({
  children,
  productionUrl,
  demoUrl,
  fetch: fetchWithAuth,
}: ApiConfigProviderProps) => {
  const [environment, setEnvironment] = useState<Env | null>(null);
  const baseUrl = environment === 'demo' ? demoUrl : productionUrl;

  useEffect(() => {
    const loadEnvironment = async () => {
      const saved = await AsyncStorage.getItem(ENVIRONMENT_STORAGE_KEY);
      setEnvironment(saved === 'demo' ? 'demo' : 'production');
    };
    loadEnvironment();
  }, []);

  const switchEnvironment = useCallback(
    async (env: Env) => {
      if (env === environment) return;
      await AsyncStorage.setItem(ENVIRONMENT_STORAGE_KEY, env);
      setEnvironment(env);
    },
    [environment]
  );

  // Wrap the pre-wired fetch with the current baseUrl
  const fetchClient = useCallback(
    (path: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);
      headers.set('Content-Type', 'application/json');
      return fetchWithAuth(`${baseUrl}${path}`, { ...options, headers });
    },
    [baseUrl, fetchWithAuth]
  );

  if (environment === null) return null;

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
