import { isPermission } from '@monorepo/ba-platform/permissions';
import type { PermissionEnum } from '@monorepo/ba-platform/permissions';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

import {
  configureActiveOrgSource,
  getActiveOrgId,
  setActiveOrgId as commitActiveOrgId,
  subscribeActiveOrgId,
} from '../../../activeOrg';

/**
 * Minimal org shape accepted by the active-org state.
 *
 * ``permissions`` are the RAW backend strings (``app.codename``).  The state
 * filters them to the modeled ``PermissionEnum`` set before exposing
 * ``activeOrg``/``organizations`` (see ``useActiveOrgState``), so an unknown
 * backend permission can never satisfy a check or leak to consumers that read
 * ``permissions`` directly.
 */
export interface Org {
  id: string;
  name: string;
  permissions: readonly string[];
}

export interface ActiveOrgState {
  /** The currently selected organization. */
  activeOrg: Org | undefined;
  /** All organizations the user has access to. */
  organizations: Org[];
  /** Switch to a different org by its id. */
  setActiveOrgId: (orgId: string) => void;
  /**
   * Whether the ACTIVE ORG can exercise *permission* — the org-scoped gate.
   *
   * The active org's entry is EFFECTIVE (the backend folds the global tier in
   * only where it is enforceable per org — grant-only/dual domains — and adds
   * the org-scoped grant/delegated/legacy arms), so this is the single
   * membership test ADR 0001 §5.2 prescribes.  It deliberately does NOT consult
   * the global list: a global holder must not see a legacy-only-domain control
   * at an org whose ``PermissionGroup`` does not carry it, because the backend
   * (``HasOrgPerm``) would refuse it (finding H2).
   */
  hasPermission: (permission: PermissionEnum) => boolean;
}

/**
 * Active organization selection, backed by the active-org store.
 *
 * Owns *validation*: the store holds what the user chose, and derives the
 * effective id from the organizations passed here. Consumers can rely on
 * ``activeOrg`` alone — there is no readiness flag to wait on. ``undefined``
 * organizations mean the list is not known yet, which keeps the remembered id in
 * play instead of treating the user as belonging to nothing.
 *
 * This hook is the ORG-SCOPED gate only.  ``hasPermission`` checks the active
 * org's EFFECTIVE entry, never a global list: org entries are enforcement-
 * honest (the backend folds the global tier in only where it is enforceable at
 * any org — grant-only/dual domains — and adds the org-scoped
 * grant/delegated/legacy arms), so an org-scoped control must be gated on the
 * active org's entry alone.  Unioning the user's global permissions in would
 * show legacy-only-domain controls (member management, reports — still
 * enforced per org by ``HasOrgPerm`` → org ``PermissionGroup`` rows) to a
 * global holder with no group at the active org, and the backend would refuse
 * them (ADR 0001 §5.2, finding H2).  Global-tier (non-org) gating is the user
 * provider's job — ``currentUser.permissions`` (ADR 0001, finding F24).
 *
 * Permission boundary: org ``permissions`` are raw backend ``app.codename``
 * strings, filtered through ``isPermission`` (the runtime mirror of
 * ``PermissionEnum``) before they become gateable — an unknown backend
 * permission can never satisfy ``hasPermission``.  The orgs exposed on the
 * state (``activeOrg``/``organizations``) are sanitized the same way, so their
 * ``permissions`` hold only modeled permissions.
 */
export function useActiveOrgState(
  organizations: Org[] | undefined,
): ActiveOrgState {
  // Exposed orgs carry only the permissions the frontend models: raw backend
  // ``app.codename`` strings are filtered once here, so ``activeOrg`` and
  // ``organizations`` never leak a permission ``hasPermission`` cannot check.
  const cleanOrgs = useMemo(
    () =>
      (organizations ?? []).map((org) => ({
        ...org,
        permissions: (org.permissions ?? []).filter(isPermission),
      })),
    [organizations],
  );

  // The store derives the id — the remembered one if the user still belongs to
  // it, otherwise their first organization — so this is where it learns who the
  // user belongs to. `undefined` means "not known yet", which is not the same as
  // belonging to nothing: requests keep the remembered id in that window rather
  // than going out unattributed.
  //
  // In a layout effect because a query issued from a child's *passive* effect has
  // to see it, and layout effects all run before any of those. The write is
  // legal here (an effect, not a render) and the store notifies only if the
  // derived id actually moved.
  useLayoutEffect(() => {
    configureActiveOrgSource(
      organizations === undefined ? () => null : () => cleanOrgs,
    );
  }, [organizations, cleanOrgs]);

  // Forget the list on unmount: a request from a session that is on its way out
  // must not derive an organization from the one that just left.
  useEffect(() => () => configureActiveOrgSource(() => null), []);

  // No reconciliation: the store derives the id from the same two inputs this
  // hook renders from, so a stale remembered id simply reads as the first
  // organization, here and in the request header alike. Choosing one is
  // `setActiveOrgId`.
  const activeOrgId = useSyncExternalStore(
    subscribeActiveOrgId,
    getActiveOrgId,
    getActiveOrgId,
  );

  const activeOrg = useMemo(
    () => cleanOrgs.find((o) => o.id === activeOrgId),
    [cleanOrgs, activeOrgId],
  );

  const setActiveOrgId = useCallback(
    (orgId: string) => {
      if (cleanOrgs.some((o) => o.id === orgId)) commitActiveOrgId(orgId);
    },
    [cleanOrgs],
  );

  const permSet = useMemo(
    () => new Set((activeOrg?.permissions ?? []).filter(isPermission)),
    [activeOrg?.permissions],
  );

  const hasPermission = useCallback(
    (permission: PermissionEnum): boolean => permSet.has(permission),
    [permSet],
  );

  return useMemo(
    () => ({
      activeOrg,
      organizations: cleanOrgs,
      setActiveOrgId,
      hasPermission,
    }),
    [activeOrg, cleanOrgs, setActiveOrgId, hasPermission],
  );
}
