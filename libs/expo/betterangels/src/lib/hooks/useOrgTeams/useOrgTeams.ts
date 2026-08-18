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
 * The ``skip`` is not a readiness gate — the ``X-Organization-ID`` header is
 * always live by the time this runs. It covers a user who belongs to no
 * organization at all, where there is nothing to send and nothing to ask for.
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
