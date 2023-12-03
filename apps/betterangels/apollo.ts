import { ApolloClient, HttpLink, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { CSRF_TOKEN, getItem } from '@monorepo/expo/betterangels';
import { RestLink } from 'apollo-link-rest';
import { apiUrl } from './config';

// Context link for adding CSRF token to request headers
const authLink = setContext(async () => {
  const token = await getItem(CSRF_TOKEN);
  return {
    headers: {
      'X-CSRF-TOKEN': token || '',
    },
  };
});

const restLink = new RestLink({
  uri: apiUrl,
  credentials: 'include',
});

const httpLink = new HttpLink({
  uri: `${apiUrl}/graphql`,
  credentials: 'include',
});

const client = new ApolloClient({
  link: from([
    authLink, // Add CSRF token to request headers
    restLink, // Handle REST API requests
    httpLink, // Handle GraphQL requests
  ]),
  cache: new InMemoryCache(),
});

export default client;
