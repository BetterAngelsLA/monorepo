import { gql } from '@apollo/client';

export const GET_SHELTER_QUERY = gql`
  query ViewShelter($id: ID!) {
    shelter(pk: $id) {
      name
      phone
      demographics {
        name
      }
      storage {
        name
      }
      exteriorPhotos {
        id
        createdAt
        file {
          url
        }
      }
    }
  }
`;
