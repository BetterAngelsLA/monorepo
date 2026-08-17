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
 * Waits for the active org before querying: teams are org-scoped and the
 * server requires the ``X-Organization-ID`` header rather than guessing, so
 * firing before ``ActiveOrgProvider`` has selected one would just error.
 * Reports ``loading`` while waiting so callers do not render "no teams".
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
    skip: !activeOrg?.id,
  });

  return {
    teams: data?.teams?.results ?? [],
    totalCount: data?.teams?.totalCount ?? 0,
    loading: loading || !activeOrg?.id,
    error,
  };
}
