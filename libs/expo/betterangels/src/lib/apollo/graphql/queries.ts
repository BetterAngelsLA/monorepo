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

export const VIEW_NOTE = gql`
  query ViewNote($id: ID!) {
    note(id: $id) {
      id
      title
      publicDetails
    }
  }
`;
