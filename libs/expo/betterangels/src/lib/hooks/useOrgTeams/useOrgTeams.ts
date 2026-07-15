import { useQuery } from '@apollo/client/react';
import type { OffsetPaginationInput } from '@monorepo/ba-platform/types';
import { TeamsDocument, TeamsQuery } from './__generated__/teams.generated';

type UseOrgTeamsOptions = {
  limit?: number;
  offset?: number;
};

/**
 * Fetch teams for the active organization.
 *
 * Passes a high default limit (10000) to ensure all teams are available
 * in dropdowns and selects. Handles loading and error states internally.
 */
export function useOrgTeams(options: UseOrgTeamsOptions = {}) {
  const { limit = 10000, offset = 0 } = options;

  const pagination: OffsetPaginationInput = { limit, offset };

  const { data, loading, error } = useQuery<TeamsQuery>(TeamsDocument, {
    variables: { pagination },
    fetchPolicy: 'cache-and-network',
  });

  return {
    teams: data?.teams?.results ?? [],
    totalCount: data?.teams?.totalCount ?? 0,
    loading,
    error,
  };
}
