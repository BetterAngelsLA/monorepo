import { createContext, ReactNode, useContext, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiConfigContextType {
  apiUrl: string;
  /** Legacy fetch — prepends ``apiUrl`` + sets ``Content-Type: application/json``. */
  fetchClient: (path: string, options?: RequestInit) => Promise<Response>;
}

// ---------------------------------------------------------------------------
// Provider props
// ---------------------------------------------------------------------------

/**
 * Two fetch patterns are available, serving different consumers:
 *
 * - **``fetch`` prop** — the composed interceptor chain (already injects
 *   ``X-Organization-ID`` and ``X-CSRFToken``).  Passed directly to
 *   Apollo's ``UploadHttpLink`` as its ``fetch`` option.  No extra
 *   headers or URL manipulation.
 *
 * - **``fetchClient`` (from ``useApiConfig()``)** — wraps the composed
 *   fetch: prepends ``apiUrl`` and sets ``Content-Type: application/json``.
 *   Used by legacy REST callers (sign-in forms, report downloads, etc.).
 */
export interface ApiConfigProviderProps {
  children: ReactNode;
  /** Base API URL. */
  apiUrl: string;
  /**
   * Composed interceptor chain (org + CSRF headers pre-injected).
   * Passed to Apollo ``UploadHttpLink`` as its ``fetch`` option.
   */
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
