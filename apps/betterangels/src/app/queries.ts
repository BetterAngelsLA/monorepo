import { gql } from '@apollo/client';

/*
Note, we should decide where we actually are going to store our mutations
and queries
*/

export const GET_CURRENT_USER = gql`
  query currentUser {
    currentUser {
      id
      username
      email
    }
  }
`;
