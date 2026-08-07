import { createContext, ReactNode, useContext, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiConfigContextType {
  apiUrl: string;
  /**
   * Raw interceptor chain (CSRF + Org-ID headers pre-injected).
   * Pass directly to Apollo ``HttpLink`` as its ``fetch`` option.
   * Rebuilt by ``EnvironmentSwitcherProvider`` when the environment changes.
   */
  rawFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  /**
   * URL-baked interceptor chain — pre-appends ``apiUrl`` to every
   * request.  Use for REST calls (allauth login, CSV downloads, etc.)
   * so consumers only pass paths, never the full URL.
   */
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// ---------------------------------------------------------------------------
// Provider props
// ---------------------------------------------------------------------------

export interface ApiConfigProviderProps {
  children: ReactNode;
  /** Base API URL. */
  apiUrl: string;
  /**
   * Factory that builds an auth-wired fetch function for the given
   * ``apiUrl``.  Called on mount and whenever ``apiUrl`` changes
   * (e.g. when wrapped by ``EnvironmentSwitcherProvider``).
   *
   * Single-environment web apps pass ``() => createWebFetchClient()`` —
   * the factory ignores ``apiUrl`` because browser cookies are
   * origin-scoped and the CSRF token is domain-relative.
   */
  buildFetch: (apiUrl: string) => (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
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
  buildFetch,
}: ApiConfigProviderProps) => {
  // ---- Build auth-wired fetch for the current apiUrl ----
  const fetchWithAuth = useMemo(
    () => buildFetch(apiUrl),
    [apiUrl, buildFetch]
  );

  // ---- URL-baked variant — auto-prepends apiUrl for REST consumers ----
  const fetchUrl = useMemo(
    () =>
      (input: RequestInfo | URL, init?: RequestInit) =>
        fetchWithAuth(`${apiUrl}${input}`, init),
    [apiUrl, fetchWithAuth]
  );

  // ---- Context value ----
  const value = useMemo<ApiConfigContextType>(
    () => ({ apiUrl, rawFetch: fetchWithAuth, fetch: fetchUrl }),
    [apiUrl, fetchWithAuth, fetchUrl]
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
