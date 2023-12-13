import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from '@apollo/client';
import { csrfLink } from '@monorepo/expo/betterangels';
import { RestLink } from 'apollo-link-rest';
import { Platform } from 'react-native'; // Import Platform from React Native
import { apiUrl } from '../../config';

// Function to conditionally set headers based on the platform
const getHeaders = (): { [key: string]: string } | undefined => {
  if (Platform.OS !== 'web') {
    return {
      Referer: apiUrl,
    };
  }
  return undefined;
};

const restLink = new RestLink({
  uri: apiUrl,
  credentials: 'include',
  headers: getHeaders(),
});

const httpLink = createHttpLink({
  uri: `${apiUrl}/graphql`,
  credentials: 'include',
  headers: getHeaders(),
});

const client = new ApolloClient({
  link: from([csrfLink(`${apiUrl}/accounts/login`), restLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
