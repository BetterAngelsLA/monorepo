import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { csrfLink } from '@monorepo/expo/betterangels';
import { isReactNativeFileInstance } from '@monorepo/expo/shared/utils';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { Platform } from 'react-native';
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
