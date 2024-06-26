import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type UpdateClientProfileMutationVariables = Types.Exact<{
  data: Types.UpdateClientProfileInput;
}>;


export type UpdateClientProfileMutation = { __typename?: 'Mutation', updateClientProfile: { __typename?: 'ClientProfileType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type GetClientProfileQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type GetClientProfileQuery = { __typename?: 'Query', clientProfile: { __typename?: 'ClientProfileType', id: string, address?: string | null, dateOfBirth?: any | null, gender?: Types.GenderEnum | null, hmisId?: string | null, nickname?: string | null, phoneNumber?: string | null, preferredLanguage?: Types.LanguageEnum | null, pronouns?: string | null, spokenLanguages?: Array<Types.LanguageEnum | null> | null, veteranStatus?: Types.YesNoPreferNotToSayEnum | null, user: { __typename?: 'UserType', email: string, firstName?: string | null, middleName?: string | null, lastName?: string | null } } };


export const UpdateClientProfileDocument = gql`
    mutation UpdateClientProfile($data: UpdateClientProfileInput!) {
  updateClientProfile(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on ClientProfileType {
      id
    }
  }
}
    `;
export type UpdateClientProfileMutationFn = Apollo.MutationFunction<UpdateClientProfileMutation, UpdateClientProfileMutationVariables>;

/**
 * __useUpdateClientProfileMutation__
 *
 * To run a mutation, you first call `useUpdateClientProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateClientProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateClientProfileMutation, { data, loading, error }] = useUpdateClientProfileMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateClientProfileMutation(baseOptions?: Apollo.MutationHookOptions<UpdateClientProfileMutation, UpdateClientProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateClientProfileMutation, UpdateClientProfileMutationVariables>(UpdateClientProfileDocument, options);
      }
export type UpdateClientProfileMutationHookResult = ReturnType<typeof useUpdateClientProfileMutation>;
export type UpdateClientProfileMutationResult = Apollo.MutationResult<UpdateClientProfileMutation>;
export type UpdateClientProfileMutationOptions = Apollo.BaseMutationOptions<UpdateClientProfileMutation, UpdateClientProfileMutationVariables>;
export const GetClientProfileDocument = gql`
    query GetClientProfile($id: ID!) {
  clientProfile(pk: $id) {
    ... on ClientProfileType {
      id
      address
      dateOfBirth
      gender
      hmisId
      nickname
      phoneNumber
      preferredLanguage
      pronouns
      spokenLanguages
      veteranStatus
      user {
        email
        firstName
        middleName
        lastName
      }
    }
  }
}
    `;

/**
 * __useGetClientProfileQuery__
 *
 * To run a query within a React component, call `useGetClientProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetClientProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetClientProfileQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetClientProfileQuery(baseOptions: Apollo.QueryHookOptions<GetClientProfileQuery, GetClientProfileQueryVariables> & ({ variables: GetClientProfileQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetClientProfileQuery, GetClientProfileQueryVariables>(GetClientProfileDocument, options);
      }
export function useGetClientProfileLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetClientProfileQuery, GetClientProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetClientProfileQuery, GetClientProfileQueryVariables>(GetClientProfileDocument, options);
        }
export function useGetClientProfileSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetClientProfileQuery, GetClientProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetClientProfileQuery, GetClientProfileQueryVariables>(GetClientProfileDocument, options);
        }
export type GetClientProfileQueryHookResult = ReturnType<typeof useGetClientProfileQuery>;
export type GetClientProfileLazyQueryHookResult = ReturnType<typeof useGetClientProfileLazyQuery>;
export type GetClientProfileSuspenseQueryHookResult = ReturnType<typeof useGetClientProfileSuspenseQuery>;
export type GetClientProfileQueryResult = Apollo.QueryResult<GetClientProfileQuery, GetClientProfileQueryVariables>;