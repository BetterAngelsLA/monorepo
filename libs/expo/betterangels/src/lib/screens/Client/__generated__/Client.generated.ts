import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ClientProfileQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ClientProfileQuery = { __typename?: 'Query', clientProfile: { __typename?: 'ClientProfileType', id: string, address?: string | null, dateOfBirth?: any | null, gender?: Types.GenderEnum | null, age?: number | null, hmisId?: string | null, nickname?: string | null, phoneNumber?: any | null, preferredLanguage?: Types.LanguageEnum | null, pronouns?: Types.PronounEnum | null, veteranStatus?: Types.YesNoPreferNotToSayEnum | null, livingSituation?: Types.LivingSituationEnum | null, hmisProfiles?: Array<{ __typename?: 'HmisProfileType', agency: Types.HmisAgencyEnum, hmisId: string, id: string }> | null, user: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, middleName?: string | null, lastName?: string | null }, contacts?: Array<{ __typename?: 'ClientContactType', id: string, email?: string | null, mailingAddress?: string | null, name?: string | null, phoneNumber?: any | null, relationshipToClient?: Types.RelationshipTypeEnum | null, relationshipToClientOther?: string | null }> | null } };


export const ClientProfileDocument = gql`
    query ClientProfile($id: ID!) {
  clientProfile(pk: $id) {
    ... on ClientProfileType {
      id
      address
      dateOfBirth
      gender
      age
      hmisId
      hmisProfiles {
        agency
        hmisId
        id
      }
      nickname
      phoneNumber
      preferredLanguage
      pronouns
      veteranStatus
      livingSituation
      user {
        id
        email
        firstName
        middleName
        lastName
      }
      contacts {
        id
        email
        mailingAddress
        name
        phoneNumber
        relationshipToClient
        relationshipToClientOther
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