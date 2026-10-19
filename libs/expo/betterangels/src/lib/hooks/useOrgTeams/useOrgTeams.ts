import { skipToken, useQuery } from '@apollo/client/react';
import { useActiveOrgId } from '@monorepo/ba-platform';
import type { OffsetPaginationInput } from '@monorepo/ba-platform/types';
import { TeamsDocument, TeamsQuery } from './__generated__/teams.generated';

/**
 * One page large enough that the dropdowns never paginate.
 *
 * The list is org-scoped, so this is bounded in practice; the number is a
 * guard, not a contract.
 */
const PAGINATION: OffsetPaginationInput = { limit: 10000, offset: 0 };

/**
 * Fetch the active organization's teams.
 *
 * The org travels in the ``organizationId`` filter, read from the active-org
 * store — the same value the UI shows, so a screen cannot list one org's teams
 * while showing another's. The ``X-Organization-ID`` header is still sent by the
 * interceptor and is being retired (#2450); until it lands, the backend prefers
 * this filter and falls back to the header only for builds that send none.
 *
 * With no active org there is nothing to ask about: the query is skipped rather
 * than issued with a missing org (which the backend denies, and which would
 * fall back to the header — the ambiguity #2450 removes). ``isIdle`` says so,
 * so a picker can prompt for an organization instead of showing an empty list.
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
