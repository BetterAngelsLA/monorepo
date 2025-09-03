import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ClientProfilesQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.ClientProfileFilter>;
  order?: Types.InputMaybe<Types.ClientProfileOrder>;
  ordering?: Array<Types.InputMaybe<Types.ClientProfileOrdering>> | Types.InputMaybe<Types.ClientProfileOrdering>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
}>;


export type ClientProfilesQuery = { __typename?: 'Query', clientProfiles: { __typename?: 'ClientProfileTypeOffsetPaginated', totalCount: number, pageInfo: { __typename?: 'OffsetPaginationInfo', limit?: number | null, offset: number }, results: Array<{ __typename?: 'ClientProfileType', id: string, age?: number | null, dateOfBirth?: any | null, email?: string | null, firstName?: string | null, heightInInches?: number | null, lastName?: string | null, mailingAddress?: string | null, middleName?: string | null, nickname?: string | null, residenceAddress?: string | null, hmisProfiles?: Array<{ __typename?: 'HmisProfileType', id: string, agency: Types.HmisAgencyEnum, hmisId?: string | null }> | null, profilePhoto?: { __typename?: 'DjangoImageType', name: string, url: string } | null }> } };


export const ClientProfilesDocument = gql`
    query ClientProfiles($filters: ClientProfileFilter, $order: ClientProfileOrder, $ordering: [ClientProfileOrdering]! = [], $pagination: OffsetPaginationInput) {
  clientProfiles(
    filters: $filters
    order: $order
    ordering: $ordering
    pagination: $pagination
  ) {
    totalCount
    pageInfo {
      limit
      offset
    }
    results {
      id
      age
      dateOfBirth
      email
      firstName
      heightInInches
      lastName
      mailingAddress
      middleName
      nickname
      residenceAddress
      hmisProfiles {
        id
        agency
        hmisId
      }
      profilePhoto {
        name
        url
      }
    }
  }
}
    `;

/**
 * __useClientProfilesQuery__
 *
 * To run a query within a React component, call `useClientProfilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useClientProfilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useClientProfilesQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      order: // value for 'order'
 *      ordering: // value for 'ordering'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useClientProfilesQuery(baseOptions?: Apollo.QueryHookOptions<ClientProfilesQuery, ClientProfilesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ClientProfilesQuery, ClientProfilesQueryVariables>(ClientProfilesDocument, options);
      }
export function useClientProfilesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ClientProfilesQuery, ClientProfilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ClientProfilesQuery, ClientProfilesQueryVariables>(ClientProfilesDocument, options);
        }
export function useClientProfilesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClientProfilesQuery, ClientProfilesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClientProfilesQuery, ClientProfilesQueryVariables>(ClientProfilesDocument, options);
        }
export type ClientProfilesQueryHookResult = ReturnType<typeof useClientProfilesQuery>;
export type ClientProfilesLazyQueryHookResult = ReturnType<typeof useClientProfilesLazyQuery>;
export type ClientProfilesSuspenseQueryHookResult = ReturnType<typeof useClientProfilesSuspenseQuery>;
export type ClientProfilesQueryResult = Apollo.QueryResult<ClientProfilesQuery, ClientProfilesQueryVariables>;