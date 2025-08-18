import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CreateTaskMutationVariables = Types.Exact<{
  data: Types.CreateTaskInput;
}>;


export type CreateTaskMutation = { __typename?: 'Mutation', createTask: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'TaskType', id: string, createdAt: any, description?: string | null, status?: Types.TaskStatusEnum | null, summary?: string | null, team?: Types.SelahTeamEnum | null, updatedAt: any, clientProfile?: { __typename?: 'ClientProfileType', id: string } | null, createdBy: { __typename?: 'UserType', id: string }, note?: { __typename?: 'DjangoModelType', pk: string } | null, organization?: { __typename?: 'OrganizationType', id: string, name: string } | null } };


export const CreateTaskDocument = gql`
    mutation CreateTask($data: CreateTaskInput!) {
  createTask(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on TaskType {
      id
      clientProfile {
        id
      }
      createdAt
      createdBy {
        id
      }
      description
      note {
        pk
      }
      organization {
        id
        name
      }
      status
      summary
      team
      updatedAt
    }
  }
}
    `;
export type CreateTaskMutationFn = Apollo.MutationFunction<CreateTaskMutation, CreateTaskMutationVariables>;

/**
 * __useCreateTaskMutation__
 *
 * To run a mutation, you first call `useCreateTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTaskMutation, { data, loading, error }] = useCreateTaskMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateTaskMutation(baseOptions?: Apollo.MutationHookOptions<CreateTaskMutation, CreateTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateTaskMutation, CreateTaskMutationVariables>(CreateTaskDocument, options);
      }
export type CreateTaskMutationHookResult = ReturnType<typeof useCreateTaskMutation>;
export type CreateTaskMutationResult = Apollo.MutationResult<CreateTaskMutation>;
export type CreateTaskMutationOptions = Apollo.BaseMutationOptions<CreateTaskMutation, CreateTaskMutationVariables>;