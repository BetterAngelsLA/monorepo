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
        heroImage(processingOptions: "rs:fit:800:800/g:ce/q:80/sm:1") {
          id
          url
        }
        photos {
          id
          type
          file {
            url
            name
          }
        }
        location {
          place
          latitude
          longitude
        }
      }
    }
  }
`;
