import { gql } from '@apollo/client';

export const GET_NOTES = gql`
  query Notes(
    $filters: NoteFilter
    $pagination: OffsetPaginationInput
    $ordering: [NoteOrder!]! = []
  ) {
    notes(filters: $filters, pagination: $pagination, ordering: $ordering) {
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
        providedServices {
          id
          service {
            id
            label
            category {
              id
            }
          }
        }
        requestedServices {
          id
          service {
            id
            label
            category {
              id
            }
          }
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
      providedServices {
        id
        service {
          id
          label
          category {
            id
          }
        }
      }
      requestedServices {
        id
        service {
          id
          label
          category {
            id
          }
        }
      }
      tasks {
        id
        summary
        team
        description
        status
        createdAt
        updatedAt
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
