import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type HmisLoginMutationVariables = Types.Exact<{
  email: Types.Scalars['String']['input'];
  password: Types.Scalars['String']['input'];
}>;


export type HmisLoginMutation = { __typename?: 'Mutation', hmisLogin: { __typename?: 'HmisLoginError', field?: string | null, message: string } | { __typename?: 'HmisLoginSuccess', hmisToken: string } };


export const HmisLoginDocument = gql`
    mutation HMISLogin($email: String!, $password: String!) {
  hmisLogin(email: $email, password: $password) {
    ... on HmisLoginSuccess {
      hmisToken
    }
    ... on HmisLoginError {
      field
      message
    }
  }
}
    `;
export type HmisLoginMutationFn = Apollo.MutationFunction<HmisLoginMutation, HmisLoginMutationVariables>;

/**
 * __useHmisLoginMutation__
 *
 * To run a mutation, you first call `useHmisLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useHmisLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [hmisLoginMutation, { data, loading, error }] = useHmisLoginMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useHmisLoginMutation(baseOptions?: Apollo.MutationHookOptions<HmisLoginMutation, HmisLoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<HmisLoginMutation, HmisLoginMutationVariables>(HmisLoginDocument, options);
      }
export type HmisLoginMutationHookResult = ReturnType<typeof useHmisLoginMutation>;
export type HmisLoginMutationResult = Apollo.MutationResult<HmisLoginMutation>;
export type HmisLoginMutationOptions = Apollo.BaseMutationOptions<HmisLoginMutation, HmisLoginMutationVariables>;