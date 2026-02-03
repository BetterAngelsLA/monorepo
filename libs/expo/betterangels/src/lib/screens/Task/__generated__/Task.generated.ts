import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type TaskQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type TaskQuery = { __typename?: 'Query', task: { __typename?: 'TaskType', id: string, summary?: string | null, description?: string | null, status?: Types.TaskStatusEnum | null, team?: Types.SelahTeamEnum | null, createdAt: any, updatedAt: any, organization?: { __typename?: 'OrganizationType', id: string, name: string } | null, clientProfile?: { __typename?: 'ClientProfileType', id: string, firstName?: string | null, lastName?: string | null, profilePhoto?: { __typename?: 'DjangoImageType', name: string, url: string } | null } | null, createdBy: { __typename?: 'UserType', id: string, firstName?: string | null, lastName?: string | null } } };


export const TaskDocument = gql`
    query Task($id: ID!) {
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
 * __useTaskQuery__
 *
 * To run a query within a React component, call `useTaskQuery` and pass it any options that fit your needs.
 * When your component renders, `useTaskQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTaskQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useTaskQuery(baseOptions: Apollo.QueryHookOptions<TaskQuery, TaskQueryVariables> & ({ variables: TaskQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TaskQuery, TaskQueryVariables>(TaskDocument, options);
      }
export function useTaskLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TaskQuery, TaskQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TaskQuery, TaskQueryVariables>(TaskDocument, options);
        }
export function useTaskSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TaskQuery, TaskQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TaskQuery, TaskQueryVariables>(TaskDocument, options);
        }
export type TaskQueryHookResult = ReturnType<typeof useTaskQuery>;
export type TaskLazyQueryHookResult = ReturnType<typeof useTaskLazyQuery>;
export type TaskSuspenseQueryHookResult = ReturnType<typeof useTaskSuspenseQuery>;
export type TaskQueryResult = Apollo.QueryResult<TaskQuery, TaskQueryVariables>;