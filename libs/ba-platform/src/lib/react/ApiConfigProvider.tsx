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
// Context
// ---------------------------------------------------------------------------

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface ApiConfigProviderProps {
  children: ReactNode;
  apiUrl: string;
  /** CSRF + Org-ID pre-wired fetch function (e.g. from ``createWebFetchClient``). */
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

/**
 * Provides ``apiUrl`` and a pre-configured ``fetchClient`` to the React tree.
 *
 * The ``fetchClient`` automatically prepends ``apiUrl`` to relative paths and
 * sets ``Content-Type: application/json``. All CSRF / org-id injection is
 * handled by the ``fetch`` function passed in — this provider just wraps it
 * with the base URL.
 *
 * Consumed via :hook:`useApiConfig`.
 */
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
