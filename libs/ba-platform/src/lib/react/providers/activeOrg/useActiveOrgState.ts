import { isPermission } from '@monorepo/ba-platform/permissions';
import type { PermissionEnum } from '@monorepo/ba-platform/permissions';

import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';

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
  // The last known list stays on screen while a refetch is in flight. Reading
  // `undefined` as "no permissions" blinked every org-scoped control — the
  // Referrals tab among them — out of existence after a mutation invalidated the
  // user query. The remaining `?? []` is for rendering only; the store is told
  // "unknown" separately, by the `null` reader below.
  const lastKnownOrgs = useRef<Org[] | undefined>(undefined);
  if (organizations !== undefined) lastKnownOrgs.current = organizations;
  const visibleOrgs = organizations ?? lastKnownOrgs.current;

  const cleanOrgs = useMemo(
    () =>
      (visibleOrgs ?? []).map((org) => ({
        ...org,
        permissions: (org.permissions ?? []).filter(isPermission),
      })),
    [visibleOrgs],
  );

  // Where the store learns who the user belongs to. The reader goes through the
  // same retained ref, so it survives the refetch window above: unloading it
  // falls the store back to the remembered *choice*, which is nothing on a fresh
  // launch, taking the derived id with it. `null` means "not known yet" —
  // deliberately distinct from `[]` ("belongs to nothing").
  //
  // A layout effect because a child's query can be issued from a passive effect
  // and has to see it. Disposed from the cleanup, so an unmounting or changing
  // provider restores whatever sits beneath it.
  useLayoutEffect(() => {
    // Nothing known yet and nothing remembered: leave the slot alone so an outer
    // provider's list stays in play. Once this provider has seen a list, its
    // reader answers with the last known one instead.
    if (lastKnownOrgs.current === undefined) return;

    return pushActiveOrgSource(() => lastKnownOrgs.current ?? null);
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
