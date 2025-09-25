import * as Types from '../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type FilterOrganizationsQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.OrganizationFilter>;
  order?: Types.InputMaybe<Types.OrganizationOrder>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
}>;


export type FilterOrganizationsQuery = { __typename?: 'Query', caseworkerOrganizations: { __typename?: 'OrganizationTypeOffsetPaginated', totalCount: number, results: Array<{ __typename?: 'OrganizationType', id: string, name: string }>, pageInfo: { __typename?: 'OffsetPaginationInfo', limit?: number | null, offset: number } } };


export const FilterOrganizationsDocument = gql`
    query FilterOrganizations($filters: OrganizationFilter, $order: OrganizationOrder, $pagination: OffsetPaginationInput) {
  caseworkerOrganizations(
    filters: $filters
    order: $order
    pagination: $pagination
  ) {
    totalCount
    results {
      id
      name
    }
    pageInfo {
      limit
      offset
    }
  }
}
    `;

/**
 * __useFilterOrganizationsQuery__
 *
 * To run a query within a React component, call `useFilterOrganizationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFilterOrganizationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFilterOrganizationsQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      order: // value for 'order'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useFilterOrganizationsQuery(baseOptions?: Apollo.QueryHookOptions<FilterOrganizationsQuery, FilterOrganizationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FilterOrganizationsQuery, FilterOrganizationsQueryVariables>(FilterOrganizationsDocument, options);
      }
export function useFilterOrganizationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FilterOrganizationsQuery, FilterOrganizationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FilterOrganizationsQuery, FilterOrganizationsQueryVariables>(FilterOrganizationsDocument, options);
        }
export function useFilterOrganizationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FilterOrganizationsQuery, FilterOrganizationsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FilterOrganizationsQuery, FilterOrganizationsQueryVariables>(FilterOrganizationsDocument, options);
        }
export type FilterOrganizationsQueryHookResult = ReturnType<typeof useFilterOrganizationsQuery>;
export type FilterOrganizationsLazyQueryHookResult = ReturnType<typeof useFilterOrganizationsLazyQuery>;
export type FilterOrganizationsSuspenseQueryHookResult = ReturnType<typeof useFilterOrganizationsSuspenseQuery>;
export type FilterOrganizationsQueryResult = Apollo.QueryResult<FilterOrganizationsQuery, FilterOrganizationsQueryVariables>;