import {
  localStorageAdapter,
  type StorageAdapter,
} from '@monorepo/react/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { flat, pipe, values } from 'remeda';

import { DEFAULT_ORG_STORAGE_KEY } from '../../../constants';
import type { CurrentOrgUserQuery } from '../../apollo/user/__generated__/UserProvider.generated';

/** Organization type derived from the canonical org query. */
export type BaseOrg = NonNullable<
  NonNullable<CurrentOrgUserQuery['currentUser']>['organizations']
>[number];

interface UseActiveOrgStateOptions {
  /** Storage adapter — defaults to :const:`localStorageAdapter`. */
  storage?: StorageAdapter;
  /** Storage key — defaults to ``'betterangels_active_org_id'``. */
  storageKey?: string;
}

export interface ActiveOrgState<TOrg extends BaseOrg = BaseOrg> {
  /** The currently selected organization (with its capabilities). */
  activeOrg: TOrg | undefined;
  /** All organizations the user has access to. */
  organizations: TOrg[];
  /** Switch to a different org by its id. */
  setActiveOrgId: (orgId: string) => void;
  /** Check if the active org has a specific permission. */
  hasPermission: <P extends string>(permission: P) => boolean;
}

/**
 * Shared state management for active organization selection.
 *
 * Handles storage persistence, default selection, and re-validation
 * when the organizations list changes.  Each app wraps the returned
 * state in its own React context (with its own ``PermissionEnum`` type)
 * via a thin ``ActiveOrgProvider`` component.
 *
 * @param organizations  List of orgs the current user belongs to.
 * @param options  Optional storage adapter and key overrides.
 */
export function useActiveOrgState<TOrg extends BaseOrg = BaseOrg>(
  organizations: TOrg[],
  options: UseActiveOrgStateOptions = {}
): ActiveOrgState<TOrg> {
  const {
    storage = localStorageAdapter,
    storageKey = DEFAULT_ORG_STORAGE_KEY,
  } = options;

  const [activeOrgId, setActiveOrgIdState] = useState<string | undefined>(
    () => {
      try {
        const stored = storage.getItem(storageKey) as string | null;
        if (stored && organizations.some((o) => o.id === stored)) {
          return stored;
        }
      } catch {
        // storage may be unavailable
      }
      return organizations[0]?.id;
    }
  );

  // Persist the active org ID to storage so that orgLink (Apollo link)
  // can attach the X-Organization-ID header on every GraphQL request.
  useEffect(() => {
    if (activeOrgId) {
      try {
        storage.setItem(storageKey, activeOrgId);
      } catch {
        // storage may be unavailable
      }
    }
  }, [activeOrgId, storage, storageKey]);

  // Re-validate when the organizations list changes (e.g. after async load)
  useEffect(() => {
    if (activeOrgId && organizations.some((o) => o.id === activeOrgId)) {
      return;
    }
    try {
      const stored = storage.getItem(storageKey) as string | null;
      if (stored && organizations.some((o) => o.id === stored)) {
        setActiveOrgIdState(stored);
        return;
      }
    } catch {
      // storage may be unavailable
    }
    setActiveOrgIdState(organizations[0]?.id);
    if (organizations[0]?.id) {
      try {
        storage.setItem(storageKey, organizations[0].id);
      } catch {
        // storage may be unavailable
      }
    }
    // Intentionally omitting activeOrgId from deps to avoid a re-validation
    // loop: this effect only needs to run when the organizations list changes
    // (e.g. after the user query loads), not on every activeOrgId update.
  }, [organizations, storage, storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeOrg = useMemo(
    () => organizations.find((o) => o.id === activeOrgId) ?? organizations[0],
    [organizations, activeOrgId]
  );

  const setActiveOrgId = useCallback(
    (orgId: string) => {
      if (organizations.some((o) => o.id === orgId)) {
        setActiveOrgIdState(orgId);
        try {
          storage.setItem(storageKey, orgId);
        } catch {
          // storage may be unavailable
        }
      }
    },
    [organizations, storage, storageKey]
  );

  const hasPermission = useCallback(
    <P extends string>(permission: P): boolean =>
      activeOrg?.permissions != null &&
      pipe(activeOrg.permissions, values(), flat(), (arr) =>
        (arr as string[]).includes(permission)
      ),
    [activeOrg]
  );

  return useMemo(
    () => ({ activeOrg, organizations, setActiveOrgId, hasPermission }),
    [activeOrg, organizations, setActiveOrgId, hasPermission]
  );
}
