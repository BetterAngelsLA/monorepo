import { ApolloProvider, InMemoryCache } from '@apollo/client';
import { TCachePolicyConfig, createApolloCache } from '@monorepo/apollo';
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
  policyConfig?: TCachePolicyConfig;
  onUnauthenticated?: () => void;
  authPath?: string;
  debugMode?: boolean;
};

export const ApolloClientProvider = (props: TProps) => {
  const {
    policyConfig,
    cacheStore,
    children,
    authPath,
    onUnauthenticated,
    debugMode,
  } = props;

  const { baseUrl } = useApiConfig();

  const cache = cacheStore || createApolloCache({ policyConfig });

  const apolloClient = useMemo(() => {
    return createApolloClient({
      apiUrl: baseUrl,
      cacheStore: cache,
      onUnauthenticated,
      authPath,
      debugMode,
    });
  }, [baseUrl]);

  if (!apolloClient) {
    return null;
  }

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};
