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
      team
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
      providedServices {
        id
        service
        serviceOther
      }
      requestedServices {
        id
        service
        serviceOther
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
      team
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
      providedServices {
        id
        service
        serviceOther
      }
      requestedServices {
        id
        service
        serviceOther
      }
      publicDetails
      isSubmitted
      client {
        id
        email
        firstName
        lastName
        clientProfile {
          id: pk
        }
      }
      createdBy {
        id
      }
      interactedAt
      createdAt
    }
  }
`;

export const GET_NOTES_PAGINATED = gql`
  query NotesPaginated(
    $filters: NoteFilter
    $pagination: OffsetPaginationInput
    $order: NoteOrder
  ) {
    notesPaginated(filters: $filters, pagination: $pagination, order: $order) {
      totalCount
      pageInfo {
        limit
        offset
      }
      results {
        id
        purpose
        team
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
        providedServices {
          id
          service
          serviceOther
        }
        requestedServices {
          id
          service
          serviceOther
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
  }
`;

export const GET_INTERACTION_AUTHORS = gql`
 query InteractionAuthors(
    $filters: InteractionAuthorFilter
    $pagination: OffsetPaginationInput
 ) {
  interactionAuthors(filters: $filters, pagination: $pagination) {
    totalCount
    results {
      firstName
      id
      lastName
      middleName
    }
    pageInfo {
      limit
      offset
    }
  }
 }
`;
