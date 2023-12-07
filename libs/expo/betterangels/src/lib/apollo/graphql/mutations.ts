import { gql } from '@apollo/client';

// NOTE: we need to pass in an email from some recovery process
export const GENERATE_MAGIC_LINK_MUTATION = gql`
  mutation GenerateMagicLink {
    generateMagicLink(input: { email: "admin@ba.la" }) {
      message
    }
  }
`;

export const GOOGLE_AUTH_MUTATION = gql`
  mutation GoogleAuth(
    $code: String!
    $codeVerifier: String!
    $redirectUri: String!
  ) {
    googleAuth(
      input: {
        code: $code
        code_verifier: $codeVerifier
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
      code_verifier
    }
  }
`;

export const ID_ME_AUTH_MUTATION = gql`
  mutation GoogleAuth(
    $code: String!
    $codeVerifier: String!
    $redirectUri: String!
  ) {
    googleAuth(
      input: {
        code: $code
        code_verifier: $codeVerifier
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
      code_verifier
    }
  }
`;
