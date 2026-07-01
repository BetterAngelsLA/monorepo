import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiConfigContextType {
  apiUrl: string;
  /** Pre-wired fetch (CSRF + Org-ID) with base URL prepended. */
  fetchClient: (path: string, options?: RequestInit) => Promise<Response>;
  /** Current environment name (only when env-switching is enabled). */
  environment?: string;
  /** Switch to a different environment (only when env-switching is enabled). */
  switchEnvironment?: (env: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Storage adapter (same pattern as StorageReader in interceptors)
// ---------------------------------------------------------------------------

export interface ApiConfigStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Environment descriptor
// ---------------------------------------------------------------------------

export interface ApiEnvironment {
  name: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Provider props
// ---------------------------------------------------------------------------

export interface ApiConfigProviderProps {
  children: ReactNode;
  /**
   * Base API URL.  When ``environments`` is provided this is the
   * fallback / initial URL and ``environments`` drives selection.
   */
  apiUrl: string;
  /** CSRF + Org-ID pre-wired fetch function. */
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  /**
   * Optional — when provided the provider enables environment switching.
   * The first environment is the default.
   */
  environments?: readonly ApiEnvironment[];
  /** Storage backend for persisting the active environment. */
  storage?: ApiConfigStorage;
  /** Storage key (default: ``'ba_environment'``). */
  storageKey?: string;
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
  apiUrl: initialApiUrl,
  fetch: fetchWithAuth,
  environments,
  storage,
  storageKey = 'ba_environment',
}: ApiConfigProviderProps) => {
  // ---- Environment switching (optional) ----
  const [envName, setEnvName] = useState<string | null>(null);
  const envEnabled = !!(environments?.length && storage);

  useEffect(() => {
    if (!envEnabled || !storage || !environments) return;
    (async () => {
      const saved = await storage.getItem(storageKey);
      const match = environments.find((e) => e.name === saved);
      setEnvName(match ? saved : environments[0].name);
    })();
    // environments is intentionally omitted — it's a static config.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envEnabled, storage, storageKey]);

  const switchEnvironment = useCallback(
    async (env: string) => {
      if (!storage || !environments) return;
      if (env === envName) return;
      await storage.setItem(storageKey, env);
      setEnvName(env);
    },
    [envName, storage, storageKey, environments]
  );

  // ---- Resolve base URL ----
  const apiUrl = useMemo(() => {
    if (!envEnabled || !envName) return initialApiUrl;
    const env = environments.find((e) => e.name === envName);
    return env?.url ?? initialApiUrl;
  }, [envEnabled, envName, initialApiUrl, environments]);

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

  // ---- Context value (must be before any early return — Rules of Hooks) ----
  const value = useMemo<ApiConfigContextType>(
    () => ({
      apiUrl,
      fetchClient,
      ...(envEnabled && envName ? { environment: envName, switchEnvironment } : {}),
    }),
    [apiUrl, fetchClient, envEnabled, envName, switchEnvironment]
  );

  // ---- Pending state (after all hooks) ----
  if (envEnabled && envName === null) return null;

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
