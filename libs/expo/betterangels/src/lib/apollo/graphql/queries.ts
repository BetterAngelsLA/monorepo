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
      body
      createdAt
    }
  }
`;

export const GET_NOTES_TEST = gql`
  query notes_test {
    notes {
      id
      title
      body
    }
  }
`;
