import { gql } from '@apollo/client';

export const DELETE_CURRENT_USER = gql`
  mutation DeleteCurrentUser {
    deleteCurrentUser {
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

export const UPDATE_NOTE = gql`
  mutation UpdateNote($data: UpdateNoteInput!) {
    updateNote(data: $data) {
      ... on NoteType {
        id
        purpose
        publicDetails
        clientProfile {
          id
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
export const REVERT_NOTE = gql`
  mutation RevertNote($data: RevertNoteInput!) {
    revertNote(data: $data) {
      ... on NoteType {
        id
        purpose
        location {
          address {
            id
            street
            city
            state
            zipCode
          }
          point
          pointOfInterest
        }
        providedServices {
          id
          serviceEnum
          serviceOther
        }
        requestedServices {
          id
          serviceEnum
          serviceOther
        }
        publicDetails
        isSubmitted
        clientProfile {
          id
        }
        createdBy {
          id
        }
        interactedAt
        createdAt
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

export const CREATE_NOTE_SERVICE_REQUEST = gql`
  mutation CreateNoteServiceRequest($data: CreateNoteServiceRequestInput!) {
    createNoteServiceRequest(data: $data) {
      ... on OperationInfo {
        messages {
          kind
          field
          message
        }
      }
      ... on ServiceRequestType {
        id
        serviceEnum
      }
    }
  }
`;

export const DELETE_SERVICE_REQUEST = gql`
  mutation DeleteServiceRequest($data: DeleteDjangoObjectInput!) {
    deleteServiceRequest(data: $data) {
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

export const UPDATE_NOTE_LOCATION = gql`
  mutation UpdateNoteLocation($data: UpdateNoteLocationInput!) {
    updateNoteLocation(data: $data) {
      ... on OperationInfo {
        messages {
          kind
          field
          message
        }
      }
      ... on NoteType {
        id
        location {
          address {
            id
            street
            city
            state
            zipCode
          }
          point
          pointOfInterest
        }
      }
    }
  }
`;
