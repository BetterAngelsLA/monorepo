import type { PermissionEnum } from '@monorepo/ba-platform/permissions';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import {
  getActiveOrgId,
  setActiveOrgId as commitActiveOrgId,
  subscribeActiveOrgId,
} from '../../../activeOrg';

/** Minimal org shape consumed by the active-org state. */
export interface Org {
  id: string;
  name: string;
  permissions: readonly PermissionEnum[];
}

export interface ActiveOrgState {
  /** The currently selected organization. */
  activeOrg: Org | undefined;
  /** All organizations the user has access to. */
  organizations: Org[];
  /** Switch to a different org by its id. */
  setActiveOrgId: (orgId: string) => void;
  /** Check if the active org has a specific permission. */
  hasPermission: (permission: PermissionEnum) => boolean;
}

/**
 * Active organization selection, backed by the module-level active-org store.
 *
 * The id itself lives in ``../../../activeOrg`` rather than in ``useState``,
 * because the ``X-Organization-ID`` fetch interceptor has to read it and is not
 * a component. Keeping one synchronously-written value means a request can
 * never go out with a header that disagrees with what the UI is showing, so
 * consumers can query on ``activeOrg`` alone — no readiness flag to wait on.
 *
 * This hook owns *validation*: the store holds whatever it is told, and this is
 * the only thing that knows which organizations the user belongs to.
 */
export function useActiveOrgState(organizations: Org[]): ActiveOrgState {
  // Reconcile the store against the organizations the user actually has —
  // during render, deliberately, *before* reading the snapshot below.
  //
  // This cannot be an effect. React runs effects child-before-parent, so a
  // child's query would fire before this provider's effect had chosen an
  // organization, and the request would go out with no header — the exact bug
  // this store exists to remove. Running here means the store is correct
  // before any child renders.
  //
  // Safe as a render-phase write because it is idempotent and derived purely
  // from props: a discarded render can only publish the value a committed
  // render would have published anyway, and running twice under StrictMode
  // changes nothing.
  const currentId = getActiveOrgId();
  if (!currentId || !organizations.some((o) => o.id === currentId)) {
    commitActiveOrgId(organizations[0]?.id ?? null);
  }

  const activeOrgId = useSyncExternalStore(
    subscribeActiveOrgId,
    getActiveOrgId,
    getActiveOrgId,
  );

  const activeOrg = useMemo(
    () => organizations.find((o) => o.id === activeOrgId),
    [organizations, activeOrgId],
  );

  const setActiveOrgId = useCallback(
    (orgId: string) => {
      if (organizations.some((o) => o.id === orgId)) commitActiveOrgId(orgId);
    },
    [organizations],
  );

  const permSet = useMemo(
    () => new Set(activeOrg?.permissions ?? []),
    [activeOrg?.permissions],
  );

  const hasPermission = useCallback(
    (permission: PermissionEnum): boolean => permSet.has(permission),
    [permSet],
  );

  return useMemo(
    () => ({ activeOrg, organizations, setActiveOrgId, hasPermission }),
    [activeOrg, organizations, setActiveOrgId, hasPermission],
  );
}
