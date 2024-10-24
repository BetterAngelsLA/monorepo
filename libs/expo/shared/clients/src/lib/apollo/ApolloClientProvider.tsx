import {
  ApolloClient,
  ApolloProvider,
  from,
  InMemoryCache,
} from '@apollo/client';
import React, { ReactNode, useMemo } from 'react';
import { useApiConfig } from '../http';
import { createApolloClient } from './client';

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
