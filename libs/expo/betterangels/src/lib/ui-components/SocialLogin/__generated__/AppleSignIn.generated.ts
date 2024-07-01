import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type AppleAuthMutationVariables = Types.Exact<{
  idToken: Types.Scalars['String']['input'];
}>;


export type AppleAuthMutation = { __typename?: 'Mutation', appleAuth: { __typename?: 'AuthResponse', status_code: string } };


export const AppleAuthDocument = gql`
    mutation AppleAuth($idToken: String!) {
  appleAuth(input: {id_token: $idToken}) @rest(type: "AuthResponse", path: "/rest-auth/apple/", method: "POST", bodyKey: "input") {
    status_code
  }
}
    `;
export type AppleAuthMutationFn = Apollo.MutationFunction<AppleAuthMutation, AppleAuthMutationVariables>;

/**
 * __useAppleAuthMutation__
 *
 * To run a mutation, you first call `useAppleAuthMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAppleAuthMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [appleAuthMutation, { data, loading, error }] = useAppleAuthMutation({
 *   variables: {
 *      idToken: // value for 'idToken'
 *   },
 * });
 */
export function useAppleAuthMutation(baseOptions?: Apollo.MutationHookOptions<AppleAuthMutation, AppleAuthMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AppleAuthMutation, AppleAuthMutationVariables>(AppleAuthDocument, options);
      }
export type AppleAuthMutationHookResult = ReturnType<typeof useAppleAuthMutation>;
export type AppleAuthMutationResult = Apollo.MutationResult<AppleAuthMutation>;
export type AppleAuthMutationOptions = Apollo.BaseMutationOptions<AppleAuthMutation, AppleAuthMutationVariables>;