import { useQuery } from '@apollo/client/react';
import { TaskFilter } from '../../apollo';
import { TaskCountDocument } from './__generated__/taskCount.generated';

type TProps = {
  filters?: TaskFilter;
};

export function useTaskCount(props: TProps) {
  const { filters } = props;

  const { data, error, loading } = useQuery(TaskCountDocument, {
    variables: {
      filters: filters ?? undefined,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  if (error) {
    console.error('useTaskCount:', error);

    return { taskCount: undefined, loading: false };
  }

  return { taskCount: data?.tasks.totalCount, loading };
}
