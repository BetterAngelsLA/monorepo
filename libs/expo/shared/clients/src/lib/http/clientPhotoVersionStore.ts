/**
 * App-wide store for client photo cache-busting tokens.
 * When a photo is uploaded we update the token for that client so
 * useClientPhotoContentUri can append ?t=<token> and bust image cache
 * everywhere (list cards, profile header, modals) without a React provider.
 *
 * Stored on globalThis so all callers share one store (avoids duplicate
 * module instances from Metro/HMR or different screens).
 */
const STORE_KEY = '__BA_CLIENT_PHOTO_VERSION_STORE__';

type Store = {
  versions: Record<string, number>;
  listeners: Set<(clientId: string) => void>;
};

function getStore(): Store {
  const g = globalThis as unknown as Record<string, unknown>;
  if (g[STORE_KEY]) return g[STORE_KEY] as Store;
  const store: Store = { versions: {}, listeners: new Set() };
  g[STORE_KEY] = store;
  return store;
}

const store = getStore();

export function getClientPhotoVersion(clientId: string | number): number {
  return store.versions[String(clientId)] ?? 0;
}

export function incrementClientPhotoVersion(clientId: string | number): void {
  const id = String(clientId);
  const next = Date.now();
  store.versions[id] =
    next > (store.versions[id] ?? 0) ? next : (store.versions[id] ?? 0) + 1;
  store.listeners.forEach((fn) => fn(id));
}

export function subscribeClientPhotoVersion(
  callback: (clientId: string) => void
): () => void {
  store.listeners.add(callback);
  return () => store.listeners.delete(callback);
}
