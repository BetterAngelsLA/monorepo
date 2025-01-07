import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CreateNoteMutationVariables = Types.Exact<{
  data: Types.CreateNoteInput;
}>;


export type CreateNoteMutation = { __typename?: 'Mutation', createNote: { __typename?: 'NoteType', id: string, title?: string | null, publicDetails: string, createdAt: any, client?: { __typename?: 'UserType', id: string, username: string, firstName?: string | null, lastName?: string | null, email?: string | null } | null, createdBy: { __typename?: 'UserType', id: string, username: string, email?: string | null } } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type ActiveClientsProfilesPaginatedQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.ClientProfileFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.ClientProfileOrder>;
}>;


export type ActiveClientsProfilesPaginatedQuery = { __typename?: 'Query', clientProfilesPaginated: { __typename?: 'ClientProfileTypeOffsetPaginated', totalCount: number, pageInfo: { __typename?: 'OffsetPaginationInfo', offset: number, limit?: number | null }, results: Array<{ __typename?: 'ClientProfileType', id: string, age?: number | null, dateOfBirth?: any | null, heightInInches?: number | null, mailingAddress?: string | null, nickname?: string | null, residenceAddress?: string | null, displayCaseManager: string, hmisProfiles?: Array<{ __typename?: 'HmisProfileType', id: string, agency: Types.HmisAgencyEnum, hmisId: string }> | null, profilePhoto?: { __typename?: 'DjangoImageType', name: string, url: string } | null, user: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, lastName?: string | null, username: string } }> } };


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
export const ActiveClientsProfilesPaginatedDocument = gql`
    query ActiveClientsProfilesPaginated($filters: ClientProfileFilter, $pagination: OffsetPaginationInput, $order: ClientProfileOrder) {
  clientProfilesPaginated(
    pagination: $pagination
    filters: $filters
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
 * __useActiveClientsProfilesPaginatedQuery__
 *
 * To run a query within a React component, call `useActiveClientsProfilesPaginatedQuery` and pass it any options that fit your needs.
 * When your component renders, `useActiveClientsProfilesPaginatedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useActiveClientsProfilesPaginatedQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      pagination: // value for 'pagination'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useActiveClientsProfilesPaginatedQuery(baseOptions?: Apollo.QueryHookOptions<ActiveClientsProfilesPaginatedQuery, ActiveClientsProfilesPaginatedQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ActiveClientsProfilesPaginatedQuery, ActiveClientsProfilesPaginatedQueryVariables>(ActiveClientsProfilesPaginatedDocument, options);
      }
export function useActiveClientsProfilesPaginatedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ActiveClientsProfilesPaginatedQuery, ActiveClientsProfilesPaginatedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ActiveClientsProfilesPaginatedQuery, ActiveClientsProfilesPaginatedQueryVariables>(ActiveClientsProfilesPaginatedDocument, options);
        }
export function useActiveClientsProfilesPaginatedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ActiveClientsProfilesPaginatedQuery, ActiveClientsProfilesPaginatedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ActiveClientsProfilesPaginatedQuery, ActiveClientsProfilesPaginatedQueryVariables>(ActiveClientsProfilesPaginatedDocument, options);
        }
export type ActiveClientsProfilesPaginatedQueryHookResult = ReturnType<typeof useActiveClientsProfilesPaginatedQuery>;
export type ActiveClientsProfilesPaginatedLazyQueryHookResult = ReturnType<typeof useActiveClientsProfilesPaginatedLazyQuery>;
export type ActiveClientsProfilesPaginatedSuspenseQueryHookResult = ReturnType<typeof useActiveClientsProfilesPaginatedSuspenseQuery>;
export type ActiveClientsProfilesPaginatedQueryResult = Apollo.QueryResult<ActiveClientsProfilesPaginatedQuery, ActiveClientsProfilesPaginatedQueryVariables>;