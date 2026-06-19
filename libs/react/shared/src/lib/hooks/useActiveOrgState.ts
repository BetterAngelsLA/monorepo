import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Shared hook for managing the "active organization" selection persisted
 * in ``localStorage``.  Used by the admin and operator ``ActiveOrgProvider``
 * wrappers so the state logic is defined once.
 *
 * Keeps :func:`setActiveOrgId` in sync so the Apollo ``orgLink`` always
 * sends the correct ``X-Organization-ID`` header.
 */
export function useActiveOrgState<TOrg extends { id: string }>({
  organizations,
  storageKey,
}: {
  organizations: TOrg[];
  storageKey: string;
}) {
  const [activeOrgId, setActiveOrgIdState] = useState<string | undefined>(
    () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored && organizations.some((o) => o.id === stored)) {
          return stored;
        }
        // Stored org is stale — clear it and persist the fallback
        if (stored) {
          localStorage.removeItem(storageKey);
        }
        const fallback = organizations[0]?.id;
        if (fallback) {
          localStorage.setItem(storageKey, fallback);
        }
        return fallback;
      } catch {
        // localStorage may be unavailable (SSR / test environments).
      }
      return organizations[0]?.id;
    }
  );

  // Re-validate when the organizations list changes (e.g. after async load).
  useEffect(() => {
    if (activeOrgId && organizations.some((o) => o.id === activeOrgId)) {
      return; // current selection is still valid
    }
    const fallbackId = organizations[0]?.id;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && organizations.some((o) => o.id === stored)) {
        setActiveOrgIdState(stored);
        // Sync localStorage in case a previous fallback wrote a stale value
        if (stored !== localStorage.getItem(storageKey)) {
          localStorage.setItem(storageKey, stored);
        }
        return;
      }
      // Stored org is invalid — clear it and fall back to the first org
      if (stored) {
        localStorage.removeItem(storageKey);
      }
      if (fallbackId) {
        localStorage.setItem(storageKey, fallbackId);
      }
    } catch {
      // localStorage may be unavailable.
    }
    setActiveOrgIdState(fallbackId);
    // Only re-run when the organizations list changes — not on every
    // activeOrgId update (avoids a re-validation loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizations]);

  const activeOrg = useMemo(
    () => organizations.find((o) => o.id === activeOrgId) ?? organizations[0],
    [organizations, activeOrgId]
  );

  const setActiveOrgId = useCallback(
    (orgId: string) => {
      if (organizations.some((o) => o.id === orgId)) {
        setActiveOrgIdState(orgId);
        try {
          localStorage.setItem(storageKey, orgId);
        } catch {
          // localStorage may be unavailable.
        }
      }
    },
    [organizations, storageKey]
  );

  return { activeOrg, setActiveOrgId, activeOrgId };
}
