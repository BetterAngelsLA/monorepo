import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GoogleAuthMutationVariables = Types.Exact<{
  code: Types.Scalars['String']['input'];
  codeVerifier: Types.Scalars['String']['input'];
  redirectUri: Types.Scalars['String']['input'];
}>;


export type GoogleAuthMutation = { __typename?: 'Mutation', googleAuth: { __typename?: 'AuthResponse', status_code: string } };


export const GoogleAuthDocument = gql`
    mutation GoogleAuth($code: String!, $codeVerifier: String!, $redirectUri: String!) {
  googleAuth(
    input: {code: $code, code_verifier: $codeVerifier, redirect_uri: $redirectUri}
  ) @rest(type: "AuthResponse", path: "/rest-auth/google/?redirect_uri={args.input.redirect_uri}", method: "POST", bodyKey: "input") {
    status_code
  }
}
    `;
export type GoogleAuthMutationFn = Apollo.MutationFunction<GoogleAuthMutation, GoogleAuthMutationVariables>;

/**
 * __useGoogleAuthMutation__
 *
 * To run a mutation, you first call `useGoogleAuthMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGoogleAuthMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [googleAuthMutation, { data, loading, error }] = useGoogleAuthMutation({
 *   variables: {
 *      code: // value for 'code'
 *      codeVerifier: // value for 'codeVerifier'
 *      redirectUri: // value for 'redirectUri'
 *   },
 * });
 */
export function useGoogleAuthMutation(baseOptions?: Apollo.MutationHookOptions<GoogleAuthMutation, GoogleAuthMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<GoogleAuthMutation, GoogleAuthMutationVariables>(GoogleAuthDocument, options);
      }
export type GoogleAuthMutationHookResult = ReturnType<typeof useGoogleAuthMutation>;
export type GoogleAuthMutationResult = Apollo.MutationResult<GoogleAuthMutation>;
export type GoogleAuthMutationOptions = Apollo.BaseMutationOptions<GoogleAuthMutation, GoogleAuthMutationVariables>;