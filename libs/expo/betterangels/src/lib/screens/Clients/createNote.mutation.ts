import { gql } from '@apollo/client';

export const CREATE_NOTE = gql`
  mutation CreateNote($data: CreateNoteInput!) {
    createNote(data: $data) {
      ... on OperationInfo {
        messages {
          kind
          field
          message
        }
      }

      ... on NoteType {
        id
        title
        publicDetails
        client {
          id
          username
          firstName
          lastName
          email
        }
        createdAt
        createdBy {
          id
          username
          email
        }
      }
    }
  }
`;
