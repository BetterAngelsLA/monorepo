import { gql } from '@apollo/client';

export const GET_NOTES = gql`
  query Notes(
    $filters: NoteFilter
    $pagination: OffsetPaginationInput
    $order: NoteOrder
  ) {
    notes(filters: $filters, pagination: $pagination, order: $order) {
      id
      title
      point
      address {
        id
        street
        city
        state
        zipCode
      }
      moods {
        id
        descriptor
      }
      purposes {
        id
        title
      }
      nextSteps {
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
      privateDetails
      isSubmitted
      client {
        id
        email
        username
      }
      createdBy {
        id
        email
        username
      }
      interactedAt
    }
  }
`;

export const GET_NOTE = gql`
  query ViewNote($id: ID!) {
    note(pk: $id) {
      id
      title
      point
      address {
        id
        street
        city
        state
        zipCode
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
      nextSteps {
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
      privateDetails
      isSubmitted
      client {
        id
      }
      createdBy {
        id
      }
      interactedAt
      createdAt
    }
  }
`;
