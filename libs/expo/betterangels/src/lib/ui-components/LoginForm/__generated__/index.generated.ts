import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type RequestLoginCodeMutationVariables = Types.Exact<{
  email: Types.Scalars['String']['input'];
}>;


export type RequestLoginCodeMutation = { __typename?: 'Mutation', requestLoginCode: { __typename?: 'RequestLoginCodeResponse', status: number, data: { __typename?: 'RequestLoginCodeData', flows: Array<{ __typename?: 'Flow', id: string, isPending?: boolean | null }> }, meta: { __typename?: 'AuthMeta', isAuthenticated: boolean } } };

export type ConfirmLoginCodeMutationVariables = Types.Exact<{
  code: Types.Scalars['String']['input'];
}>;


export type ConfirmLoginCodeMutation = { __typename?: 'Mutation', confirmLoginCode: { __typename?: 'ConfirmLoginCodeResponse', status: number, data: { __typename?: 'ConfirmLoginCodeData', user: { __typename?: 'AllAuthUser', id: string, display: string, email: string, username: string } }, meta: { __typename?: 'AuthMeta', isAuthenticated: boolean, sessionToken?: string | null, accessToken?: string | null } } };


export const RequestLoginCodeDocument = gql`
    mutation RequestLoginCode($email: String!) {
  requestLoginCode(input: {email: $email}) @rest(type: "RequestLoginCodeResponse", path: "/_allauth/browser/v1/auth/code/request", method: "POST", bodyKey: "input", statusCode: [200, 401]) {
    status
    data {
      flows {
        id
        isPending
      }
    }
    meta {
      isAuthenticated
    }
  }
}
    `;
export type RequestLoginCodeMutationFn = Apollo.MutationFunction<RequestLoginCodeMutation, RequestLoginCodeMutationVariables>;

/**
 * __useRequestLoginCodeMutation__
 *
 * To run a mutation, you first call `useRequestLoginCodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequestLoginCodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requestLoginCodeMutation, { data, loading, error }] = useRequestLoginCodeMutation({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useRequestLoginCodeMutation(baseOptions?: Apollo.MutationHookOptions<RequestLoginCodeMutation, RequestLoginCodeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RequestLoginCodeMutation, RequestLoginCodeMutationVariables>(RequestLoginCodeDocument, options);
      }
export type RequestLoginCodeMutationHookResult = ReturnType<typeof useRequestLoginCodeMutation>;
export type RequestLoginCodeMutationResult = Apollo.MutationResult<RequestLoginCodeMutation>;
export type RequestLoginCodeMutationOptions = Apollo.BaseMutationOptions<RequestLoginCodeMutation, RequestLoginCodeMutationVariables>;
export const ConfirmLoginCodeDocument = gql`
    mutation ConfirmLoginCode($code: String!) {
  confirmLoginCode(input: {code: $code}) @rest(type: "ConfirmLoginCodeResponse", path: "/_allauth/browser/v1/auth/code/confirm", method: "POST", bodyKey: "input", statusCode: [200, 409]) {
    status
    data {
      user {
        id
        display
        email
        username
      }
    }
    meta {
      isAuthenticated
      sessionToken
      accessToken
    }
  }
}
    `;
export type ConfirmLoginCodeMutationFn = Apollo.MutationFunction<ConfirmLoginCodeMutation, ConfirmLoginCodeMutationVariables>;

/**
 * __useConfirmLoginCodeMutation__
 *
 * To run a mutation, you first call `useConfirmLoginCodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useConfirmLoginCodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [confirmLoginCodeMutation, { data, loading, error }] = useConfirmLoginCodeMutation({
 *   variables: {
 *      code: // value for 'code'
 *   },
 * });
 */
export function useConfirmLoginCodeMutation(baseOptions?: Apollo.MutationHookOptions<ConfirmLoginCodeMutation, ConfirmLoginCodeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ConfirmLoginCodeMutation, ConfirmLoginCodeMutationVariables>(ConfirmLoginCodeDocument, options);
      }
export type ConfirmLoginCodeMutationHookResult = ReturnType<typeof useConfirmLoginCodeMutation>;
export type ConfirmLoginCodeMutationResult = Apollo.MutationResult<ConfirmLoginCodeMutation>;
export type ConfirmLoginCodeMutationOptions = Apollo.BaseMutationOptions<ConfirmLoginCodeMutation, ConfirmLoginCodeMutationVariables>;