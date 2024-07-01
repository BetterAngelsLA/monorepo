import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type LoginFormMutationVariables = Types.Exact<{
  username: Types.Scalars['String']['input'];
  password: Types.Scalars['String']['input'];
}>;


export type LoginFormMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthResponse', status_code: string } };


export const LoginFormDocument = gql`
    mutation LoginForm($username: String!, $password: String!) {
  login(input: {username: $username, password: $password}) @rest(type: "AuthResponse", path: "/rest-auth/login/", method: "POST", bodyKey: "input") {
    status_code
  }
}
    `;
export type LoginFormMutationFn = Apollo.MutationFunction<LoginFormMutation, LoginFormMutationVariables>;

/**
 * __useLoginFormMutation__
 *
 * To run a mutation, you first call `useLoginFormMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginFormMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginFormMutation, { data, loading, error }] = useLoginFormMutation({
 *   variables: {
 *      username: // value for 'username'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginFormMutation(baseOptions?: Apollo.MutationHookOptions<LoginFormMutation, LoginFormMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginFormMutation, LoginFormMutationVariables>(LoginFormDocument, options);
      }
export type LoginFormMutationHookResult = ReturnType<typeof useLoginFormMutation>;
export type LoginFormMutationResult = Apollo.MutationResult<LoginFormMutation>;
export type LoginFormMutationOptions = Apollo.BaseMutationOptions<LoginFormMutation, LoginFormMutationVariables>;