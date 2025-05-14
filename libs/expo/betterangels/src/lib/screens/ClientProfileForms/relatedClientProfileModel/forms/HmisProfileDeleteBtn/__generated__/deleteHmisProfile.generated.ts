import * as Types from '../../../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type DeleteHmisProfileMutationVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type DeleteHmisProfileMutation = { __typename?: 'Mutation', deleteHmisProfile: { __typename?: 'HmisProfileType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };


export const DeleteHmisProfileDocument = gql`
    mutation DeleteHmisProfile($id: ID!) {
  deleteHmisProfile(data: {id: $id}) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on HmisProfileType {
      id
    }
  }
}
    `;
export type DeleteHmisProfileMutationFn = Apollo.MutationFunction<DeleteHmisProfileMutation, DeleteHmisProfileMutationVariables>;

/**
 * __useDeleteHmisProfileMutation__
 *
 * To run a mutation, you first call `useDeleteHmisProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteHmisProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteHmisProfileMutation, { data, loading, error }] = useDeleteHmisProfileMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteHmisProfileMutation(baseOptions?: Apollo.MutationHookOptions<DeleteHmisProfileMutation, DeleteHmisProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteHmisProfileMutation, DeleteHmisProfileMutationVariables>(DeleteHmisProfileDocument, options);
      }
export type DeleteHmisProfileMutationHookResult = ReturnType<typeof useDeleteHmisProfileMutation>;
export type DeleteHmisProfileMutationResult = Apollo.MutationResult<DeleteHmisProfileMutation>;
export type DeleteHmisProfileMutationOptions = Apollo.BaseMutationOptions<DeleteHmisProfileMutation, DeleteHmisProfileMutationVariables>;