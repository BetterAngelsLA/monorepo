import { useQuery } from '@apollo/client/react';
import type { OffsetPaginationInput } from '@monorepo/ba-platform/types';
import { TeamsDocument, TeamsQuery } from './__generated__/teams.generated';

type UseOrgTeamsOptions = {
  limit?: number;
  offset?: number;
  isActive?: boolean | null;
};

/**
 * Fetch teams for the active organization.
 *
 * Passes a high default limit (10000) to ensure all teams are available
 * in dropdowns and selects. Handles loading and error states internally.
 *
 * Only fetch active teams by default.
 */
export function useOrgTeams(options: UseOrgTeamsOptions = {}) {
  const { limit = 10000, offset = 0, isActive } = options;

  const pagination: OffsetPaginationInput = { limit, offset };

  const { data, loading, error } = useQuery<TeamsQuery>(TeamsDocument, {
    variables: { pagination, filters: { isActive } },
    fetchPolicy: 'cache-and-network',
  });

  return {
    teams: data?.teams?.results ?? [],
    totalCount: data?.teams?.totalCount ?? 0,
    loading,
    error,
  };
}
