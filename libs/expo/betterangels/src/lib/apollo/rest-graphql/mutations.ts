import { gql } from '@apollo/client';

export const GOOGLE_AUTH_MUTATION = gql`
  mutation GoogleAuth(
    $code: String!
    $codeVerifier: String!
    $redirectUri: String!
  ) {
    googleAuth(
      input: {
        code: $code
        codeVerifier: $codeVerifier
        redirectUri: $redirectUri
      }
    )
      @rest(
        type: "AuthResponse"
        path: "/rest-auth/google/?redirect_uri={args.input.redirectUri}"
        method: "POST"
        bodyKey: "input"
      ) {
      code
      codeVerifier
    }
  }
`;

export const IDME_AUTH_MUTATION = gql`
  mutation IdmeAuth(
    $code: String!
    $codeVerifier: String!
    $redirectUri: String!
  ) {
    idmeAuth(
      input: {
        code: $code
        codeVerifier: $codeVerifier
        redirectUri: $redirectUri
      }
    )
      @rest(
        type: "AuthResponse"
        path: "/rest-auth/idme/?redirect_uri={args.input.redirectUri}"
        method: "POST"
        bodyKey: "input"
      ) {
      code
      codeVerifier
    }
  }
`;
