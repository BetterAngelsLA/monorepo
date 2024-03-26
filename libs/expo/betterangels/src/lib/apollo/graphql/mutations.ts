import { gql } from '@apollo/client';

// NOTE: we need to pass in an email from some recovery process
export const GENERATE_MAGIC_LINK_MUTATION = gql`
  mutation GenerateMagicLink {
    generateMagicLink(data: { email: "paul+test@betterangels.la" }) {
      message
    }
  }
`;

export const CREATE_NOTE = gql`
  mutation CreateNote($data: CreateNoteInput!) {
    createNote(data: $data) {
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

export const UPDATE_NOTE = gql`
  mutation UpdateNote($data: UpdateNoteInput!) {
    updateNote(data: $data) {
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
export const DELETE_NOTE = gql`
  mutation DeleteNote($data: DeleteDjangoObjectInput!) {
    deleteNote(data: $data) {
      ... on NoteType {
        id
      }
    }
  }
`;

export const CREATE_NOTE_ATTACHMENT = gql`
  mutation CreateNoteAttachment($data: CreateNoteAttachmentInput!) {
    createNoteAttachment(data: $data) {
      ... on NoteAttachmentType {
        id
      }
    }
  }
`;

export const DELETE_NOTE_ATTACHMENT = gql`
  mutation DeleteNoteAttachment($data: DeleteDjangoObjectInput!) {
    deleteNoteAttachment(data: $data) {
      ... on NoteAttachmentType {
        id
      }
    }
  }
`;
