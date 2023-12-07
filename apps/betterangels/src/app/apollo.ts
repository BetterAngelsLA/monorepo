import { ApolloClient, HttpLink, InMemoryCache, from } from '@apollo/client';
import { csrfLink } from '@monorepo/expo/betterangels';
import { RestLink } from 'apollo-link-rest';
import { apiUrl } from '../../config';

const restLink = new RestLink({
  uri: apiUrl,
  credentials: 'include',
});

const httpLink = new HttpLink({
  uri: `${apiUrl}/graphql`,
  credentials: 'include',
});

const client = new ApolloClient({
  link: from([csrfLink, restLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
