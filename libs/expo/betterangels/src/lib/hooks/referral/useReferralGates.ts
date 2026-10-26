import { useActiveOrg } from '@monorepo/ba-platform';
import { ReferralPermissions } from '@monorepo/ba-platform/permissions';
import { useMemo } from 'react';

/**
 * The referral actions this session may use, from the active org's effective
 * permissions (ADR 0001 §5.2). This is the single source of truth for both the
 * tab strip and the referrals screen; consumers never recompute it.
 */
export type ReferralGates = Readonly<{
  canView: boolean;
  canCreate: boolean;
  canChange: boolean;
}>;

export function useActiveReferralGates(): ReferralGates {
  const { hasPermission } = useActiveOrg();
  return useMemo(
    () => ({
      canView: hasPermission(ReferralPermissions.View),
      canCreate: hasPermission(ReferralPermissions.Add),
      canChange: hasPermission(ReferralPermissions.Change),
    }),
    [hasPermission],
  );
}
