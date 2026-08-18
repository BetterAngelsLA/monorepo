/**
 * The active organization id, held outside React.
 *
 * The ``X-Organization-ID`` header is attached by a fetch interceptor, which is
 * not a component and cannot read React state. Holding the id as React state
 * and mirroring it into storage gave the interceptor a copy that lagged the UI
 * — by a commit on web, by an ``AsyncStorage`` round trip on React Native — so
 * requests went out header-less while an organization was already on screen.
 *
 * One value, written synchronously, read synchronously by React (via
 * ``useSyncExternalStore``) and by the interceptor (via :func:`getActiveOrgId`).
 * Persistence is a write-behind detail, not a channel between the two.
 *
 * Scope: per JavaScript context. Two browser tabs each keep their own active
 * organization and do not follow each other, which is deliberate — a tab's UI
 * and its request headers now always agree, where previously a switch in one
 * tab changed the other's headers without changing what it displayed. Add a
 * ``storage`` event listener here if cross-tab following is ever wanted.
 */

/**
 * Somewhere to persist the id across launches.
 *
 * Must be synchronous: the value is read during ``getSnapshot`` and on every
 * request, neither of which can await. ``localStorage`` qualifies; MMKV
 * qualifies; ``AsyncStorage`` does not.
 */
export interface ActiveOrgPersistence {
  get(): string | null;
  set(value: string | null): void;
}

/**
 * Build an :type:`ActiveOrgPersistence` from a platform's key-value calls.
 *
 * Shape adaptation only — ``undefined`` becomes ``null``, and ``null`` means
 * remove. Resilience lives in the store, which guards every implementation
 * rather than only the ones built here.
 */
export const createActiveOrgPersistence = (backing: {
  read: () => string | null | undefined;
  write: (value: string) => void;
  remove: () => void;
}): ActiveOrgPersistence => ({
  get: () => backing.read() ?? null,
  set: (value) => (value === null ? backing.remove() : backing.write(value)),
});

const inMemoryPersistence = (): ActiveOrgPersistence => {
  let value: string | null = null;
  return {
    get: () => value,
    set: (next) => {
      value = next;
    },
  };
};

let persistence: ActiveOrgPersistence = inMemoryPersistence();
let configured = false;
let current: string | null = null;
const listeners = new Set<() => void>();

const notify = (): void => {
  listeners.forEach((listener) => listener());
};

// Persistence is best-effort in both directions: an unavailable or failing
// backend costs the remembered organization on the next launch, never the
// correctness of the running session.
const readPersisted = (): string | null => {
  try {
    return persistence.get();
  } catch {
    return null;
  }
};

const writePersisted = (id: string | null): void => {
  try {
    persistence.set(id);
  } catch {
    // ignored — see above
  }
};

/**
 * Install the platform's persistence and seed from it.
 *
 * Call once during bootstrap, before the fetch client issues anything. Seeding
 * here rather than in a provider effect is what makes a remembered
 * organization available to the very first request.
 */
export const configureActiveOrgStorage = (next: ActiveOrgPersistence): void => {
  persistence = next;
  configured = true;
  const seeded = readPersisted();
  if (seeded === current) return;
  current = seeded;
  notify();
};

/** Read the active organization id. Safe from anywhere, including interceptors. */
export const getActiveOrgId = (): string | null => current;

/**
 * Set the active organization id and persist it, synchronously.
 *
 * Does not validate — ``useActiveOrgState`` owns that, because it is the thing
 * that knows which organizations the user belongs to.
 */
export const setActiveOrgId = (id: string | null): void => {
  if (id === current) return;

  if (!configured && process.env['NODE_ENV'] !== 'production') {
    // Otherwise the remembered organization silently stops working: everything
    // behaves normally for the session and nothing survives a restart.
    // eslint-disable-next-line no-console
    console.warn(
      '[activeOrgStore] No persistence installed — call configureActiveOrgStorage() during bootstrap. ' +
        'The active organization will not survive a reload.',
    );
  }

  current = id;
  writePersisted(id);
  notify();
};

/**
 * Forget the active organization.
 *
 * Call on logout and when switching API environments: an id from one user or
 * environment means nothing in another, and leaving it set sends a stale header
 * until a new organization list reconciles it.
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

/**
 * Reset to a clean state. Tests only — deliberately absent from the package
 * barrel so it cannot be reached from application code.
 */
export const resetActiveOrgStoreForTests = (): void => {
  persistence = inMemoryPersistence();
  configured = false;
  current = null;
  listeners.clear();
};
