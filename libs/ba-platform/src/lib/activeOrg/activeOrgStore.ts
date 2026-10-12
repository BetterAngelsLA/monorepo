/**
 * The active organization id, held outside React.
 *
 * The ``X-Organization-ID`` header comes from a fetch interceptor, which is not
 * a component and cannot read React state. Mirroring React state into storage
 * gave it a copy that lagged the UI, so requests went out header-less while an
 * organization was already on screen.
 *
 * The id is *derived* on every read from two inputs — the id the user chose (or
 * the one remembered from last launch) and the organizations the user belongs to
 * — so the UI and the header cannot disagree, and nothing has to be written
 * during render. React reads it via ``useSyncExternalStore``; the interceptor via
 * :func:`getActiveOrgId`. Persistence is a write-behind detail, not a channel
 * between the two.
 *
 * Scope: per JavaScript context. Two browser tabs each keep their own active
 * organization and do not follow each other, which is deliberate — a tab's UI and
 * its request headers agree with each other. Add a ``storage`` event listener here
 * if cross-tab following is ever wanted.
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
 * Where the store finds the signed-in user's organizations, or ``null`` while
 * that is still unknown.
 *
 * A function rather than a published value: it is read when the header is needed
 * (at request time) and in ``getSnapshot``, so it cannot lag a render. A published
 * list would have to be in place before the first render that mounts a component
 * which queries, which no render-order-independent point in React offers.
 */
export interface ActiveOrgSource {
  (): readonly { id: string }[] | null;
}

/**
 * Installed readers, innermost last.
 *
 * A stack because providers nest: `apps/shelter-web` mounts one around the whole
 * app and `OperatorApp` another on a route inside it. A single slot let the inner
 * provider's unmount disarm the outer one, which then sent no organization at all.
 */
const organizationSources: ActiveOrgSource[] = [];

const readOrganizations = (): readonly { id: string }[] | null => {
  const source = organizationSources[organizationSources.length - 1];
  if (!source) return null;

  try {
    return source();
  } catch {
    // Same best-effort rule as persistence: a failing reader costs validation,
    // never the running session.
    return null;
  }
};

/**
 * Install an organization reader, returning the function that removes it again.
 *
 * Reads nothing: the reader is consulted lazily, when the header is needed or the
 * snapshot is taken. Callers dispose it from an effect cleanup, so a provider
 * that unmounts (or whose list changes) restores whatever was installed beneath
 * it. Notifies only when the change moves the *derived* id, so a caller that
 * installs a fresh closure on every render cannot make subscribers loop.
 */
export const pushActiveOrgSource = (next: ActiveOrgSource): (() => void) => {
  organizationSources.push(next);
  notify();

  return () => {
    const at = organizationSources.lastIndexOf(next);
    if (at !== -1) organizationSources.splice(at, 1);

    // Always, not only when the derived id moved: tracking "the last value we
    // announced" in one place and mutating the stack in several is how a removal
    // that restores an older value ends up notifying nobody, which leaves
    // subscribers rendering one organization while the header sends another.
    notify();
  };
};

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

/** The user's own choice, pulled from persistence on the first read. No derivation. */
const readSelected = (): string | null => {
  if (!seeded) {
    seeded = true;
    current = readPersisted();
  }

  return current;
};

/**
 * Read the active organization id. Safe from anywhere, including interceptors.
 *
 * Pulls from persistence on the first read after an install, then **derives**:
 * the remembered id if the user still belongs to it, otherwise their first
 * organization. Deriving rather than reconciling is what keeps the id and the
 * UI in step without a write during render — both read the same two inputs.
 *
 * Reading during render is fine — persistence is synchronous by contract, and
 * the outcome is a string, so repeated reads return the same value, which is
 * what ``useSyncExternalStore`` requires of a snapshot.
 */
export const getActiveOrgId = (): string | null => {
  const selected = readSelected();

  const organizations = readOrganizations();

  // Unknown (the user query has not resolved): the remembered id is the best
  // answer available, and requests in that window are correctly attributed.
  if (organizations === null) return selected;

  // Known and empty: the user belongs to no organization, so a remembered id is
  // stale rather than merely unvalidated.
  if (organizations.length === 0) return null;

  return organizations.some((org) => org.id === selected)
    ? selected
    : organizations[0].id;
};

/**
 * Commit a new id, if it differs. Returns whether anything changed.
 *
 * The write is always synchronous — that is the whole point of this store, see
 * the module docs — and it is the *choice* that gets persisted, not the derived
 * default.
 */
const write = (id: string | null): boolean => {
  // Against the *selected* value, never the derived one: `getActiveOrgId()` may be
  // answering from the organization list, and comparing with that would turn
  // clearing (or any write) into a no-op that leaves the persisted copy behind.
  if (id === readSelected()) return false;

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
 * Forget the active organization.
 *
 * Call on logout and when switching API environments: an id from one user or
 * environment means nothing in another, and leaving it set sends a stale header
 * until a new organization list reconciles it.
 */
export const clearActiveOrgId = (): void => {
  // Forget the readers along with the choice. The organizations belong to the
  // session being torn down (logout, an environment switch), and a derivation
  // that kept reading them would put an organization straight back into the
  // header. Providers still mounted re-install theirs on their next render.
  organizationSources.length = 0;
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
  organizationSources.length = 0;
  current = null;
  seeded = false;
  listeners.clear();
};
