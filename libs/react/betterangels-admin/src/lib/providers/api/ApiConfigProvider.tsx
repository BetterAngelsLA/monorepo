import { createContext, ReactNode, useContext, useMemo } from 'react';
import { CSRF_HEADER_NAME } from './constants';
import { getCSRFToken } from './csrf';

interface ApiConfigContextType {
  apiUrl: string;
  fetchClient: (path: string, options?: RequestInit) => Promise<Response>;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(
  undefined
);

interface ApiConfigProviderProps {
  children: ReactNode;
  apiUrl: string;
}

export const ApiConfigProvider = ({
  children,
  apiUrl,
}: ApiConfigProviderProps) => {
  const fetchClient = useMemo(() => {
    return async (path: string, options: RequestInit = {}) => {
      const token = await getCSRFToken(apiUrl, `${apiUrl}/admin/login/`);
      const { headers: userHeaders = {}, ...otherOptions } = options;
      const headers = new Headers(userHeaders as HeadersInit);
      headers.set('Content-Type', 'application/json');
      if (token) headers.set(CSRF_HEADER_NAME, token);

      return fetch(`${apiUrl}${path}`, {
        credentials: 'include',
        headers,
        ...otherOptions,
      });
    };
  }, [apiUrl]);

  return (
    <ApiConfigContext.Provider value={{ apiUrl, fetchClient }}>
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
