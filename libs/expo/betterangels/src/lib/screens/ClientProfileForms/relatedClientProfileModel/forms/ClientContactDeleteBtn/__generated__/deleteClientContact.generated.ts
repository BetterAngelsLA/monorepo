import * as Types from '../../../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type DeleteClientContactMutationVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type DeleteClientContactMutation = { __typename?: 'Mutation', deleteClientContact: { __typename?: 'ClientContactType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };


export const DeleteClientContactDocument = gql`
    mutation DeleteClientContact($id: ID!) {
  deleteClientContact(data: {id: $id}) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on ClientContactType {
      id
    }
  }
}
    `;
export type DeleteClientContactMutationFn = Apollo.MutationFunction<DeleteClientContactMutation, DeleteClientContactMutationVariables>;

/**
 * __useDeleteClientContactMutation__
 *
 * To run a mutation, you first call `useDeleteClientContactMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteClientContactMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteClientContactMutation, { data, loading, error }] = useDeleteClientContactMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteClientContactMutation(baseOptions?: Apollo.MutationHookOptions<DeleteClientContactMutation, DeleteClientContactMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteClientContactMutation, DeleteClientContactMutationVariables>(DeleteClientContactDocument, options);
      }
export type DeleteClientContactMutationHookResult = ReturnType<typeof useDeleteClientContactMutation>;
export type DeleteClientContactMutationResult = Apollo.MutationResult<DeleteClientContactMutation>;
export type DeleteClientContactMutationOptions = Apollo.BaseMutationOptions<DeleteClientContactMutation, DeleteClientContactMutationVariables>;