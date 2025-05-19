import * as Types from '../../../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type UpdateClientHouseholdMemberMutationVariables = Types.Exact<{
  data: Types.ClientHouseholdMemberInput;
}>;


export type UpdateClientHouseholdMemberMutation = { __typename?: 'Mutation', updateClientHouseholdMember: { __typename?: 'ClientHouseholdMemberType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type CreateClientHouseholdMemberMutationVariables = Types.Exact<{
  data: Types.ClientHouseholdMemberInput;
}>;


export type CreateClientHouseholdMemberMutation = { __typename?: 'Mutation', createClientHouseholdMember: { __typename?: 'ClientHouseholdMemberType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };


export const UpdateClientHouseholdMemberDocument = gql`
    mutation UpdateClientHouseholdMember($data: ClientHouseholdMemberInput!) {
  updateClientHouseholdMember(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on ClientHouseholdMemberType {
      id
    }
  }
}
    `;
export type UpdateClientHouseholdMemberMutationFn = Apollo.MutationFunction<UpdateClientHouseholdMemberMutation, UpdateClientHouseholdMemberMutationVariables>;

/**
 * __useUpdateClientHouseholdMemberMutation__
 *
 * To run a mutation, you first call `useUpdateClientHouseholdMemberMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateClientHouseholdMemberMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateClientHouseholdMemberMutation, { data, loading, error }] = useUpdateClientHouseholdMemberMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateClientHouseholdMemberMutation(baseOptions?: Apollo.MutationHookOptions<UpdateClientHouseholdMemberMutation, UpdateClientHouseholdMemberMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateClientHouseholdMemberMutation, UpdateClientHouseholdMemberMutationVariables>(UpdateClientHouseholdMemberDocument, options);
      }
export type UpdateClientHouseholdMemberMutationHookResult = ReturnType<typeof useUpdateClientHouseholdMemberMutation>;
export type UpdateClientHouseholdMemberMutationResult = Apollo.MutationResult<UpdateClientHouseholdMemberMutation>;
export type UpdateClientHouseholdMemberMutationOptions = Apollo.BaseMutationOptions<UpdateClientHouseholdMemberMutation, UpdateClientHouseholdMemberMutationVariables>;
export const CreateClientHouseholdMemberDocument = gql`
    mutation CreateClientHouseholdMember($data: ClientHouseholdMemberInput!) {
  createClientHouseholdMember(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on ClientHouseholdMemberType {
      id
    }
  }
}
    `;
export type CreateClientHouseholdMemberMutationFn = Apollo.MutationFunction<CreateClientHouseholdMemberMutation, CreateClientHouseholdMemberMutationVariables>;

/**
 * __useCreateClientHouseholdMemberMutation__
 *
 * To run a mutation, you first call `useCreateClientHouseholdMemberMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateClientHouseholdMemberMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createClientHouseholdMemberMutation, { data, loading, error }] = useCreateClientHouseholdMemberMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateClientHouseholdMemberMutation(baseOptions?: Apollo.MutationHookOptions<CreateClientHouseholdMemberMutation, CreateClientHouseholdMemberMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateClientHouseholdMemberMutation, CreateClientHouseholdMemberMutationVariables>(CreateClientHouseholdMemberDocument, options);
      }
export type CreateClientHouseholdMemberMutationHookResult = ReturnType<typeof useCreateClientHouseholdMemberMutation>;
export type CreateClientHouseholdMemberMutationResult = Apollo.MutationResult<CreateClientHouseholdMemberMutation>;
export type CreateClientHouseholdMemberMutationOptions = Apollo.BaseMutationOptions<CreateClientHouseholdMemberMutation, CreateClientHouseholdMemberMutationVariables>;