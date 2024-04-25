import { gql } from '@apollo/client';

export const GET_NOTES = gql`
  query Notes($filters: NoteFilter, $pagination: OffsetPaginationInput) {
    notes(filters: $filters, pagination: $pagination) {
      id
      title
      point
      address {
        id
        street
        city
        state
        zipCode
      }
      moods {
        id
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
        email
        username
      }
      createdBy {
        id
        email
        username
      }
      interactedAt
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
        id
        street
        city
        state
        zipCode
      }
      attachments {
        id
        namespace
        attachmentType
      }
      moods {
        id
        descriptor
      }
      purposes {
        id
        title
        status
        createdAt
        createdBy {
          id
          email
          username
        }
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
      createdAt
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
        path: "/rest-auth/google/?redirect_uri={args.input.redirect_uri}"
        method: "POST"
        bodyKey: "input"
      ) {
      status_code
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
        path: "/rest-auth/idme/?redirect_uri={args.input.redirect_uri}"
        method: "POST"
        bodyKey: "input"
      ) {
      status_code
    }
  }
`;
