import { useActiveOrg } from '@monorepo/ba-platform';
import { ReferralPermissions } from '@monorepo/ba-platform/permissions';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * The referral actions this session may use. `hasPermission` is the org-scoped
 * gate from the active-organization provider (ADR 0001 §5.2): a permission the
 * active org does not grant is never satisfied by a global one.
 */
export type ReferralGates = Readonly<{
  canView: boolean;
  canCreate: boolean;
  canChange: boolean;
}>;

/**
 * Permissive default for tests and for surfaces that are reached only after a
 * real gate (the tab itself). The app path always supplies the provider below.
 */
const ALLOWED: ReferralGates = {
  canView: true,
  canCreate: true,
  canChange: true,
};

const ReferralGatesContext = createContext<ReferralGates>(ALLOWED);

export function ReferralPermissionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { hasPermission } = useActiveOrg();
  const gates = useMemo<ReferralGates>(
    () => ({
      canView: hasPermission(ReferralPermissions.View),
      canCreate: hasPermission(ReferralPermissions.Add),
      canChange: hasPermission(ReferralPermissions.Change),
    }),
    [hasPermission],
  );
  return (
    <ReferralGatesContext.Provider value={gates}>
      {children}
    </ReferralGatesContext.Provider>
  );
}

export function useReferralPermissions(): ReferralGates {
  return useContext(ReferralGatesContext);
}
