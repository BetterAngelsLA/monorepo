import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type UpdateTaskSummaryStatusMutationVariables = Types.Exact<{
  data: Types.UpdateTaskInput;
}>;


export type UpdateTaskSummaryStatusMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'TaskType', id: string, summary?: string | null, description?: string | null, status?: Types.TaskStatusEnum | null, team?: Types.SelahTeamEnum | null, createdAt: any, updatedAt: any, organization?: { __typename?: 'OrganizationType', id: string, name: string } | null, clientProfile?: { __typename?: 'ClientProfileType', id: string, firstName?: string | null, lastName?: string | null, profilePhoto?: { __typename?: 'DjangoImageType', name: string, url: string } | null } | null, createdBy: { __typename?: 'UserType', id: string, firstName?: string | null, lastName?: string | null } } };


export const UpdateTaskSummaryStatusDocument = gql`
    mutation UpdateTaskSummaryStatus($data: UpdateTaskInput!) {
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
      summary
      description
      status
      team
      organization {
        id
        name
      }
      clientProfile {
        id
        firstName
        lastName
        profilePhoto {
          name
          url
        }
      }
      createdBy {
        id
        firstName
        lastName
      }
      createdAt
      updatedAt
    }
  }
}
    `;
export type UpdateTaskSummaryStatusMutationFn = Apollo.MutationFunction<UpdateTaskSummaryStatusMutation, UpdateTaskSummaryStatusMutationVariables>;

/**
 * __useUpdateTaskSummaryStatusMutation__
 *
 * To run a mutation, you first call `useUpdateTaskSummaryStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTaskSummaryStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTaskSummaryStatusMutation, { data, loading, error }] = useUpdateTaskSummaryStatusMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateTaskSummaryStatusMutation(baseOptions?: Apollo.MutationHookOptions<UpdateTaskSummaryStatusMutation, UpdateTaskSummaryStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateTaskSummaryStatusMutation, UpdateTaskSummaryStatusMutationVariables>(UpdateTaskSummaryStatusDocument, options);
      }
export type UpdateTaskSummaryStatusMutationHookResult = ReturnType<typeof useUpdateTaskSummaryStatusMutation>;
export type UpdateTaskSummaryStatusMutationResult = Apollo.MutationResult<UpdateTaskSummaryStatusMutation>;
export type UpdateTaskSummaryStatusMutationOptions = Apollo.BaseMutationOptions<UpdateTaskSummaryStatusMutation, UpdateTaskSummaryStatusMutationVariables>;