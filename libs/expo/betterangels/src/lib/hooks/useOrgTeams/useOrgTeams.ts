import { useQuery } from '@apollo/client/react';
import { useActiveOrg } from '@monorepo/ba-platform';
import type { OffsetPaginationInput } from '@monorepo/ba-platform/types';
import { TeamsDocument, TeamsQuery } from './__generated__/teams.generated';

type UseOrgTeamsOptions = {
  limit?: number;
  offset?: number;
};

/**
 * Fetch teams for the active organization.
 *
 * Teams are org-scoped and the server resolves the organization from the
 * ``X-Organization-ID`` header, which is always present by the time this runs —
 * the active org is published to a synchronously-written store before any
 * component renders, so there is no readiness flag to wait on.
 *
 * The one case worth skipping is a user who belongs to no organization at all:
 * there is no header to send and the server would rightly refuse, so asking is
 * a wasted round trip that surfaces as an error.
 *
 * Passes a high default limit (10000) to ensure all teams are available
 * in dropdowns and selects. Handles loading and error states internally.
 */
export function useOrgTeams(options: UseOrgTeamsOptions = {}) {
  const { limit = 10000, offset = 0 } = options;

  const pagination: OffsetPaginationInput = { limit, offset };

  const { activeOrg } = useActiveOrg();

  const { data, loading, error } = useQuery<TeamsQuery>(TeamsDocument, {
    variables: { pagination },
    fetchPolicy: 'cache-and-network',
    skip: !activeOrg,
  });

  return {
    teams: data?.teams?.results ?? [],
    totalCount: data?.teams?.totalCount ?? 0,
    loading,
    error,
  };
}
