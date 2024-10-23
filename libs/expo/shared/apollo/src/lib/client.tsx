// Import necessary modules and components
import {
  ApolloClient,
  ApolloProvider,
  from,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';
import { setItem } from '@monorepo/expo/shared/utils';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { CSRF_COOKIE_NAME } from './links';
import { csrfLink } from './links/csrf';

import { useApiConfig } from '@monorepo/expo/shared/providers';
import { isReactNativeFileInstance } from './ReactNativeFile';

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

/**
 * ApolloClientProvider component that initializes the Apollo Client instance
 * based on the current base URL from the ApiConfigContext.
 * It recreates the Apollo Client when the base URL changes.
 *
 * @param props - The props for the component, including children.
 * @returns A provider component that supplies the Apollo Client to its children.
 */
export const ApolloClientProvider = ({ children }: { children: ReactNode }) => {
  const { baseUrl } = useApiConfig();

  // Clear CSRF cookie when baseUrl changes
  useEffect(() => {
    const clearCSRF = async () => {
      console.log('clearing csrf');
      try {
        await setItem(CSRF_COOKIE_NAME, '');
      } catch (error) {
        console.error('Error clearing CSRF token', error);
      }
    };

    clearCSRF();
  }, [baseUrl]);

  const apolloClient = useMemo(() => {
    if (!baseUrl) {
      return new ApolloClient({
        cache: new InMemoryCache(),
        link: from([]),
      });
    }
    return createApolloClient(baseUrl);
  }, [baseUrl]);

  if (!apolloClient) {
    return null;
  }

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};
