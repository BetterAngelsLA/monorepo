import { gql } from '@apollo/client';

export const GET_NOTES = gql`
  query notes {
    notes {
      id
      title
      publicDetails
      createdAt
    }
  }
`;

export const GET_NOTE = gql`
  query ViewNote($id: ID!) {
    note(pk: $id) {
      id
      title
      point
      address {
        street
        city
        state
        zipCode
      }
      moods {
        descriptor
      }
      purposes {
        id
        title
      }
      nextSteps {
        id
        title
      }
      providedServices {
        id
        service
        customService
      }
      requestedServices {
        id
        service
        customService
      }
      publicDetails
      privateDetails
      isSubmitted
      client {
        id
      }
      createdBy {
        id
      }
      interactedAt
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
        redirect_uri: $redirectUri
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

export const IDME_AUTH_MUTATION = gql`
  mutation IdmeAuth(
    $code: String!
    $codeVerifier: String!
    $redirectUri: String!
  ) {
    idmeAuth(
      input: {
        code: $code
        code_verifier: $codeVerifier
        redirect_uri: $redirectUri
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
