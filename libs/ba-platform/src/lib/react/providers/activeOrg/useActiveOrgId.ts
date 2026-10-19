import { useSyncExternalStore } from 'react';

import { getActiveOrgId, subscribeActiveOrgId } from '../../../activeOrg';

/**
 * The active organization's id, read from the active-org store.
 *
 * The one subscription every React consumer shares. The id is *derived* in the
 * store from the user's choice and the organizations they belong to, so a
 * screen and the query or payload it sends cannot disagree about which org is
 * active.
 *
 * ``null`` means there is no organization to act at — none remembered, or the
 * user belongs to none. A consumer that can only work against one org (an
 * org-scoped query) should stay idle on ``null`` rather than send it: the
 * backend refuses org-less reads that require one.
 *
 * Not gated on a provider: the store answers from the remembered id before the
 * organization list resolves, which is the window in which a screen may already
 * issue a query. Components that need validation use
 * :func:`useActiveOrgState` instead, which exposes the resolved org.
 */
export function useActiveOrgId(): string | null {
  return useSyncExternalStore(
    subscribeActiveOrgId,
    getActiveOrgId,
    getActiveOrgId,
  );
}
