import { useQuery } from '@apollo/client/react';
import type { OffsetPaginationInput } from '@monorepo/ba-platform/types';
import {
  TaskAssigneesDocument,
  TaskAssigneesQuery,
} from './__generated__/taskAssignees.generated';

type UseTaskAssigneesOptions = {
  limit?: number;
  offset?: number;
};

/**
 * Fetch the org members a task can be assigned to.
 *
 * Passes a high default limit (10000) so the assignee select always holds the
 * full roster — the same convention as `useOrgTeams` — because a picker that
 * silently truncates would hide a colleague from the user.
 */
export function useTaskAssignees(options: UseTaskAssigneesOptions = {}) {
  const { limit = 10000, offset = 0 } = options;

  const pagination: OffsetPaginationInput = { limit, offset };

  const { data, loading, error } = useQuery<TaskAssigneesQuery>(
    TaskAssigneesDocument,
    {
      variables: { pagination },
      fetchPolicy: 'cache-and-network',
    },
  );

  return {
    assignees: data?.taskAssignees?.results ?? [],
    totalCount: data?.taskAssignees?.totalCount ?? 0,
    loading,
    error,
  };
}
