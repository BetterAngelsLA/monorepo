import * as Types from '../../../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type UpdateClientProfilePhotoMutationVariables = Types.Exact<{
  data: Types.ClientProfilePhotoInput;
}>;


export type UpdateClientProfilePhotoMutation = { __typename?: 'Mutation', updateClientProfilePhoto: { __typename?: 'ClientProfileType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };


export const UpdateClientProfilePhotoDocument = gql`
    mutation UpdateClientProfilePhoto($data: ClientProfilePhotoInput!) {
  updateClientProfilePhoto(data: $data) {
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
export type UpdateClientProfilePhotoMutationFn = Apollo.MutationFunction<UpdateClientProfilePhotoMutation, UpdateClientProfilePhotoMutationVariables>;

/**
 * __useUpdateClientProfilePhotoMutation__
 *
 * To run a mutation, you first call `useUpdateClientProfilePhotoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateClientProfilePhotoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateClientProfilePhotoMutation, { data, loading, error }] = useUpdateClientProfilePhotoMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateClientProfilePhotoMutation(baseOptions?: Apollo.MutationHookOptions<UpdateClientProfilePhotoMutation, UpdateClientProfilePhotoMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateClientProfilePhotoMutation, UpdateClientProfilePhotoMutationVariables>(UpdateClientProfilePhotoDocument, options);
      }
export type UpdateClientProfilePhotoMutationHookResult = ReturnType<typeof useUpdateClientProfilePhotoMutation>;
export type UpdateClientProfilePhotoMutationResult = Apollo.MutationResult<UpdateClientProfilePhotoMutation>;
export type UpdateClientProfilePhotoMutationOptions = Apollo.BaseMutationOptions<UpdateClientProfilePhotoMutation, UpdateClientProfilePhotoMutationVariables>;