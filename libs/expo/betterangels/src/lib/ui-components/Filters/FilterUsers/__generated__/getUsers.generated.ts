import * as Types from '../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetUsersQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.InteractionAuthorFilter>;
  order?: Types.InputMaybe<Types.InteractionAuthorOrder>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
}>;


export type GetUsersQuery = { __typename?: 'Query', interactionAuthors: { __typename?: 'InteractionAuthorTypeOffsetPaginated', totalCount: number, results: Array<{ __typename?: 'InteractionAuthorType', id: string, firstName?: string | null, lastName?: string | null, middleName?: string | null }>, pageInfo: { __typename?: 'OffsetPaginationInfo', limit?: number | null, offset: number } } };


export const GetUsersDocument = gql`
    query GetUsers($filters: InteractionAuthorFilter, $order: InteractionAuthorOrder, $pagination: OffsetPaginationInput) {
  interactionAuthors(filters: $filters, order: $order, pagination: $pagination) {
    totalCount
    results {
      id
      firstName
      lastName
      middleName
    }
    pageInfo {
      limit
      offset
    }
  }
}
    `;

/**
 * __useGetUsersQuery__
 *
 * To run a query within a React component, call `useGetUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUsersQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      order: // value for 'order'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useGetUsersQuery(baseOptions?: Apollo.QueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
      }
export function useGetUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
        }
export function useGetUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
        }
export type GetUsersQueryHookResult = ReturnType<typeof useGetUsersQuery>;
export type GetUsersLazyQueryHookResult = ReturnType<typeof useGetUsersLazyQuery>;
export type GetUsersSuspenseQueryHookResult = ReturnType<typeof useGetUsersSuspenseQuery>;
export type GetUsersQueryResult = Apollo.QueryResult<GetUsersQuery, GetUsersQueryVariables>;