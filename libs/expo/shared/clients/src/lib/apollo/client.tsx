// Import necessary modules and components
import {
  ApolloClient,
  from,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';
import {
  csrfLink,
  isReactNativeFileInstance,
} from '@monorepo/expo/shared/clients';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { Platform } from 'react-native';

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
    link: from([csrfLink(`${apiUrl}/admin/login/`), restLink, uploadLink]),
    cache: new InMemoryCache(),
  });
};
