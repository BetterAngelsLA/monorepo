import { useSyncExternalStore } from 'react';
import {
  getClientPhotoVersion,
  subscribeClientPhotoVersion,
} from './clientPhotoVersionStore';

function subscribeForClient(clientId: string, onStoreChange: () => void) {
  return subscribeClientPhotoVersion((updatedId) => {
    if (updatedId === clientId) onStoreChange();
  });
}

function noopUnsubscribe() {
  /* no-op when there is no clientId */
}

export function useHmisClientPhotoVersion(
  clientId: string | number | null | undefined
) {
  const id = clientId != null ? String(clientId) : null;

  return useSyncExternalStore(
    (onChange) => (id ? subscribeForClient(id, onChange) : noopUnsubscribe),
    () => (id ? getClientPhotoVersion(id) : 0),
    () => 0 // optional server snapshot
  );
}
