import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CreateClientProfileMutationVariables = Types.Exact<{
  data: Types.CreateClientProfileInput;
}>;


export type CreateClientProfileMutation = { __typename?: 'Mutation', createClientProfile: { __typename?: 'ClientProfileType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };


export const CreateClientProfileDocument = gql`
    mutation CreateClientProfile($data: CreateClientProfileInput!) {
  createClientProfile(data: $data) {
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
export type CreateClientProfileMutationFn = Apollo.MutationFunction<CreateClientProfileMutation, CreateClientProfileMutationVariables>;

/**
 * __useCreateClientProfileMutation__
 *
 * To run a mutation, you first call `useCreateClientProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateClientProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createClientProfileMutation, { data, loading, error }] = useCreateClientProfileMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateClientProfileMutation(baseOptions?: Apollo.MutationHookOptions<CreateClientProfileMutation, CreateClientProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateClientProfileMutation, CreateClientProfileMutationVariables>(CreateClientProfileDocument, options);
      }
export type CreateClientProfileMutationHookResult = ReturnType<typeof useCreateClientProfileMutation>;
export type CreateClientProfileMutationResult = Apollo.MutationResult<CreateClientProfileMutation>;
export type CreateClientProfileMutationOptions = Apollo.BaseMutationOptions<CreateClientProfileMutation, CreateClientProfileMutationVariables>;