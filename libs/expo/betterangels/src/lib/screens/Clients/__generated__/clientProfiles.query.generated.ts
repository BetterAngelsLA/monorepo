import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import { FullClientProfileFieldsFragmentDoc } from '../../../apollo/graphql/fragments/__generated__/clientProfile.generated';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ClientProfilesPaginatedQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.ClientProfileFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.ClientProfileOrder>;
}>;


export type ClientProfilesPaginatedQuery = { __typename?: 'Query', clientProfilesPaginated: { __typename?: 'ClientProfileTypeOffsetPaginated', totalCount: number, pageInfo: { __typename?: 'OffsetPaginationInfo', limit?: number | null, offset: number }, results: Array<{ __typename?: 'ClientProfileType', id: string, age?: number | null, dateOfBirth?: any | null, heightInInches?: number | null, mailingAddress?: string | null, nickname?: string | null, residenceAddress?: string | null, displayCaseManager: string, hmisProfiles?: Array<{ __typename?: 'HmisProfileType', id: string, agency: Types.HmisAgencyEnum, hmisId: string }> | null, profilePhoto?: { __typename?: 'DjangoImageType', name: string, url: string } | null, user: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, lastName?: string | null, username: string } }> } };


export const ClientProfilesPaginatedDocument = gql`
    query ClientProfilesPaginated($filters: ClientProfileFilter, $pagination: OffsetPaginationInput, $order: ClientProfileOrder) {
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
 * __useClientProfilesPaginatedQuery__
 *
 * To run a query within a React component, call `useClientProfilesPaginatedQuery` and pass it any options that fit your needs.
 * When your component renders, `useClientProfilesPaginatedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useClientProfilesPaginatedQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      pagination: // value for 'pagination'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useClientProfilesPaginatedQuery(baseOptions?: Apollo.QueryHookOptions<ClientProfilesPaginatedQuery, ClientProfilesPaginatedQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ClientProfilesPaginatedQuery, ClientProfilesPaginatedQueryVariables>(ClientProfilesPaginatedDocument, options);
      }
export function useClientProfilesPaginatedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ClientProfilesPaginatedQuery, ClientProfilesPaginatedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ClientProfilesPaginatedQuery, ClientProfilesPaginatedQueryVariables>(ClientProfilesPaginatedDocument, options);
        }
export function useClientProfilesPaginatedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClientProfilesPaginatedQuery, ClientProfilesPaginatedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClientProfilesPaginatedQuery, ClientProfilesPaginatedQueryVariables>(ClientProfilesPaginatedDocument, options);
        }
export type ClientProfilesPaginatedQueryHookResult = ReturnType<typeof useClientProfilesPaginatedQuery>;
export type ClientProfilesPaginatedLazyQueryHookResult = ReturnType<typeof useClientProfilesPaginatedLazyQuery>;
export type ClientProfilesPaginatedSuspenseQueryHookResult = ReturnType<typeof useClientProfilesPaginatedSuspenseQuery>;
export type ClientProfilesPaginatedQueryResult = Apollo.QueryResult<ClientProfilesPaginatedQuery, ClientProfilesPaginatedQueryVariables>;