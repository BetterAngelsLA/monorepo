import { ApolloProvider, InMemoryCache } from '@apollo/client';
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

type TProps = {
  children: ReactNode;
  cacheStore?: InMemoryCache;
};

export const ApolloClientProvider = (props: TProps) => {
  const { cacheStore, children } = props;

  const { baseUrl } = useApiConfig();

  const apolloClient = useMemo(() => {
    return createApolloClient({ apiUrl: baseUrl, cacheStore });
  }, [baseUrl]);

  if (!apolloClient) {
    return null;
  }

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};
