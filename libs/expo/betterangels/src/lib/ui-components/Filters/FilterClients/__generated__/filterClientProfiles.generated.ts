import * as Types from '../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type FilterClientProfilesQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.ClientProfileFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.ClientProfileOrder>;
}>;


export type FilterClientProfilesQuery = { __typename?: 'Query', clientProfiles: { __typename?: 'ClientProfileTypeOffsetPaginated', totalCount: number, results: Array<{ __typename?: 'ClientProfileType', id: string, firstName?: string | null, lastName?: string | null, middleName?: string | null, nickname?: string | null }>, pageInfo: { __typename?: 'OffsetPaginationInfo', limit?: number | null, offset: number } } };


export const FilterClientProfilesDocument = gql`
    query FilterClientProfiles($filters: ClientProfileFilter, $pagination: OffsetPaginationInput, $order: ClientProfileOrder) {
  clientProfiles(filters: $filters, pagination: $pagination, order: $order) {
    totalCount
    results {
      id
      firstName
      lastName
      middleName
      nickname
    }
    pageInfo {
      limit
      offset
    }
  }
}
    `;

/**
 * __useFilterClientProfilesQuery__
 *
 * To run a query within a React component, call `useFilterClientProfilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useFilterClientProfilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFilterClientProfilesQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      pagination: // value for 'pagination'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useFilterClientProfilesQuery(baseOptions?: Apollo.QueryHookOptions<FilterClientProfilesQuery, FilterClientProfilesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FilterClientProfilesQuery, FilterClientProfilesQueryVariables>(FilterClientProfilesDocument, options);
      }
export function useFilterClientProfilesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FilterClientProfilesQuery, FilterClientProfilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FilterClientProfilesQuery, FilterClientProfilesQueryVariables>(FilterClientProfilesDocument, options);
        }
export function useFilterClientProfilesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FilterClientProfilesQuery, FilterClientProfilesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FilterClientProfilesQuery, FilterClientProfilesQueryVariables>(FilterClientProfilesDocument, options);
        }
export type FilterClientProfilesQueryHookResult = ReturnType<typeof useFilterClientProfilesQuery>;
export type FilterClientProfilesLazyQueryHookResult = ReturnType<typeof useFilterClientProfilesLazyQuery>;
export type FilterClientProfilesSuspenseQueryHookResult = ReturnType<typeof useFilterClientProfilesSuspenseQuery>;
export type FilterClientProfilesQueryResult = Apollo.QueryResult<FilterClientProfilesQuery, FilterClientProfilesQueryVariables>;