import { gql } from '@apollo/client';

export const GET_NOTES = gql`
  query Notes(
    $filters: NoteFilter
    $pagination: OffsetPaginationInput
    $order: NoteOrder
  ) {
    notes(filters: $filters, pagination: $pagination, order: $order) {
      id
      purpose
      title
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
      moods {
        id
        descriptor
      }
      purposes {
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
      isSubmitted
      client {
        id
        email
        username
        firstName
        lastName
      }
      createdBy {
        id
        email
        username
        firstName
        lastName
      }
      interactedAt
    }
  }
`;

export const GET_NOTE = gql`
  query ViewNote($id: ID!) {
    note(pk: $id) {
      id
      purpose
      title
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
      attachments {
        id
        namespace
        attachmentType
        file {
          url
          name
        }
      }
      moods {
        id
        descriptor
      }
      purposes {
        id
        title
        status
        createdAt
        createdBy {
          id
          email
          username
        }
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
      isSubmitted
      client {
        id
        email
        firstName
        lastName
      }
      createdBy {
        id
      }
      interactedAt
      createdAt
    }
  }
`;
