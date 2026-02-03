import * as Types from '../../../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type DeleteClientHouseholdMemberMutationVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type DeleteClientHouseholdMemberMutation = { __typename?: 'Mutation', deleteClientHouseholdMember: { __typename?: 'ClientHouseholdMemberType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };


export const DeleteClientHouseholdMemberDocument = gql`
    mutation DeleteClientHouseholdMember($id: ID!) {
  deleteClientHouseholdMember(data: {id: $id}) {
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
export type DeleteClientHouseholdMemberMutationFn = Apollo.MutationFunction<DeleteClientHouseholdMemberMutation, DeleteClientHouseholdMemberMutationVariables>;

/**
 * __useDeleteClientHouseholdMemberMutation__
 *
 * To run a mutation, you first call `useDeleteClientHouseholdMemberMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteClientHouseholdMemberMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteClientHouseholdMemberMutation, { data, loading, error }] = useDeleteClientHouseholdMemberMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteClientHouseholdMemberMutation(baseOptions?: Apollo.MutationHookOptions<DeleteClientHouseholdMemberMutation, DeleteClientHouseholdMemberMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteClientHouseholdMemberMutation, DeleteClientHouseholdMemberMutationVariables>(DeleteClientHouseholdMemberDocument, options);
      }
export type DeleteClientHouseholdMemberMutationHookResult = ReturnType<typeof useDeleteClientHouseholdMemberMutation>;
export type DeleteClientHouseholdMemberMutationResult = Apollo.MutationResult<DeleteClientHouseholdMemberMutation>;
export type DeleteClientHouseholdMemberMutationOptions = Apollo.BaseMutationOptions<DeleteClientHouseholdMemberMutation, DeleteClientHouseholdMemberMutationVariables>;