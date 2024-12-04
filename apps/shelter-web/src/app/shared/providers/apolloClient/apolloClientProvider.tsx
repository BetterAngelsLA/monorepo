import { ApolloProvider } from '@apollo/client';
import { ReactNode, useMemo } from 'react';
import { createApolloClient } from '../../clients/apollo/client';

export const ApolloClientProvider = ({ children }: { children: ReactNode }) => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const apolloClient = useMemo(() => {
    return createApolloClient({
      apiUrl,
    });
  }, [apiUrl]);

  if (!apolloClient) {
    return null;
  }

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};
