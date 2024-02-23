import { gql } from '@apollo/client';

export const GET_CURRENT_USER = gql`
  query currentUser {
    currentUser {
      id
      username
      firstName
      lastName
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
      publicDetails
      client {
        id
      }
    }
  }
`;
