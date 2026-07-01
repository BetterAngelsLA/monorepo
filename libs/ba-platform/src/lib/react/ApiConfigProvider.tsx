import { createContext, ReactNode, useContext, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiConfigContextType {
  apiUrl: string;
  /** Pre-wired fetch (CSRF + Org-ID) with base URL prepended. */
  fetchClient: (path: string, options?: RequestInit) => Promise<Response>;
}

// ---------------------------------------------------------------------------
// Provider props
// ---------------------------------------------------------------------------

export interface ApiConfigProviderProps {
  children: ReactNode;
  /** Base API URL. */
  apiUrl: string;
  /** CSRF + Org-ID pre-wired fetch function. */
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const ApiConfigProvider = ({
  children,
  apiUrl,
  fetch: fetchWithAuth,
}: ApiConfigProviderProps) => {
  // ---- Fetch client ----
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

  // ---- Context value ----
  const value = useMemo<ApiConfigContextType>(
    () => ({ apiUrl, fetchClient }),
    [apiUrl, fetchClient]
  );

  return (
    <ApiConfigContext.Provider value={value}>
      {children}
    </ApiConfigContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useApiConfig = () => {
  const context = useContext(ApiConfigContext);
  if (!context) {
    throw new Error('useApiConfig must be used within an ApiConfigProvider');
  }
  return context;
};
