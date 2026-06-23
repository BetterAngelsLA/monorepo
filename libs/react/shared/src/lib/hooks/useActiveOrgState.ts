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
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && organizations.some((o) => o.id === stored)) {
        setActiveOrgIdState(stored);
        return;
      }
    } catch {
      // localStorage may be unavailable.
    }
    setActiveOrgIdState(organizations[0]?.id);
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
