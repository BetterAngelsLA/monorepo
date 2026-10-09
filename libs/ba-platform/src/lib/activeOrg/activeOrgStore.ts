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
let current: string | null = null;
let seeded = false;
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
 * Install the platform's persistence.
 *
 * Does no I/O: it marks the seed stale and the next read pulls. That makes the
 * call order-independent — it can run before or after anything has read the
 * id, so no caller has to sequence itself against it. The platform fetch
 * clients call it, so applications do not.
 */
export const configureActiveOrgStorage = (next: ActiveOrgPersistence): void => {
  persistence = next;
  seeded = false;
};

/**
 * Read the active organization id. Safe from anywhere, including interceptors.
 *
 * Pulls from persistence on the first read after an install. Reading during
 * render is fine — persistence is synchronous by contract, and repeated reads
 * return the same value, which is what ``useSyncExternalStore`` requires of a
 * snapshot.
 */
export const getActiveOrgId = (): string | null => {
  if (!seeded) {
    seeded = true;
    current = readPersisted();
  }

  return current;
};

/**
 * Commit a new id, if it differs. Returns whether anything changed.
 *
 * The write is always synchronous — that is the whole point of this store, see
 * the module docs. Whether ``notify`` follows synchronously is the caller's
 * choice (see :func:`reconcileActiveOrgId`).
 */
const write = (id: string | null): boolean => {
  // Compare against the seeded value rather than the field: an unseeded store
  // reads null, which would make clearActiveOrgId() a no-op that leaves the
  // persisted copy behind.
  if (id === getActiveOrgId()) return false;

  current = id;
  writePersisted(id);
  return true;
};

/**
 * Set the active organization id and persist it, synchronously.
 *
 * Does not validate — ``useActiveOrgState`` owns that, because it is the thing
 * that knows which organizations the user belongs to.
 */
export const setActiveOrgId = (id: string | null): void => {
  if (write(id)) notify();
};

/**
 * Set the active organization id **from a render phase**, deferring only the
 * notification.
 *
 * ``useActiveOrgState`` has to reconcile during render rather than in an effect:
 * React runs effects child-before-parent, so a child would fire its first query
 * before the provider had chosen an organization, and the request would go out
 * with no ``X-Organization-ID`` header.
 *
 * The *write* must therefore stay synchronous — this render, and any request
 * issued from it, has to see the new id. The *notification* must not: this
 * component subscribes to the same store through ``useSyncExternalStore``, so
 * notifying synchronously asks React to update ``ActiveOrgProvider`` while it is
 * rendering ``ActiveOrgProvider`` (React 19 warns about exactly that).
 *
 * Deferring to a microtask is safe for ordering: subscribers that render later in
 * this same pass already read the new value from ``getSnapshot``, and the
 * deferred notify simply covers anyone who already rendered.
 */
export const reconcileActiveOrgId = (id: string | null): void => {
  if (write(id)) queueMicrotask(notify);
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
  current = null;
  seeded = false;
  listeners.clear();
};
