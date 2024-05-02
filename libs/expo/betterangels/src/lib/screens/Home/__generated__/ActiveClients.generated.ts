import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CreateNoteMutationVariables = Types.Exact<{
  data: Types.CreateNoteInput;
}>;


export type CreateNoteMutation = { __typename?: 'Mutation', createNote: { __typename?: 'NoteType', id: string, title: string, publicDetails: string, createdAt: any, client?: { __typename?: 'UserType', id: string, username: string, firstName?: string | null, lastName?: string | null, email: string } | null, createdBy: { __typename?: 'UserType', id: string, username: string, email: string } } | { __typename?: 'OperationInfo' } };


export const CreateNoteDocument = gql`
    mutation CreateNote($data: CreateNoteInput!) {
  createNote(data: $data) {
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