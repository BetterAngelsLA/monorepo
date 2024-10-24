import {
  ApolloClient,
  ApolloProvider,
  from,
  InMemoryCache,
} from '@apollo/client';
import { setItem } from '@monorepo/expo/shared/utils';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { useApiConfig } from '../http';
import { createApolloClient } from './client';
import { CSRF_COOKIE_NAME } from './links/constants';

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
    console.log(baseUrl);
    return createApolloClient(baseUrl);
  }, [baseUrl]);

  if (!apolloClient) {
    return null;
  }

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};
