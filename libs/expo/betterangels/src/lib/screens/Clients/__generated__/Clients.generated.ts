import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CreateNoteMutationVariables = Types.Exact<{
  data: Types.CreateNoteInput;
}>;


export type CreateNoteMutation = { __typename?: 'Mutation', createNote: { __typename?: 'NoteType', id: string, title?: string | null, publicDetails: string, createdAt: any, client?: { __typename?: 'UserType', id: string, username: string, firstName?: string | null, lastName?: string | null, email?: string | null } | null, createdBy: { __typename?: 'UserType', id: string, username: string, email?: string | null } } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type ClientProfilesPaginatedQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.ClientProfileFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.ClientProfileOrder>;
}>;


export type ClientProfilesPaginatedQuery = { __typename?: 'Query', clientProfilesPaginated: { __typename?: 'ClientProfileTypeOffsetPaginated', totalCount: number, pageInfo: { __typename?: 'OffsetPaginationInfo', offset: number, limit?: number | null }, results: Array<{ __typename?: 'ClientProfileType', id: string, age?: number | null, dateOfBirth?: any | null, heightInInches?: number | null, mailingAddress?: string | null, nickname?: string | null, residenceAddress?: string | null, displayCaseManager: string, hmisProfiles?: Array<{ __typename?: 'HmisProfileType', id: string, agency: Types.HmisAgencyEnum, hmisId: string }> | null, profilePhoto?: { __typename?: 'DjangoImageType', name: string, url: string } | null, user: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, lastName?: string | null, username: string } }> } };


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
      title
      publicDetails
      client {
        id
        username
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
export const ClientProfilesPaginatedDocument = gql`
    query ClientProfilesPaginated($filters: ClientProfileFilter, $pagination: OffsetPaginationInput, $order: ClientProfileOrder) {
  clientProfilesPaginated(
    filters: $filters
    pagination: $pagination
    order: $order
  ) {
    ... on ClientProfileTypeOffsetPaginated {
      pageInfo {
        offset
        limit
      }
      totalCount
      results {
        id
        age
        dateOfBirth
        heightInInches
        mailingAddress
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
        user {
          id
          email
          firstName
          lastName
          username
        }
        displayCaseManager
      }
    }
  }
}
    `;

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
export function useClientProfilesPaginatedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ClientProfilesPaginatedQuery, ClientProfilesPaginatedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClientProfilesPaginatedQuery, ClientProfilesPaginatedQueryVariables>(ClientProfilesPaginatedDocument, options);
        }
export type ClientProfilesPaginatedQueryHookResult = ReturnType<typeof useClientProfilesPaginatedQuery>;
export type ClientProfilesPaginatedLazyQueryHookResult = ReturnType<typeof useClientProfilesPaginatedLazyQuery>;
export type ClientProfilesPaginatedSuspenseQueryHookResult = ReturnType<typeof useClientProfilesPaginatedSuspenseQuery>;
export type ClientProfilesPaginatedQueryResult = Apollo.QueryResult<ClientProfilesPaginatedQuery, ClientProfilesPaginatedQueryVariables>;