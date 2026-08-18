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
 * Active organization selection, backed by the active-org store.
 *
 * Owns *validation*: the store holds whatever it is told, and this is the only
 * thing that knows which organizations the user belongs to. Consumers can rely
 * on ``activeOrg`` alone — there is no readiness flag to wait on.
 */
export function useActiveOrgState(organizations: Org[]): ActiveOrgState {
  // Reconcile during render, before the snapshot read below. NOT an effect:
  // React runs effects child-before-parent, so a child would query before this
  // provider had chosen an organization and the request would go out with no
  // header. Safe here because it is idempotent and derived purely from props.
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
