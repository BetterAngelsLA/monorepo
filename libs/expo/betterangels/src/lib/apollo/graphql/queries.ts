import { gql } from '@apollo/client';

export const GET_CURRENT_USER = gql`
  query currentUser {
    currentUser {
      id
      username
      email
    }
  }
`;

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
