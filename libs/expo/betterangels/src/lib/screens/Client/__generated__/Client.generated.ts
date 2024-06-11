import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ClientProfileQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ClientProfileQuery = { __typename?: 'Query', clientProfile: { __typename?: 'ClientProfileType', id: string, hmisId?: string | null, gender?: Types.GenderEnum | null, dateOfBirth?: any | null, preferredLanguage?: Types.LanguageEnum | null, age?: number | null, user: { __typename?: 'UserType', id: string, email: string, firstName?: string | null, lastName?: string | null, username: string } } };


export const ClientProfileDocument = gql`
    query ClientProfile($id: ID!) {
  clientProfile(pk: $id) {
    ... on ClientProfileType {
      id
      hmisId
      gender
      dateOfBirth
      preferredLanguage
      age
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
 * __useClientProfileQuery__
 *
 * To run a query within a React component, call `useClientProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useClientProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useClientProfileQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useClientProfileQuery(baseOptions: Apollo.QueryHookOptions<ClientProfileQuery, ClientProfileQueryVariables> & ({ variables: ClientProfileQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ClientProfileQuery, ClientProfileQueryVariables>(ClientProfileDocument, options);
      }
export function useClientProfileLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ClientProfileQuery, ClientProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ClientProfileQuery, ClientProfileQueryVariables>(ClientProfileDocument, options);
        }
export function useClientProfileSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ClientProfileQuery, ClientProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClientProfileQuery, ClientProfileQueryVariables>(ClientProfileDocument, options);
        }
export type ClientProfileQueryHookResult = ReturnType<typeof useClientProfileQuery>;
export type ClientProfileLazyQueryHookResult = ReturnType<typeof useClientProfileLazyQuery>;
export type ClientProfileSuspenseQueryHookResult = ReturnType<typeof useClientProfileSuspenseQuery>;
export type ClientProfileQueryResult = Apollo.QueryResult<ClientProfileQuery, ClientProfileQueryVariables>;