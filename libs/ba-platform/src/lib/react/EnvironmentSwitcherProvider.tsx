import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ApiConfigProvider } from './ApiConfigProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Storage adapter for persisting the active environment. */
export interface ApiConfigStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
}

/** Environment descriptor. */
export interface ApiEnvironment {
  name: string;
  url: string;
}

export interface ApiEnvironmentContextType {
  environment: string;
  switchEnvironment: (env: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Provider props
// ---------------------------------------------------------------------------

export interface EnvironmentSwitcherProviderProps {
  children: ReactNode;
  /**
   * Available API environments. The first is the default.
   *
   * **Important:** This array must be a **stable reference** — define it
   * outside the component (module-level) rather than inline in JSX.
   * The ``useEffect`` that reads the saved environment intentionally
   * omits ``environments`` from its dependency array because it is
   * treated as static config. Passing a dynamically-generated array
   * will cause the provider to use a stale environment after switching.
   */
  environments: readonly ApiEnvironment[];
  /** Storage backend for persisting the active environment. */
  storage: ApiConfigStorage;
  /** Storage key (default: ``'ba_environment'``). */
  storageKey?: string;
  /**
   * Factory that builds a CSRF + Org-ID pre-wired fetch function for a
   * given ``apiUrl``. Called whenever the environment changes so the
   * interceptor chain always targets the correct backend.
   *
   * For single-environment web apps that don't need the URL parameter,
   * pass ``() => createWebFetchClient()``.
   */
  createFetch: (apiUrl: string) => (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ApiEnvironmentContext = createContext<ApiEnvironmentContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const EnvironmentSwitcherProvider = ({
  children,
  environments,
  storage,
  storageKey = 'ba_environment',
  createFetch,
}: EnvironmentSwitcherProviderProps) => {
  const [envName, setEnvName] = useState<string | null>(null);

  // ---- Dev-mode guard: warn if environments is not a stable reference ----
  const prevEnvsRef = useRef(environments);
  if (
    process.env['NODE_ENV'] !== 'production' &&
    prevEnvsRef.current !== environments
  ) {
    console.warn(
      'EnvironmentSwitcherProvider: `environments` array changed between renders. ' +
      'This can cause stale environment state because the init effect intentionally ' +
      'omits `environments` from its dependency array. Define the array at module scope.',
    );
  }
  prevEnvsRef.current = environments;

  // ---- Resolve saved environment ----
  useEffect(() => {
    (async () => {
      const saved = await storage.getItem(storageKey);
      const match = environments.find((e) => e.name === saved);
      setEnvName(match ? saved : environments[0].name);
    })();
    // environments is intentionally omitted — it's a static config.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage, storageKey]);

  // ---- Switch environment ----
  const switchEnvironment = useCallback(
    async (env: string) => {
      if (env === envName) return;
      await storage.setItem(storageKey, env);
      setEnvName(env);
    },
    [envName, storage, storageKey]
  );

  // ---- Resolve base URL ----
  const apiUrl = useMemo(() => {
    const env = environments.find((e) => e.name === envName);
    return env?.url ?? environments[0].url;
  }, [envName, environments]);

  // ---- Build env-aware fetch chain ----
  // (delegated to ApiConfigProvider via createFetch)

  // ---- Environment context value ----
  const envValue = useMemo<ApiEnvironmentContextType | undefined>(
    () => (envName ? { environment: envName, switchEnvironment } : undefined),
    [envName, switchEnvironment]
  );

  // ---- Pending state (after all hooks) ----
  if (envName === null) return null;

  return (
    <ApiEnvironmentContext.Provider value={envValue}>
      <ApiConfigProvider apiUrl={apiUrl} createFetch={createFetch}>
        {children}
      </ApiConfigProvider>
    </ApiEnvironmentContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useEnvironment = () => {
  const context = useContext(ApiEnvironmentContext);
  if (!context) {
    throw new Error(
      'useEnvironment must be used within an EnvironmentSwitcherProvider'
    );
  }
  return context;
};
