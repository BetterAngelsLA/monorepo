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

export const CREATE_SERVICE = gql`
  mutation CreateServiceRequest($data: CreateServiceRequestInput!) {
    createServiceRequest(data: $data) {
      ... on ServiceRequestType {
        id
        service
      }
    }
  }
`;

export const DELETE_SERVICE = gql`
  mutation DeleteServiceRequest($data: DeleteDjangoObjectInput!) {
    deleteServiceRequest(data: $data) {
      ... on ServiceRequestType {
        id
      }
    }
  }
`;

export const CREATE_NOTE_MOOD = gql`
  mutation CreateNoteMood($data: CreateNoteMoodInput!) {
    createNoteMood(data: $data) {
      ... on OperationInfo {
        messages {
          kind
          field
          message
        }
      }
      ... on MoodType {
        id
        descriptor
      }
    }
  }
`;

export const DELETE_MOOD = gql`
  mutation DeleteMood($id: ID!) {
    deleteMood(data: { id: $id }) {
      ... on OperationInfo {
        messages {
          kind
          field
          message
        }
      }
      ... on DeletedObjectType {
        id
      }
    }
  }
`;
