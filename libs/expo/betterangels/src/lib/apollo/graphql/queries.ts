import { gql } from '@apollo/client';

export const GET_NOTES = gql`
  query Notes(
    $filters: NoteFilter
    $pagination: OffsetPaginationInput
    $order: NoteOrder
  ) {
    notes(filters: $filters, pagination: $pagination, order: $order) {
      totalCount
      pageInfo {
        limit
        offset
      }
      results {
        id
        purpose
        team
        organization {
          id
          name
        }
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
        clientProfile {
          id
          email
          firstName
          lastName
          # TODO: displayCaseManager and user required for typecheck. remove in clean up
          displayCaseManager
          profilePhoto {
            name
            url
          }
          user {
            id
            username
          }
          profilePhoto {
            url
          }
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

export const GET_NOTE = gql`
  query ViewNote($id: ID!) {
    note(pk: $id) {
      id
      purpose
      team
      organization {
        id
        name
      }
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
      clientProfile {
        id
        email
        firstName
        lastName
        profilePhoto {
          url
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
