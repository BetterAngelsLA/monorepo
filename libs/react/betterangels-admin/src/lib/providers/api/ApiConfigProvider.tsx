import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CSRF_HEADER_NAME } from './constants';
import { getCSRFToken } from './csrf';

type Env = 'production' | 'demo';

interface ApiConfigContextType {
  baseUrl: string;
  environment: Env;
  switchEnvironment: (env: Env) => void;
  fetchClient: (path: string, options?: RequestInit) => Promise<Response>;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(
  undefined
);

interface ApiConfigProviderProps {
  children: ReactNode;
  productionUrl: string;
  demoUrl: string;
}

export const ApiConfigProvider = ({
  children,
  productionUrl,
  demoUrl,
}: ApiConfigProviderProps) => {
  const [environment, setEnvironment] = useState<Env | null>(null);

  const baseUrl = environment === 'demo' ? demoUrl : productionUrl;

  useEffect(() => {
    const saved = localStorage.getItem('currentEnvironment');
    setEnvironment(saved === 'demo' ? 'demo' : 'production');
  }, []);

  const switchEnvironment = (env: Env) => {
    if (env !== environment) {
      localStorage.setItem('currentEnvironment', env);
      setEnvironment(env);
    }
  };

  const fetchClient = useMemo(() => {
    return async (path: string, options: RequestInit = {}) => {
      const token = await getCSRFToken(baseUrl, `${baseUrl}/admin/login/`);
      const { headers: userHeaders = {}, ...otherOptions } = options;
      const headers = new Headers(userHeaders as HeadersInit);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set(CSRF_HEADER_NAME, token);

      return fetch(`${baseUrl}${path}`, {
        credentials: 'include',
        headers,
        ...otherOptions,
      });
    };
  }, [baseUrl]);

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
