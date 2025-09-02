import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type TaskSummaryQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type TaskSummaryQuery = { __typename?: 'Query', task: { __typename?: 'TaskType', id: string, summary?: string | null, description?: string | null, status?: Types.TaskStatusEnum | null, team?: Types.SelahTeamEnum | null, createdAt: any, updatedAt: any, organization?: { __typename?: 'OrganizationType', id: string, name: string } | null, clientProfile?: { __typename?: 'ClientProfileType', id: string, firstName?: string | null, lastName?: string | null, profilePhoto?: { __typename?: 'DjangoImageType', name: string, url: string } | null } | null, createdBy: { __typename?: 'UserType', id: string, firstName?: string | null, lastName?: string | null } } };


export const TaskSummaryDocument = gql`
    query TaskSummary($id: ID!) {
  task(pk: $id) {
    ... on TaskType {
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
 * __useTaskSummaryQuery__
 *
 * To run a query within a React component, call `useTaskSummaryQuery` and pass it any options that fit your needs.
 * When your component renders, `useTaskSummaryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTaskSummaryQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useTaskSummaryQuery(baseOptions: Apollo.QueryHookOptions<TaskSummaryQuery, TaskSummaryQueryVariables> & ({ variables: TaskSummaryQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TaskSummaryQuery, TaskSummaryQueryVariables>(TaskSummaryDocument, options);
      }
export function useTaskSummaryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TaskSummaryQuery, TaskSummaryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TaskSummaryQuery, TaskSummaryQueryVariables>(TaskSummaryDocument, options);
        }
export function useTaskSummarySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TaskSummaryQuery, TaskSummaryQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TaskSummaryQuery, TaskSummaryQueryVariables>(TaskSummaryDocument, options);
        }
export type TaskSummaryQueryHookResult = ReturnType<typeof useTaskSummaryQuery>;
export type TaskSummaryLazyQueryHookResult = ReturnType<typeof useTaskSummaryLazyQuery>;
export type TaskSummarySuspenseQueryHookResult = ReturnType<typeof useTaskSummarySuspenseQuery>;
export type TaskSummaryQueryResult = Apollo.QueryResult<TaskSummaryQuery, TaskSummaryQueryVariables>;