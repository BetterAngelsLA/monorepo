import { createContext, ReactNode, useContext, useMemo } from 'react';

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
  /** CSRF + Org-ID pre-wired fetch function. */
  fetch: typeof globalThis.fetch;
}

export const ApiConfigProvider = ({
  children,
  apiUrl,
  fetch: fetchWithAuth,
}: ApiConfigProviderProps) => {
  const fetchClient = useMemo(() => {
    return async (path: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);
      headers.set('Content-Type', 'application/json');
      return fetchWithAuth(`${apiUrl}${path}`, {
        ...options,
        headers,
      });
    };
  }, [apiUrl, fetchWithAuth]);

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
