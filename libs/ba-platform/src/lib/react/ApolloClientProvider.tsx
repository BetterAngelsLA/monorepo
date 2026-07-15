import { ApolloClient, ApolloLink, InMemoryCache, TypePolicies } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { createApolloCache } from '@monorepo/apollo';
import { ReactNode, useEffect, useMemo, useRef } from 'react';

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

  // Stop in-flight queries when the client is replaced (e.g. on env switch)
  // or when the provider unmounts entirely.
  const clientRef = useRef(client);
  useEffect(() => {
    clientRef.current = client;
    return () => {
      clientRef.current.stop();
    };
  }, [client]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
