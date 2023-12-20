import { gql } from '@apollo/client';

// NOTE: we need to pass in an email from some recovery process
export const GENERATE_MAGIC_LINK_MUTATION = gql`
  mutation GenerateMagicLink {
    generateMagicLink(input: { email: "paul+test@betterangels.la" }) {
      message
    }
  }
`;

export const CREATE_NOTE = gql`
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      id
      title
      body
      createdAt
      createdBy {
        id
        username
        email
      }
    }
  }
`;

export const UPDATE_NOTE = gql`
  mutation UpdateNote($input: UpdateNoteInput!) {
    updateNote(input: $input) {
      id
      title
      body
      createdAt
      createdBy {
        id
        username
        email
      }
    }
  }
`;
