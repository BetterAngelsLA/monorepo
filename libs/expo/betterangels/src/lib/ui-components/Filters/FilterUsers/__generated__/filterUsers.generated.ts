import * as Types from '../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type FilterUsersQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.InteractionAuthorFilter>;
  order?: Types.InputMaybe<Types.InteractionAuthorOrder>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
}>;


export type FilterUsersQuery = { __typename?: 'Query', interactionAuthors: { __typename?: 'InteractionAuthorTypeOffsetPaginated', totalCount: number, results: Array<{ __typename?: 'InteractionAuthorType', id: string, firstName?: string | null, lastName?: string | null, middleName?: string | null }>, pageInfo: { __typename?: 'OffsetPaginationInfo', limit?: number | null, offset: number } } };


export const FilterUsersDocument = gql`
    query FilterUsers($filters: InteractionAuthorFilter, $order: InteractionAuthorOrder, $pagination: OffsetPaginationInput) {
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
 * __useFilterUsersQuery__
 *
 * To run a query within a React component, call `useFilterUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useFilterUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFilterUsersQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      order: // value for 'order'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useFilterUsersQuery(baseOptions?: Apollo.QueryHookOptions<FilterUsersQuery, FilterUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FilterUsersQuery, FilterUsersQueryVariables>(FilterUsersDocument, options);
      }
export function useFilterUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FilterUsersQuery, FilterUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FilterUsersQuery, FilterUsersQueryVariables>(FilterUsersDocument, options);
        }
export function useFilterUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FilterUsersQuery, FilterUsersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FilterUsersQuery, FilterUsersQueryVariables>(FilterUsersDocument, options);
        }
export type FilterUsersQueryHookResult = ReturnType<typeof useFilterUsersQuery>;
export type FilterUsersLazyQueryHookResult = ReturnType<typeof useFilterUsersLazyQuery>;
export type FilterUsersSuspenseQueryHookResult = ReturnType<typeof useFilterUsersSuspenseQuery>;
export type FilterUsersQueryResult = Apollo.QueryResult<FilterUsersQuery, FilterUsersQueryVariables>;