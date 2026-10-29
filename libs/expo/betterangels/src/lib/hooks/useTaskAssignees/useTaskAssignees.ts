import { useQuery } from '@apollo/client/react';
import type { OffsetPaginationInput } from '@monorepo/ba-platform/types';
import {
  TaskAssigneesDocument,
  TaskAssigneesQuery,
} from './__generated__/taskAssignees.generated';

type UseTaskAssigneesOptions = {
  limit?: number;
  offset?: number;
  /** Narrows the roster to the org the task belongs to, when the caller knows it. */
  organizationId?: string | null;
  /** Defer the request until the picker is first opened. */
  skip?: boolean;
};

/**
 * Fetch the org members a task can be assigned to.
 *
 * Passes a high default limit (10000) so the assignee select always holds the
 * full roster — the same convention as `useOrgTeams` — because a picker that
 * silently truncates would hide a colleague from the user.
 *
 * `cache-first` because the roster rarely changes: revalidating it on every
 * task sheet open was paying a full roster fetch to redraw the same six rows.
 */
export function useTaskAssignees(options: UseTaskAssigneesOptions = {}) {
  const { limit = 10000, offset = 0, organizationId, skip = false } = options;

  const pagination: OffsetPaginationInput = { limit, offset };

  const { data, loading, error } = useQuery<TaskAssigneesQuery>(
    TaskAssigneesDocument,
    {
      variables: {
        pagination,
        filters: organizationId ? { organization: organizationId } : undefined,
      },
      fetchPolicy: 'cache-first',
      skip,
    },
  );

  return {
    assignees: data?.taskAssignees?.results ?? [],
    totalCount: data?.taskAssignees?.totalCount ?? 0,
    loading,
    error,
  };
}
