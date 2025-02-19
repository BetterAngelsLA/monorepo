import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import { FullClientProfileFieldsFragmentDoc } from '../../../apollo/graphql/fragments/__generated__/clientProfile.generated';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ActiveClientProfilesPaginatedQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.ClientProfileFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.ClientProfileOrder>;
}>;


export type ActiveClientProfilesPaginatedQuery = { __typename?: 'Query', clientProfilesPaginated: { __typename?: 'ClientProfileTypeOffsetPaginated', totalCount: number, pageInfo: { __typename?: 'OffsetPaginationInfo', limit?: number | null, offset: number }, results: Array<{ __typename?: 'ClientProfileType', id: string, age?: number | null, dateOfBirth?: any | null, heightInInches?: number | null, mailingAddress?: string | null, nickname?: string | null, residenceAddress?: string | null, displayCaseManager: string, hmisProfiles?: Array<{ __typename?: 'HmisProfileType', id: string, agency: Types.HmisAgencyEnum, hmisId: string }> | null, profilePhoto?: { __typename?: 'DjangoImageType', name: string, url: string } | null, user: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, lastName?: string | null, username: string } }> } };


export const ActiveClientProfilesPaginatedDocument = gql`
    query ActiveClientProfilesPaginated($filters: ClientProfileFilter, $pagination: OffsetPaginationInput, $order: ClientProfileOrder) {
  clientProfilesPaginated(
    filters: $filters
    pagination: $pagination
    order: $order
  ) {
    totalCount
    pageInfo {
      limit
      offset
    }
    results {
      ...FullClientProfileFields
    }
  }
}
    ${FullClientProfileFieldsFragmentDoc}`;

/**
 * __useActiveClientProfilesPaginatedQuery__
 *
 * To run a query within a React component, call `useActiveClientProfilesPaginatedQuery` and pass it any options that fit your needs.
 * When your component renders, `useActiveClientProfilesPaginatedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useActiveClientProfilesPaginatedQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      pagination: // value for 'pagination'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useActiveClientProfilesPaginatedQuery(baseOptions?: Apollo.QueryHookOptions<ActiveClientProfilesPaginatedQuery, ActiveClientProfilesPaginatedQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ActiveClientProfilesPaginatedQuery, ActiveClientProfilesPaginatedQueryVariables>(ActiveClientProfilesPaginatedDocument, options);
      }
export function useActiveClientProfilesPaginatedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ActiveClientProfilesPaginatedQuery, ActiveClientProfilesPaginatedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ActiveClientProfilesPaginatedQuery, ActiveClientProfilesPaginatedQueryVariables>(ActiveClientProfilesPaginatedDocument, options);
        }
export function useActiveClientProfilesPaginatedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ActiveClientProfilesPaginatedQuery, ActiveClientProfilesPaginatedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ActiveClientProfilesPaginatedQuery, ActiveClientProfilesPaginatedQueryVariables>(ActiveClientProfilesPaginatedDocument, options);
        }
export type ActiveClientProfilesPaginatedQueryHookResult = ReturnType<typeof useActiveClientProfilesPaginatedQuery>;
export type ActiveClientProfilesPaginatedLazyQueryHookResult = ReturnType<typeof useActiveClientProfilesPaginatedLazyQuery>;
export type ActiveClientProfilesPaginatedSuspenseQueryHookResult = ReturnType<typeof useActiveClientProfilesPaginatedSuspenseQuery>;
export type ActiveClientProfilesPaginatedQueryResult = Apollo.QueryResult<ActiveClientProfilesPaginatedQuery, ActiveClientProfilesPaginatedQueryVariables>;