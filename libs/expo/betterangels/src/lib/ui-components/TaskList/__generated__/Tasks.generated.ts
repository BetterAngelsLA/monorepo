import * as Types from '../../../apollo/graphql/__generated__/types';

import * as Apollo from '@apollo/client';
import { gql } from '@apollo/client';
const defaultOptions = {} as const;

export type TasksQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.TaskFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  ordering?: Array<Types.TaskOrder> | Types.TaskOrder;
}>;

export type TasksQuery = {
  __typename?: 'Query';
  tasks: {
    __typename?: 'TaskTypeOffsetPaginated';
    totalCount: number;
    pageInfo: {
      __typename?: 'OffsetPaginationInfo';
      limit?: number | null;
      offset: number;
    };
    results: Array<{
      __typename?: 'TaskType';
      id: string;
      summary?: string | null;
      description?: string | null;
      status?: Types.TaskStatusEnum | null;
      team?: Types.SelahTeamEnum | null;
      createdAt: any;
      updatedAt: any;
      organization?: {
        __typename?: 'OrganizationType';
        id: string;
        name: string;
      } | null;
      clientProfile?: {
        __typename?: 'ClientProfileType';
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        profilePhoto?: {
          __typename?: 'DjangoImageType';
          name: string;
          url: string;
        } | null;
      } | null;
      createdBy: {
        __typename?: 'UserType';
        id: string;
        firstName?: string | null;
        lastName?: string | null;
      };
    }>;
  };
};

export const TasksDocument = gql`
  query Tasks(
    $filters: TaskFilter
    $pagination: OffsetPaginationInput
    $ordering: [TaskOrder!]! = []
  ) {
    tasks(filters: $filters, pagination: $pagination, ordering: $ordering) {
      totalCount
      pageInfo {
        limit
        offset
      }
      results {
        id
        summary
        description
        status
        team
        organization {
          id
          name
        }
        clientProfile {
          id
          firstName
          lastName
          profilePhoto {
            name
            url
          }
        }
        createdBy {
          id
          firstName
          lastName
        }
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * __useTasksQuery__
 *
 * To run a query within a React component, call `useTasksQuery` and pass it any options that fit your needs.
 * When your component renders, `useTasksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTasksQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      pagination: // value for 'pagination'
 *      ordering: // value for 'ordering'
 *   },
 * });
 */
export function useTasksQuery(
  baseOptions?: Apollo.QueryHookOptions<TasksQuery, TasksQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<TasksQuery, TasksQueryVariables>(
    TasksDocument,
    options
  );
}
export function useTasksLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<TasksQuery, TasksQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<TasksQuery, TasksQueryVariables>(
    TasksDocument,
    options
  );
}
export function useTasksSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<TasksQuery, TasksQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<TasksQuery, TasksQueryVariables>(
    TasksDocument,
    options
  );
}
export type TasksQueryHookResult = ReturnType<typeof useTasksQuery>;
export type TasksLazyQueryHookResult = ReturnType<typeof useTasksLazyQuery>;
export type TasksSuspenseQueryHookResult = ReturnType<
  typeof useTasksSuspenseQuery
>;
export type TasksQueryResult = Apollo.QueryResult<
  TasksQuery,
  TasksQueryVariables
>;
