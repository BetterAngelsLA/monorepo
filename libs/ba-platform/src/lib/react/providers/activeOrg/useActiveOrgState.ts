import type { PermissionEnum } from '@monorepo/ba-permissions';

import {
  localStorageAdapter,
  type StorageAdapter,
} from '@monorepo/react/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DEFAULT_ORG_STORAGE_KEY } from '../../../constants';

/** Minimal org shape consumed by the active-org state. */
export interface Org {
  id: string;
  name: string;
  permissions: readonly string[];
}

interface UseActiveOrgStateOptions {
  /** Storage adapter — defaults to :const:`localStorageAdapter`. */
  storage?: StorageAdapter;
  /** Storage key — defaults to ``'betterangels_active_org_id'``. */
  storageKey?: string;
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
 * Shared state management for active organization selection.
 */
export function useActiveOrgState(
  organizations: Org[],
  options: UseActiveOrgStateOptions = {}
): ActiveOrgState {
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

  const permSet = useMemo(
    () => new Set(activeOrg?.permissions ?? []),
    [activeOrg?.permissions]
  );

  const hasPermission = useCallback(
    (permission: PermissionEnum): boolean => permSet.has(permission),
    [permSet]
  );

  return useMemo(
    () => ({ activeOrg, organizations, setActiveOrgId, hasPermission }),
    [activeOrg, organizations, setActiveOrgId, hasPermission]
  );
}
