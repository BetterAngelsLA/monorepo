import * as Types from '../../../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type UpdateClientContactMutationVariables = Types.Exact<{
  data: Types.ClientContactInput;
}>;


export type UpdateClientContactMutation = { __typename?: 'Mutation', updateClientContact: { __typename?: 'ClientContactType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type CreateClientContactMutationVariables = Types.Exact<{
  data: Types.ClientContactInput;
}>;


export type CreateClientContactMutation = { __typename?: 'Mutation', createClientContact: { __typename?: 'ClientContactType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };


export const UpdateClientContactDocument = gql`
    mutation UpdateClientContact($data: ClientContactInput!) {
  updateClientContact(data: $data) {
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
export type UpdateClientContactMutationFn = Apollo.MutationFunction<UpdateClientContactMutation, UpdateClientContactMutationVariables>;

/**
 * __useUpdateClientContactMutation__
 *
 * To run a mutation, you first call `useUpdateClientContactMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateClientContactMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateClientContactMutation, { data, loading, error }] = useUpdateClientContactMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateClientContactMutation(baseOptions?: Apollo.MutationHookOptions<UpdateClientContactMutation, UpdateClientContactMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateClientContactMutation, UpdateClientContactMutationVariables>(UpdateClientContactDocument, options);
      }
export type UpdateClientContactMutationHookResult = ReturnType<typeof useUpdateClientContactMutation>;
export type UpdateClientContactMutationResult = Apollo.MutationResult<UpdateClientContactMutation>;
export type UpdateClientContactMutationOptions = Apollo.BaseMutationOptions<UpdateClientContactMutation, UpdateClientContactMutationVariables>;
export const CreateClientContactDocument = gql`
    mutation CreateClientContact($data: ClientContactInput!) {
  createClientContact(data: $data) {
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
export type CreateClientContactMutationFn = Apollo.MutationFunction<CreateClientContactMutation, CreateClientContactMutationVariables>;

/**
 * __useCreateClientContactMutation__
 *
 * To run a mutation, you first call `useCreateClientContactMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateClientContactMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createClientContactMutation, { data, loading, error }] = useCreateClientContactMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateClientContactMutation(baseOptions?: Apollo.MutationHookOptions<CreateClientContactMutation, CreateClientContactMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateClientContactMutation, CreateClientContactMutationVariables>(CreateClientContactDocument, options);
      }
export type CreateClientContactMutationHookResult = ReturnType<typeof useCreateClientContactMutation>;
export type CreateClientContactMutationResult = Apollo.MutationResult<CreateClientContactMutation>;
export type CreateClientContactMutationOptions = Apollo.BaseMutationOptions<CreateClientContactMutation, CreateClientContactMutationVariables>;