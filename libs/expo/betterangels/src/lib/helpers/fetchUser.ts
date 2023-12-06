import { ApolloClient, gql } from '@apollo/client';

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

export default async function fetchUser(apolloClient: ApolloClient<object>) {
  try {
    const { data } = await apolloClient.query({
      query: GET_CURRENT_USER,
      fetchPolicy: 'network-only', // Ensures fresh data is fetched
    });
    return {
      id: data.currentUser.id,
      user: data.currentUser.username,
      email: data.currentUser.email,
      hasOrganization: true,
    };
  } catch (e) {
    console.log('Error getting user:', e);
  }
  return undefined;
}
