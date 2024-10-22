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
      }
      createdBy {
        id
      }
      interactedAt
      createdAt
    }
  }
`;

// Google Maps Queries
export const SEARCH_PLACES = gql`
  query SearchPlaces($input: PlaceAutocompleteInput!) {
    searchPlaces(input: $input)
      @rest(
        type: "PlaceAutocompleteResponse"
        path: "/proxy/maps/api/place/autocomplete/json?input={args.input.input}&components={args.input.components}&language={args.input.language}&location={args.input.location}&locationbias={args.input.locationbias}&locationrestriction={args.input.locationrestriction}&offset={args.input.offset}&origin={args.input.origin}&radius={args.input.radius}&region={args.input.region}&sessiontoken={args.input.sessiontoken}&strictbounds={args.input.strictbounds}&types={args.input.types}"
      ) {
      predictions {
        description
        placeId
        matchedSubstrings {
          length
          offset
        }
        structuredFormatting {
          mainText
          secondaryText
        }
        terms {
          offset
          value
        }
        distanceMeters
        types
      }
      status
      errorMessage
      infoMessages
    }
  }
`;
