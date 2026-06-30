import type { ApolloLink } from '@apollo/client';
import { InMemoryCache, TypePolicies } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { createApolloCache } from '@monorepo/apollo';
import React, { ReactNode, useMemo } from 'react';
import { useApiConfig } from '../http';
import { createApolloClient } from './client';

/**
 * ApolloClientProvider component that initializes the Apollo Client instance
 * based on the current base URL from the ApiConfigContext.
 * It recreates the Apollo Client when the base URL changes.
 */

type TProps = {
  children: ReactNode;
  cacheStore?: InMemoryCache;
  typePolicies?: TypePolicies;
  onUnauthenticated?: () => void;
  authPath?: string;
  /** Additional Apollo Links to compose into the link chain (e.g. orgLink). */
  links?: ApolloLink[];
};

export const ApolloClientProvider = (props: TProps) => {
  const { typePolicies, cacheStore, children, authPath, onUnauthenticated, links } =
    props;

  const { baseUrl } = useApiConfig();

  const cache = useMemo(
    () => cacheStore || createApolloCache({ typePolicies }),
    [cacheStore, typePolicies]
  );

  const apolloClient = useMemo(() => {
    return createApolloClient({
      apiUrl: baseUrl,
      cacheStore: cache,
      onUnauthenticated,
      authPath,
      links,
    });
  }, [baseUrl, cache, onUnauthenticated, authPath, links]);

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};
