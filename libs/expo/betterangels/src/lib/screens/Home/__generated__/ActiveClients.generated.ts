import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CreateNoteMutationVariables = Types.Exact<{
  data: Types.CreateNoteInput;
}>;


export type CreateNoteMutation = { __typename?: 'Mutation', createNote: { __typename?: 'NoteType', id: string, purpose?: string | null, publicDetails: string, createdAt: any, clientProfile?: { __typename?: 'ClientProfileType', id: string, firstName?: any | null, lastName?: any | null, email?: any | null } | null, createdBy: { __typename?: 'UserType', id: string, username: string, email?: any | null } } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type ClientProfilesQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.ClientProfileFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.ClientProfileOrder>;
}>;


export type ClientProfilesQuery = { __typename?: 'Query', clientProfiles: { __typename?: 'ClientProfileTypeOffsetPaginated', totalCount: number, pageInfo: { __typename?: 'OffsetPaginationInfo', limit?: number | null, offset: number }, results: Array<{ __typename?: 'ClientProfileType', id: string, age?: number | null, dateOfBirth?: any | null, email?: any | null, firstName?: any | null, heightInInches?: number | null, lastName?: any | null, mailingAddress?: string | null, middleName?: any | null, nickname?: any | null, residenceAddress?: string | null, displayCaseManager: string, hmisProfiles?: Array<{ __typename?: 'HmisProfileType', id: string, agency: Types.HmisAgencyEnum, hmisId?: any | null }> | null, profilePhoto?: { __typename?: 'DjangoImageType', name: string, url: string } | null }> } };


export const CreateNoteDocument = gql`
    mutation CreateNote($data: CreateNoteInput!) {
  createNote(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on NoteType {
      id
      purpose
      publicDetails
      clientProfile {
        id
        firstName
        lastName
        email
      }
      createdAt
      createdBy {
        id
        username
        email
      }
    }
  }
}
    `;
export type CreateNoteMutationFn = Apollo.MutationFunction<CreateNoteMutation, CreateNoteMutationVariables>;

/**
 * __useCreateNoteMutation__
 *
 * To run a mutation, you first call `useCreateNoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNoteMutation, { data, loading, error }] = useCreateNoteMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateNoteMutation(baseOptions?: Apollo.MutationHookOptions<CreateNoteMutation, CreateNoteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNoteMutation, CreateNoteMutationVariables>(CreateNoteDocument, options);
      }
export type CreateNoteMutationHookResult = ReturnType<typeof useCreateNoteMutation>;
export type CreateNoteMutationResult = Apollo.MutationResult<CreateNoteMutation>;
export type CreateNoteMutationOptions = Apollo.BaseMutationOptions<CreateNoteMutation, CreateNoteMutationVariables>;
export const ClientProfilesDocument = gql`
    query ClientProfiles($filters: ClientProfileFilter, $pagination: OffsetPaginationInput, $order: ClientProfileOrder) {
  clientProfiles(filters: $filters, pagination: $pagination, order: $order) {
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
      displayCaseManager
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
export function useClientProfilesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ClientProfilesQuery, ClientProfilesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClientProfilesQuery, ClientProfilesQueryVariables>(ClientProfilesDocument, options);
        }
export type ClientProfilesQueryHookResult = ReturnType<typeof useClientProfilesQuery>;
export type ClientProfilesLazyQueryHookResult = ReturnType<typeof useClientProfilesLazyQuery>;
export type ClientProfilesSuspenseQueryHookResult = ReturnType<typeof useClientProfilesSuspenseQuery>;
export type ClientProfilesQueryResult = Apollo.QueryResult<ClientProfilesQuery, ClientProfilesQueryVariables>;