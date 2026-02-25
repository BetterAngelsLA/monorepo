import { atom, createStore } from 'jotai/vanilla';

const jotaiStore = createStore();
const clientPhotoVersionsAtom = atom<Record<string, number>>({});
const clientPhotoVersionUpdateAtom = atom<{ clientId: string; version: number } | null>(
  null
);
const incrementClientPhotoVersionAtom = atom(
  null,
  (get, set, clientId: string | number) => {
    const id = String(clientId);
    const versions = get(clientPhotoVersionsAtom);
    const next = Date.now();
    const current = versions[id] ?? 0;
    const version = next > current ? next : current + 1;

    set(clientPhotoVersionsAtom, {
      ...versions,
      [id]: version,
    });
    set(clientPhotoVersionUpdateAtom, { clientId: id, version });
  }
);

export function getClientPhotoVersion(clientId: string | number): number {
  const versions = jotaiStore.get(clientPhotoVersionsAtom);
  return versions[String(clientId)] ?? 0;
}

export function incrementClientPhotoVersion(clientId: string | number): void {
  jotaiStore.set(incrementClientPhotoVersionAtom, clientId);
}

export function subscribeClientPhotoVersion(
  callback: (clientId: string) => void
): () => void {
  return jotaiStore.sub(clientPhotoVersionUpdateAtom, () => {
    const update = jotaiStore.get(clientPhotoVersionUpdateAtom);

    if (update) {
      callback(update.clientId);
    }
  });
}
