import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ClientProfileQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ClientProfileQuery = { __typename?: 'Query', clientProfile: { __typename?: 'ClientProfileType', id: string, age?: number | null, dateOfBirth?: any | null, gender?: Types.GenderEnum | null, hmisId?: string | null, nickname?: string | null, preferredLanguage?: Types.LanguageEnum | null, profilePhoto?: { __typename?: 'DjangoImageType', height: number, name: string, path: string, url: string, size: number, width: number } | null, user: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, lastName?: string | null, username: string }, docReadyDocuments?: Array<{ __typename?: 'ClientDocumentType', id: string, namespace: Types.ClientDocumentNamespaceEnum, file: { __typename?: 'DjangoFileType', url: string, name: string } }> | null, consentFormDocuments?: Array<{ __typename?: 'ClientDocumentType', id: string, namespace: Types.ClientDocumentNamespaceEnum, file: { __typename?: 'DjangoFileType', url: string, name: string } }> | null, otherDocuments?: Array<{ __typename?: 'ClientDocumentType', id: string, namespace: Types.ClientDocumentNamespaceEnum, file: { __typename?: 'DjangoFileType', url: string, name: string } }> | null } };

export type CreateClientDocumentMutationVariables = Types.Exact<{
  data: Types.CreateClientDocumentInput;
}>;


export type CreateClientDocumentMutation = { __typename?: 'Mutation', createClientDocument: { __typename?: 'ClientDocumentType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };


export const ClientProfileDocument = gql`
    query ClientProfile($id: ID!) {
  clientProfile(pk: $id) {
    ... on ClientProfileType {
      id
      age
      dateOfBirth
      gender
      hmisId
      nickname
      preferredLanguage
      profilePhoto {
        height
        name
        path
        url
        size
        width
      }
      user {
        id
        email
        firstName
        lastName
        username
      }
      docReadyDocuments {
        id
        namespace
        file {
          url
          name
        }
      }
      consentFormDocuments {
        id
        namespace
        file {
          url
          name
        }
      }
      otherDocuments {
        id
        namespace
        file {
          url
          name
        }
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
export const CreateClientDocumentDocument = gql`
    mutation CreateClientDocument($data: CreateClientDocumentInput!) {
  createClientDocument(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on ClientDocumentType {
      id
    }
  }
}
    `;
export type CreateClientDocumentMutationFn = Apollo.MutationFunction<CreateClientDocumentMutation, CreateClientDocumentMutationVariables>;

/**
 * __useCreateClientDocumentMutation__
 *
 * To run a mutation, you first call `useCreateClientDocumentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateClientDocumentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createClientDocumentMutation, { data, loading, error }] = useCreateClientDocumentMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateClientDocumentMutation(baseOptions?: Apollo.MutationHookOptions<CreateClientDocumentMutation, CreateClientDocumentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateClientDocumentMutation, CreateClientDocumentMutationVariables>(CreateClientDocumentDocument, options);
      }
export type CreateClientDocumentMutationHookResult = ReturnType<typeof useCreateClientDocumentMutation>;
export type CreateClientDocumentMutationResult = Apollo.MutationResult<CreateClientDocumentMutation>;
export type CreateClientDocumentMutationOptions = Apollo.BaseMutationOptions<CreateClientDocumentMutation, CreateClientDocumentMutationVariables>;