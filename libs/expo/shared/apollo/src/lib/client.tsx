import {
  ApolloClient,
  ApolloProvider,
  from,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Platform } from 'react-native';
import { isReactNativeFileInstance } from './ReactNativeFile';
import { csrfLink } from './links/csrf';

// Function to create Apollo Client
export const createApolloClient = (
  apiUrl: string
): ApolloClient<NormalizedCacheObject> => {
  const getHeaders = () => {
    if (Platform.OS !== 'web') {
      return {
        Referer: apiUrl,
      };
    }
    return undefined;
  };

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
    link: from([csrfLink(`${apiUrl}/accounts/login`), restLink, uploadLink]),
    cache: new InMemoryCache(),
  });
};

interface ApolloClientContextType {
  switchToProduction: () => void;
  switchToDemo: () => void;
  currentClient: 'production' | 'demo';
}

const ApolloClientContext = createContext<ApolloClientContextType | undefined>(
  undefined
);

interface ApolloClientProviderProps {
  children: ReactNode;
  productionClient: ApolloClient<NormalizedCacheObject>;
  demoClient: ApolloClient<NormalizedCacheObject>;
}

export const ApolloClientProvider = ({
  children,
  productionClient,
  demoClient,
}: ApolloClientProviderProps) => {
  const [activeClient, setActiveClient] = useState(productionClient);
  const [currentClient, setCurrentClient] = useState<'production' | 'demo'>(
    'production'
  );

  const switchToProduction = () => {
    if (currentClient !== 'production') {
      setActiveClient(productionClient);
      setCurrentClient('production');
    }
  };

  const switchToDemo = () => {
    if (currentClient !== 'demo') {
      setActiveClient(demoClient);
      setCurrentClient('demo');
    }
  };
  console.log('rendering provider');
  return (
    <ApolloClientContext.Provider
      value={{ switchToProduction, switchToDemo, currentClient }}
    >
      <ApolloProvider client={activeClient}>{children}</ApolloProvider>
    </ApolloClientContext.Provider>
  );
};

// Hook to use the Apollo Client context
export const useApolloClientContext = () => {
  const context = useContext(ApolloClientContext);
  if (!context) {
    throw new Error(
      'useApolloClientContext must be used within an ApolloClientProvider'
    );
  }
  return context;
};
