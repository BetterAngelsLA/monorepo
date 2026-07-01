import { ApolloClient, ApolloLink, InMemoryCache, TypePolicies } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { createApolloCache } from '@monorepo/apollo';
import { ReactNode, useMemo } from 'react';

type TProps = {
  children: ReactNode;
  link: ApolloLink;
  typePolicies?: TypePolicies;
  cache?: InMemoryCache;
};

export const ApolloClientProvider = ({ children, link, cache, typePolicies }: TProps) => {
  const resolvedCache = useMemo(
    () => cache ?? createApolloCache({ typePolicies }),
    [cache, typePolicies]
  );

  const client = useMemo(
    () =>
      new ApolloClient({
        link,
        cache: resolvedCache,
        defaultOptions: { watchQuery: { notifyOnNetworkStatusChange: false } },
      }),
    [link, resolvedCache]
  );
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
