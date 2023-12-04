import { gql, useQuery } from '@apollo/client';

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      // specify the fields you need, for example:
      id
      name
      email
    }
  }
`;

export function useCurrentUser() {
  const { data, loading, error } = useQuery(GET_CURRENT_USER, {});

  // Handle the loading state
  if (loading) {
    return { loading };
  }

  // Handle the error state
  if (error) {
    console.error('Error fetching current user:', error);
    return { error };
  }

  // Return the fetched data
  return { user: data?.currentUser };
}
