import * as Types from '../../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CaseworkerOrganizationsQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.OrganizationFilter>;
  order?: Types.InputMaybe<Types.OrganizationOrder>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
}>;


export type CaseworkerOrganizationsQuery = { __typename?: 'Query', caseworkerOrganizations: { __typename?: 'OrganizationTypeOffsetPaginated', totalCount: number, results: Array<{ __typename?: 'OrganizationType', id: string, name: string }>, pageInfo: { __typename?: 'OffsetPaginationInfo', limit?: number | null, offset: number } } };


export const CaseworkerOrganizationsDocument = gql`
    query CaseworkerOrganizations($filters: OrganizationFilter, $order: OrganizationOrder, $pagination: OffsetPaginationInput) {
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
 * __useCaseworkerOrganizationsQuery__
 *
 * To run a query within a React component, call `useCaseworkerOrganizationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useCaseworkerOrganizationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCaseworkerOrganizationsQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      order: // value for 'order'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useCaseworkerOrganizationsQuery(baseOptions?: Apollo.QueryHookOptions<CaseworkerOrganizationsQuery, CaseworkerOrganizationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CaseworkerOrganizationsQuery, CaseworkerOrganizationsQueryVariables>(CaseworkerOrganizationsDocument, options);
      }
export function useCaseworkerOrganizationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CaseworkerOrganizationsQuery, CaseworkerOrganizationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CaseworkerOrganizationsQuery, CaseworkerOrganizationsQueryVariables>(CaseworkerOrganizationsDocument, options);
        }
export function useCaseworkerOrganizationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CaseworkerOrganizationsQuery, CaseworkerOrganizationsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CaseworkerOrganizationsQuery, CaseworkerOrganizationsQueryVariables>(CaseworkerOrganizationsDocument, options);
        }
export type CaseworkerOrganizationsQueryHookResult = ReturnType<typeof useCaseworkerOrganizationsQuery>;
export type CaseworkerOrganizationsLazyQueryHookResult = ReturnType<typeof useCaseworkerOrganizationsLazyQuery>;
export type CaseworkerOrganizationsSuspenseQueryHookResult = ReturnType<typeof useCaseworkerOrganizationsSuspenseQuery>;
export type CaseworkerOrganizationsQueryResult = Apollo.QueryResult<CaseworkerOrganizationsQuery, CaseworkerOrganizationsQueryVariables>;