import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import {
  csrfLink,
  isReactNativeFileInstance,
} from '@monorepo/expo/shared/apollo';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { Platform } from 'react-native';
// DEV-445 - Implement Import Aliases to Replace Long Relative Paths
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

const uploadLink = createUploadLink({
  uri: `${apiUrl}/graphql`,
  credentials: 'include',
  headers: getHeaders(),
  isExtractableFile: isReactNativeFileInstance,
});

const restLink = new RestLink({
  uri: apiUrl,
  credentials: 'include',
  headers: getHeaders(),
});

const client = new ApolloClient({
  link: from([csrfLink(`${apiUrl}/accounts/login`), restLink, uploadLink]),
  cache: new InMemoryCache(),
});

export default client;
