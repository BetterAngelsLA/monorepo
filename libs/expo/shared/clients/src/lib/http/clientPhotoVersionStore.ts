/**
 * Module-level store for client photo versions. When a photo is uploaded we
 * increment the version for that client so useClientPhotoContentUri can append
 * ?t=version and bust image cache everywhere (list, profile, modal) without
 * adding a React provider.
 */

const versions: Record<string, number> = {};
const listeners = new Set<(clientId: string) => void>();

export function getClientPhotoVersion(clientId: string | number): number {
  return versions[String(clientId)] ?? 0;
}

export function incrementClientPhotoVersion(clientId: string | number): void {
  const id = String(clientId);
  versions[id] = (versions[id] ?? 0) + 1;
  listeners.forEach((fn) => fn(id));
}

export function subscribeClientPhotoVersion(
  callback: (clientId: string) => void
): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
