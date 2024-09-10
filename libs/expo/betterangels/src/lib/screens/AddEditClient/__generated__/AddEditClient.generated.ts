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


export type GetClientProfileQuery = { __typename?: 'Query', clientProfile: { __typename?: 'ClientProfileType', id: string, address?: string | null, dateOfBirth?: any | null, gender?: Types.GenderEnum | null, hmisId?: string | null, nickname?: string | null, phoneNumber?: any | null, preferredLanguage?: Types.LanguageEnum | null, pronouns?: Types.PronounEnum | null, veteranStatus?: Types.YesNoPreferNotToSayEnum | null, user: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, middleName?: string | null, lastName?: string | null }, contacts?: Array<{ __typename?: 'ClientContactType', id: string, email?: string | null, mailingAddress?: string | null, name?: string | null, phoneNumber?: any | null, relationshipToClient?: Types.RelationshipTypeEnum | null, relationshipToClientOther?: string | null }> | null } };

export type CreateClientProfileMutationVariables = Types.Exact<{
  data: Types.CreateClientProfileInput;
}>;


export type CreateClientProfileMutation = { __typename?: 'Mutation', createClientProfile: { __typename?: 'ClientProfileType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type DeleteClientProfileMutationVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type DeleteClientProfileMutation = { __typename?: 'Mutation', deleteClientProfile: { __typename?: 'DeletedObjectType', id: number } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };


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
      veteranStatus
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
export const CreateClientProfileDocument = gql`
    mutation CreateClientProfile($data: CreateClientProfileInput!) {
  createClientProfile(data: $data) {
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
export type CreateClientProfileMutationFn = Apollo.MutationFunction<CreateClientProfileMutation, CreateClientProfileMutationVariables>;

/**
 * __useCreateClientProfileMutation__
 *
 * To run a mutation, you first call `useCreateClientProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateClientProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createClientProfileMutation, { data, loading, error }] = useCreateClientProfileMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateClientProfileMutation(baseOptions?: Apollo.MutationHookOptions<CreateClientProfileMutation, CreateClientProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateClientProfileMutation, CreateClientProfileMutationVariables>(CreateClientProfileDocument, options);
      }
export type CreateClientProfileMutationHookResult = ReturnType<typeof useCreateClientProfileMutation>;
export type CreateClientProfileMutationResult = Apollo.MutationResult<CreateClientProfileMutation>;
export type CreateClientProfileMutationOptions = Apollo.BaseMutationOptions<CreateClientProfileMutation, CreateClientProfileMutationVariables>;
export const DeleteClientProfileDocument = gql`
    mutation DeleteClientProfile($id: ID!) {
  deleteClientProfile(data: {id: $id}) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on DeletedObjectType {
      id
    }
  }
}
    `;
export type DeleteClientProfileMutationFn = Apollo.MutationFunction<DeleteClientProfileMutation, DeleteClientProfileMutationVariables>;

/**
 * __useDeleteClientProfileMutation__
 *
 * To run a mutation, you first call `useDeleteClientProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteClientProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteClientProfileMutation, { data, loading, error }] = useDeleteClientProfileMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteClientProfileMutation(baseOptions?: Apollo.MutationHookOptions<DeleteClientProfileMutation, DeleteClientProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteClientProfileMutation, DeleteClientProfileMutationVariables>(DeleteClientProfileDocument, options);
      }
export type DeleteClientProfileMutationHookResult = ReturnType<typeof useDeleteClientProfileMutation>;
export type DeleteClientProfileMutationResult = Apollo.MutationResult<DeleteClientProfileMutation>;
export type DeleteClientProfileMutationOptions = Apollo.BaseMutationOptions<DeleteClientProfileMutation, DeleteClientProfileMutationVariables>;