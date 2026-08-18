/**
 * The active organization id, held outside React.
 *
 * Why this is not React state
 * ---------------------------
 * The ``X-Organization-ID`` header is attached by a fetch interceptor, which
 * is not a component and cannot read React state. Modelling the id as React
 * state and mirroring it into storage means the interceptor reads a copy that
 * lags the UI by an effect — on React Native, by an ``AsyncStorage`` round
 * trip. Requests then go out header-less while the UI already shows an
 * organization, and every consumer has to guess when the two agree.
 *
 * So the id lives here: one value, written synchronously, readable
 * synchronously by both React (via ``useSyncExternalStore``) and the
 * interceptor (via :func:`getActiveOrgId`).
 *
 * The snapshot is a primitive, which sidesteps ``useSyncExternalStore``'s main
 * hazard — a ``getSnapshot`` that returns a fresh object each call re-renders
 * forever. ``subscribe`` is defined here rather than inline in a component so
 * React does not resubscribe on every render.
 */

/** Synchronous key-value backing. Both platforms have one: ``localStorage`` on
 * web, MMKV on React Native. Synchronous is the requirement, not the mechanism —
 * an async store cannot be read during ``getSnapshot`` or by the interceptor. */
export interface SyncOrgStorage {
  get(): string | null;
  set(value: string | null): void;
}

/** Used until a platform installs a real one, and in tests. */
const inMemoryStorage = (): SyncOrgStorage => {
  let value: string | null = null;
  return {
    get: () => value,
    set: (next) => {
      value = next;
    },
  };
};

let storage: SyncOrgStorage = inMemoryStorage();
let current: string | null = null;
const listeners = new Set<() => void>();

const notify = (): void => {
  listeners.forEach((listener) => listener());
};

/**
 * Install the platform's synchronous storage and seed from it.
 *
 * Call once during bootstrap, before the fetch client issues anything — web
 * from ``main.tsx``, Expo from the app entry. Seeding here rather than in a
 * provider effect is what makes the remembered organization available to the
 * very first request instead of one commit later.
 */
export const configureActiveOrgStorage = (next: SyncOrgStorage): void => {
  storage = next;
  const seeded = storage.get();
  if (seeded === current) return;
  current = seeded;
  notify();
};

/** Read the active organization id. Safe from anywhere, including interceptors. */
export const getActiveOrgId = (): string | null => current;

/**
 * Set the active organization id and persist it, synchronously.
 *
 * Callers are responsible for passing an id the user actually belongs to;
 * this does not validate. ``useActiveOrgState`` owns that check, because it is
 * the thing that knows the organization list.
 */
export const setActiveOrgId = (id: string | null): void => {
  if (id === current) return;
  current = id;
  try {
    storage.set(id);
  } catch {
    // Persistence is best-effort — a failed write costs the remembered
    // organization on next launch, not the correctness of this session.
  }
  notify();
};

/**
 * Forget the active organization.
 *
 * Call on logout and when switching API environments: an id from one user or
 * one environment means nothing in another, and leaving it set sends a stale
 * header until the new organization list loads and reconciles.
 */
export const clearActiveOrgId = (): void => {
  setActiveOrgId(null);
};

/** Subscribe to changes. Returns an unsubscribe function. */
export const subscribeActiveOrgId = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Reset store *and* backing to a clean in-memory state. Tests only. */
export const resetActiveOrgStoreForTests = (): void => {
  storage = inMemoryStorage();
  current = null;
  listeners.clear();
};
