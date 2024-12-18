import { gql } from '@apollo/client';

export const GET_SHELTERS_QUERY = gql`
  query ViewShelters($offset: Int, $limit: Int) {
    shelters(pagination: { offset: $offset, limit: $limit }) {
      totalCount
      pageInfo {
        limit
        offset
      }
      results {
        id
        name
        heroImage
        location {
          place
          latitude
          longitude
        }
      }
    }
  }
`;
