import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type UpdateTaskStatusMutationVariables = Types.Exact<{
  data: Types.UpdateTaskInput;
}>;


export type UpdateTaskStatusMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'TaskType', id: string, status?: Types.TaskStatusEnum | null, updatedAt: any } };


export const UpdateTaskStatusDocument = gql`
    mutation UpdateTaskStatus($data: UpdateTaskInput!) {
  updateTask(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on TaskType {
      id
      status
      updatedAt
    }
  }
}
    `;
export type UpdateTaskStatusMutationFn = Apollo.MutationFunction<UpdateTaskStatusMutation, UpdateTaskStatusMutationVariables>;

/**
 * __useUpdateTaskStatusMutation__
 *
 * To run a mutation, you first call `useUpdateTaskStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTaskStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTaskStatusMutation, { data, loading, error }] = useUpdateTaskStatusMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateTaskStatusMutation(baseOptions?: Apollo.MutationHookOptions<UpdateTaskStatusMutation, UpdateTaskStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateTaskStatusMutation, UpdateTaskStatusMutationVariables>(UpdateTaskStatusDocument, options);
      }
export type UpdateTaskStatusMutationHookResult = ReturnType<typeof useUpdateTaskStatusMutation>;
export type UpdateTaskStatusMutationResult = Apollo.MutationResult<UpdateTaskStatusMutation>;
export type UpdateTaskStatusMutationOptions = Apollo.BaseMutationOptions<UpdateTaskStatusMutation, UpdateTaskStatusMutationVariables>;