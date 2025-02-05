// Import necessary modules and components
import {
  ApolloClient,
  from,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';

import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { Platform } from 'react-native';
import { isReactNativeFileInstance } from './ReactNativeFile';
import { requestAuthLink, responseInterceptor } from './links';

/**
 * Creates an Apollo Client instance configured with the provided API URL.
 *
 * @param apiUrl - The base URL of the API to connect to.
 * @returns A configured Apollo Client instance.
 */
export const createApolloClient = (
  apiUrl: string
): ApolloClient<NormalizedCacheObject> => {
  const getHeaders = () =>
    Platform.OS !== 'web' ? { Referer: apiUrl } : undefined;

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

  return new ApolloClient({
    link: from([
      requestAuthLink, // Sets CSRF header on outgoing requests
      responseInterceptor, // Processes incoming responses
      uploadLink, // Actual HTTP link
      restLink, // REST API link
    ]),
    cache: new InMemoryCache(),
  });
};
