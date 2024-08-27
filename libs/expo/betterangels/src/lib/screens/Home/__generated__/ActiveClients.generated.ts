import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ClientProfilesQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.ClientProfileFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.ClientProfileOrder>;
}>;


export type ClientProfilesQuery = { __typename?: 'Query', clientProfiles: Array<{ __typename?: 'ClientProfileType', id: string, hmisId?: string | null, user: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, lastName?: string | null, username: string } }> };


export const ClientProfilesDocument = gql`
    query ClientProfiles($filters: ClientProfileFilter, $pagination: OffsetPaginationInput, $order: ClientProfileOrder) {
  clientProfiles(filters: $filters, pagination: $pagination, order: $order) {
    ... on ClientProfileType {
      id
      hmisId
      user {
        id
        email
        firstName
        lastName
        username
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
 *      pagination: // value for 'pagination'
 *      order: // value for 'order'
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
export function useClientProfilesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ClientProfilesQuery, ClientProfilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClientProfilesQuery, ClientProfilesQueryVariables>(ClientProfilesDocument, options);
        }
export type ClientProfilesQueryHookResult = ReturnType<typeof useClientProfilesQuery>;
export type ClientProfilesLazyQueryHookResult = ReturnType<typeof useClientProfilesLazyQuery>;
export type ClientProfilesSuspenseQueryHookResult = ReturnType<typeof useClientProfilesSuspenseQuery>;
export type ClientProfilesQueryResult = Apollo.QueryResult<ClientProfilesQuery, ClientProfilesQueryVariables>;