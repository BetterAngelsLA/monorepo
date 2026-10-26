import { useSyncExternalStore } from 'react';

import { getActiveOrgId, subscribeActiveOrgId } from '../../../activeOrg';

/**
 * The active organization's id, read from the active-org store.
 *
 * The id is derived there — the user's choice validated against the orgs they
 * belong to — so the UI and the org a request carries cannot disagree.
 * ``null`` means there is no org to act at; org-scoped queries should stay
 * idle rather than send it.
 *
 * Works outside a provider: the store answers from the remembered id before the
 * organization list resolves. Use :func:`useActiveOrgState` when the validated
 * org is needed.
 */
export function useActiveOrgId(): string | null {
  return useSyncExternalStore(
    subscribeActiveOrgId,
    getActiveOrgId,
    getActiveOrgId,
  );
}
