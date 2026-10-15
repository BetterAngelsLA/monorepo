import { useQuery } from '@apollo/client/react';
import { getActiveOrgId, subscribeActiveOrgId } from '@monorepo/ba-platform';
import type { OffsetPaginationInput } from '@monorepo/ba-platform/types';
import { useSyncExternalStore } from 'react';
import {
  TeamsDocument,
  TeamsQuery,
  TeamsQueryVariables,
} from './__generated__/teams.generated';

type UseOrgTeamsOptions = {
  limit?: number;
  offset?: number;
  isActive?: boolean | null;
};

/**
 * Fetch teams for the active organization.
 *
 * The org travels in the ``organizationId`` filter — the request header is
 * retired (DEV-2566) — read from the active-org store: the same value the UI
 * shows, so the query can never run against a stale organization.
 *
 * Passes a high default limit (10000) to ensure all teams are available
 * in dropdowns and selects. Handles loading and error states internally.
 *
 * Only fetch active teams by default.
 */
export function useOrgTeams(options: UseOrgTeamsOptions = {}) {
  const { limit = 10000, offset = 0, isActive } = options;
  const activeOrgId = useSyncExternalStore(
    subscribeActiveOrgId,
    getActiveOrgId,
    getActiveOrgId,
  );

  const pagination: OffsetPaginationInput = { limit, offset };
  const variables: TeamsQueryVariables = {
    pagination,
    filters: { isActive, organizationId: activeOrgId },
  };

  const { data, loading, error } = useQuery<TeamsQuery>(TeamsDocument, {
    variables,
    // No org to scope to yet (none remembered, or the user has none): stay
    // idle rather than issue a request the backend would deny.
    skip: !activeOrgId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    teams: data?.teams?.results ?? [],
    totalCount: data?.teams?.totalCount ?? 0,
    loading,
    error,
  };
}
