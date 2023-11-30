import { ApolloClient, InMemoryCache } from '@apollo/client';
import { apiUrl } from './config';

const client = new ApolloClient({
  uri: `${apiUrl}/graphql`,
  cache: new InMemoryCache(),
});

export default client;
