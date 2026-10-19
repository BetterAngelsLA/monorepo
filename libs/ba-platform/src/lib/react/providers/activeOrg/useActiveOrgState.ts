import { isPermission } from '@monorepo/ba-platform/permissions';
import type { PermissionEnum } from '@monorepo/ba-platform/permissions';

import { useCallback, useLayoutEffect, useMemo } from 'react';

import {
  pushActiveOrgSource,
  setActiveOrgId as commitActiveOrgId,
} from '../../../activeOrg';

import { useActiveOrgId } from './useActiveOrgId';

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
   * Whether the ACTIVE ORG can exercise *permission* — the org-scoped gate. It
   * deliberately does not consult the global list; see ``useActiveOrgState`` for
   * why.
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
  //
  // The `?? []` is for *rendering* only — it does not decide the "list not loaded
  // yet" case. The store is never handed this array while the list is unknown:
  // the effect below pushes no source in that state. Keep both halves of that:
  // pushing an empty list would read as "belongs to nothing" and would also
  // shadow an outer provider's list, which is what keeps requests attributed
  // during a refetch. Pinned by the "before the organization list is known",
  // "before the org list loads" and "genuinely org-less user" tests.
  const cleanOrgs = useMemo(
    () =>
      (organizations ?? []).map((org) => ({
        ...org,
        permissions: (org.permissions ?? []).filter(isPermission),
      })),
    [organizations],
  );

  // This is where the store learns who the user belongs to. `undefined` means
  // "not known yet", which is not the same as belonging to nothing: requests keep
  // the remembered id in that window rather than going out unattributed.
  //
  // A layout effect because a query issued from a child's passive effect has to
  // see it, and layout effects all run before any of those. The push is legal
  // here (an effect, not a render).
  //
  // Disposed from the cleanup, so an unmounting (or changing) provider restores
  // whatever was installed beneath it — nesting is real: shelter-web mounts one
  // provider around the app and another inside it on /operator.
  useLayoutEffect(() => {
    // Nothing to contribute while the list is unknown: leaving the slot alone
    // lets an outer provider's list stay in play, which is what keeps requests
    // attributed during a refetch.
    if (organizations === undefined) return;

    return pushActiveOrgSource(() => cleanOrgs);
  }, [organizations, cleanOrgs]);

  // No reconciliation: the store derives the id from the same two inputs this
  // hook renders from, so a stale remembered id reads as the first organization
  // here and in the query payload alike. Choosing one is `setActiveOrgId`.
  const activeOrgId = useActiveOrgId();

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

  // Already filtered by ``cleanOrgs`` above.
  const permSet = useMemo(
    () => new Set(activeOrg?.permissions ?? []),
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
