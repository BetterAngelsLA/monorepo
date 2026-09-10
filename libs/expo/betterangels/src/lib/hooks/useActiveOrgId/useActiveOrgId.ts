import { getActiveOrgId, subscribeActiveOrgId } from '@monorepo/ba-platform';
import { useSyncExternalStore } from 'react';

/**
 * The active organization's id, read from the active-org store.
 *
 * The org travels in mutation payloads and query filters — the request header
 * was retired (DEV-2566) — so every org-scoped call site reads the same value
 * the UI shows.  Returns `null` until an org is known (none remembered, or
 * the user has none).
 */
export function useActiveOrgId(): string | null {
  return useSyncExternalStore(
    subscribeActiveOrgId,
    getActiveOrgId,
    getActiveOrgId,
  );
}
