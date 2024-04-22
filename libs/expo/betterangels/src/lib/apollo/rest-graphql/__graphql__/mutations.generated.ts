import * as Types from '../../../../types';

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
