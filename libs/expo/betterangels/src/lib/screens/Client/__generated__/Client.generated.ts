import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ClientProfileQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ClientProfileQuery = { __typename?: 'Query', clientProfile: { __typename?: 'ClientProfileType', id: string, address?: string | null, dateOfBirth?: any | null, gender?: Types.GenderEnum | null, displayGender?: string | null, genderOther?: string | null, age?: number | null, nickname?: string | null, phoneNumber?: any | null, preferredLanguage?: Types.LanguageEnum | null, pronouns?: Types.PronounEnum | null, veteranStatus?: Types.YesNoPreferNotToSayEnum | null, livingSituation?: Types.LivingSituationEnum | null, hmisProfiles?: Array<{ __typename?: 'HmisProfileType', agency: Types.HmisAgencyEnum, hmisId: string, id: string }> | null, phoneNumbers?: Array<{ __typename?: 'PhoneNumberType', id: string, number?: any | null, isPrimary?: boolean | null }> | null, profilePhoto?: { __typename?: 'DjangoImageType', height: number, name: string, path: string, url: string, size: number, width: number } | null, user: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, middleName?: string | null, lastName?: string | null }, contacts?: Array<{ __typename?: 'ClientContactType', id: string, email?: string | null, mailingAddress?: string | null, name?: string | null, phoneNumber?: any | null, relationshipToClient?: Types.RelationshipTypeEnum | null, relationshipToClientOther?: string | null }> | null, householdMembers?: Array<{ __typename?: 'ClientHouseholdMemberType', dateOfBirth?: any | null, gender?: Types.GenderEnum | null, genderOther?: string | null, displayGender?: string | null, name?: string | null, relationshipToClient?: Types.RelationshipTypeEnum | null, relationshipToClientOther?: string | null, id: string }> | null, docReadyDocuments?: Array<{ __typename?: 'ClientDocumentType', id: string, createdAt: any, namespace: Types.ClientDocumentNamespaceEnum, originalFilename?: string | null, file: { __typename?: 'DjangoFileType', url: string, name: string } }> | null, consentFormDocuments?: Array<{ __typename?: 'ClientDocumentType', id: string, createdAt: any, namespace: Types.ClientDocumentNamespaceEnum, originalFilename?: string | null, file: { __typename?: 'DjangoFileType', url: string, name: string } }> | null, otherDocuments?: Array<{ __typename?: 'ClientDocumentType', id: string, createdAt: any, namespace: Types.ClientDocumentNamespaceEnum, originalFilename?: string | null, file: { __typename?: 'DjangoFileType', url: string, name: string } }> | null } };

export type CreateClientDocumentMutationVariables = Types.Exact<{
  data: Types.CreateClientDocumentInput;
}>;


export type CreateClientDocumentMutation = { __typename?: 'Mutation', createClientDocument: { __typename?: 'ClientDocumentType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type DeleteClientDocumentMutationVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type DeleteClientDocumentMutation = { __typename?: 'Mutation', deleteClientDocument: { __typename?: 'ClientDocumentType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };


export const ClientProfileDocument = gql`
    query ClientProfile($id: ID!) {
  clientProfile(pk: $id) {
    ... on ClientProfileType {
      id
      address
      dateOfBirth
      gender
      displayGender
      genderOther
      age
      hmisProfiles {
        agency
        hmisId
        id
      }
      nickname
      phoneNumber
      phoneNumbers {
        id
        number
        isPrimary
      }
      preferredLanguage
      pronouns
      veteranStatus
      livingSituation
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
      householdMembers {
        dateOfBirth
        gender
        genderOther
        displayGender
        name
        relationshipToClient
        relationshipToClientOther
        id
      }
      docReadyDocuments {
        id
        createdAt
        namespace
        originalFilename
        file {
          url
          name
        }
      }
      consentFormDocuments {
        id
        createdAt
        namespace
        originalFilename
        file {
          url
          name
        }
      }
      otherDocuments {
        id
        createdAt
        namespace
        originalFilename
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
export const DeleteClientDocumentDocument = gql`
    mutation DeleteClientDocument($id: ID!) {
  deleteClientDocument(data: {id: $id}) {
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
export type DeleteClientDocumentMutationFn = Apollo.MutationFunction<DeleteClientDocumentMutation, DeleteClientDocumentMutationVariables>;

/**
 * __useDeleteClientDocumentMutation__
 *
 * To run a mutation, you first call `useDeleteClientDocumentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteClientDocumentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteClientDocumentMutation, { data, loading, error }] = useDeleteClientDocumentMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteClientDocumentMutation(baseOptions?: Apollo.MutationHookOptions<DeleteClientDocumentMutation, DeleteClientDocumentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteClientDocumentMutation, DeleteClientDocumentMutationVariables>(DeleteClientDocumentDocument, options);
      }
export type DeleteClientDocumentMutationHookResult = ReturnType<typeof useDeleteClientDocumentMutation>;
export type DeleteClientDocumentMutationResult = Apollo.MutationResult<DeleteClientDocumentMutation>;
export type DeleteClientDocumentMutationOptions = Apollo.BaseMutationOptions<DeleteClientDocumentMutation, DeleteClientDocumentMutationVariables>;