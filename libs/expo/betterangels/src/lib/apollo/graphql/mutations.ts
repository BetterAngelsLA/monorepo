import { gql } from '@apollo/client';

// NOTE: we need to pass in an email from some recovery process
export const GENERATE_MAGIC_LINK_MUTATION = gql`
  mutation GenerateMagicLink {
    generateMagicLink(data: { email: "paul+test@betterangels.la" }) {
      message
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
        service
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
  mutation DeleteMood($data: DeleteDjangoObjectInput!) {
    deleteMood(data: $data) {
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

export const CREATE_NOTE_TASK = gql`
  mutation CreateNoteTask($data: CreateNoteTaskInput!) {
    createNoteTask(data: $data) {
      ... on OperationInfo {
        messages {
          kind
          field
          message
        }
      }
      ... on TaskType {
        id
        title
        status
        dueBy
        client {
          id
        }
        createdBy {
          id
        }
        createdAt
      }
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($data: UpdateTaskInput!) {
    updateTask(data: $data) {
      ... on OperationInfo {
        messages {
          kind
          field
          message
        }
      }
      ... on TaskType {
        id
        title
        status
        dueBy
        client {
          id
        }
        createdBy {
          id
        }
        createdAt
      }
    }
  }
`;
export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(data: { id: $id }) {
      ... on OperationInfo {
        messages {
          kind
          field
          message
        }
      }
      ... on TaskType {
        id
      }
    }
  }
`;

export const CREATE_NOTE_ATTACHMENT = gql`
  mutation CreateNoteAttachment(
    $noteId: ID!
    $namespace: NoteNamespaceEnum!
    $file: Upload!
  ) {
    createNoteAttachment(
      data: { note: $noteId, namespace: $namespace, file: $file }
    ) {
      ... on OperationInfo {
        messages {
          kind
          field
          message
        }
      }
      ... on NoteAttachmentType {
        id
        attachmentType
        file {
          name
        }
        originalFilename
        namespace
      }
    }
  }
`;

export const DELETE_NOTE_ATTACHMENT = gql`
  mutation DeleteNoteAttachment($attachmentId: ID!) {
    deleteNoteAttachment(data: { id: $attachmentId }) {
      ... on OperationInfo {
        messages {
          kind
          field
          message
        }
      }
      ... on NoteAttachmentType {
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
