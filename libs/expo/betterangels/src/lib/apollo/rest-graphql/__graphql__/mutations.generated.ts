import * as Types from '../../../../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GoogleAuthMutationVariables = Types.Exact<{
  code: Types.Scalars['String']['input'];
  codeVerifier: Types.Scalars['String']['input'];
  redirectUri: Types.Scalars['String']['input'];
}>;


export type GoogleAuthMutation = { __typename?: 'Mutation', googleAuth: { __typename?: 'AuthResponse', code: string, code_verifier: string } };

export type IdmeAuthMutationVariables = Types.Exact<{
  code: Types.Scalars['String']['input'];
  codeVerifier: Types.Scalars['String']['input'];
  redirectUri: Types.Scalars['String']['input'];
}>;


export type IdmeAuthMutation = { __typename?: 'Mutation', idmeAuth: { __typename?: 'AuthResponse', code: string, code_verifier: string } };


export const GoogleAuthDocument = gql`
    mutation GoogleAuth($code: String!, $codeVerifier: String!, $redirectUri: String!) {
  googleAuth(
    input: {code: $code, code_verifier: $codeVerifier, redirect_uri: $redirectUri}
  ) @rest(type: "AuthResponse", path: "/rest-auth/google/?redirect_uri={args.input.redirectUri}", method: "POST", bodyKey: "input") {
    code
    code_verifier
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
export const IdmeAuthDocument = gql`
    mutation IdmeAuth($code: String!, $codeVerifier: String!, $redirectUri: String!) {
  idmeAuth(
    input: {code: $code, code_verifier: $codeVerifier, redirect_uri: $redirectUri}
  ) @rest(type: "AuthResponse", path: "/rest-auth/idme/?redirect_uri={args.input.redirectUri}", method: "POST", bodyKey: "input") {
    code
    code_verifier
  }
}
    `;
export type IdmeAuthMutationFn = Apollo.MutationFunction<IdmeAuthMutation, IdmeAuthMutationVariables>;

/**
 * __useIdmeAuthMutation__
 *
 * To run a mutation, you first call `useIdmeAuthMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIdmeAuthMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [idmeAuthMutation, { data, loading, error }] = useIdmeAuthMutation({
 *   variables: {
 *      code: // value for 'code'
 *      codeVerifier: // value for 'codeVerifier'
 *      redirectUri: // value for 'redirectUri'
 *   },
 * });
 */
export function useIdmeAuthMutation(baseOptions?: Apollo.MutationHookOptions<IdmeAuthMutation, IdmeAuthMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IdmeAuthMutation, IdmeAuthMutationVariables>(IdmeAuthDocument, options);
      }
export type IdmeAuthMutationHookResult = ReturnType<typeof useIdmeAuthMutation>;
export type IdmeAuthMutationResult = Apollo.MutationResult<IdmeAuthMutation>;
export type IdmeAuthMutationOptions = Apollo.BaseMutationOptions<IdmeAuthMutation, IdmeAuthMutationVariables>;