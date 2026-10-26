import { skipToken, useQuery } from '@apollo/client/react';
import { useActiveOrgId } from '@monorepo/ba-platform';
import type { OffsetPaginationInput } from '@monorepo/ba-platform/types';
import { TeamsDocument, TeamsQuery } from './__generated__/teams.generated';

/** All the teams a picker offers; the list is org-scoped and never paginates. */
const PAGINATION: OffsetPaginationInput = { limit: 10000, offset: 0 };

/**
 * Fetch the active organization's teams.
 *
 * The org travels in the ``organizationId`` filter, read from the same
 * active-org store the UI renders, so a screen cannot list one org's teams
 * while showing another's.
 *
 * With no active org there is nothing to ask about: the query is skipped and
 * ``isIdle`` says so, so a picker can prompt for an organization instead of
 * showing an empty list.
 */
export function useOrgTeams() {
  const activeOrgId = useActiveOrgId();

  // The variables are constructed only when there is an org, so no call can
  // send `organizationId: null` — the shape the backend reads as "no filter".
  const { data, loading, error } = useQuery<TeamsQuery>(
    TeamsDocument,
    activeOrgId
      ? {
          variables: {
            pagination: PAGINATION,
            filters: { organizationId: activeOrgId },
          },
          fetchPolicy: 'cache-and-network',
        }
      : skipToken,
  );

  return {
    teams: data?.teams?.results ?? [],
    totalCount: data?.teams?.totalCount ?? 0,
    loading,
    isIdle: activeOrgId === null,
    error,
  };
}
