import { createContext, useContext, type ReactNode } from 'react';
import {
  useActiveReferralGates,
  type ReferralGates,
} from '../../../hooks/referral/useReferralGates';

export type { ReferralGates } from '../../../hooks/referral/useReferralGates';

/**
 * Fail-closed by design: there is no default value. A surface that renders
 * referral actions without the provider throws instead of silently allowing
 * them, which is what the previous permissive default did.
 */
const ReferralGatesContext = createContext<ReferralGates | null>(null);

export function ReferralPermissionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const gates = useActiveReferralGates();
  return (
    <ReferralGatesContext.Provider value={gates}>
      {children}
    </ReferralGatesContext.Provider>
  );
}

export function useReferralPermissions(): ReferralGates {
  const gates = useContext(ReferralGatesContext);
  if (!gates)
    throw new Error(
      'useReferralPermissions must be used within ReferralPermissionsProvider',
    );
  return gates;
}
