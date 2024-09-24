import {
  ApolloClient,
  ApolloProvider,
  from,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { isReactNativeFileInstance } from './ReactNativeFile';
import { csrfLink } from './links/csrf';

interface ApolloClientContextType {
  client: ApolloClient<NormalizedCacheObject>;
  setProductionApi: () => void;
  setDemoApi: () => void;
  currentApiUrl: string; // Keep track of the current API URL
}

const ApolloClientContext = createContext<ApolloClientContextType | undefined>(
  undefined
);

interface ApolloClientProviderProps {
  children: ReactNode;
  apiUrl: string; // Production API URL
  demoApiUrl: string; // Demo API URL
}

const createApolloClient = (
  apiUrl: string
): ApolloClient<NormalizedCacheObject> => {
  console.log(`URL: ${apiUrl}`);
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

export const ApolloClientProvider = ({
  children,
  apiUrl,
  demoApiUrl,
}: ApolloClientProviderProps) => {
  const [currentApiUrl, setCurrentApiUrl] = useState(apiUrl); // Track the current API URL
  const [client, setClient] = useState(createApolloClient(apiUrl)); // Create Apollo Client based on initial URL

  useEffect(() => {
    setClient(createApolloClient(currentApiUrl)); // Update client when the API URL changes
  }, [currentApiUrl]);

  const setProductionApi = () => {
    console.log('Set production api');
    if (currentApiUrl !== apiUrl) {
      setCurrentApiUrl(apiUrl);
    }
  };

  const setDemoApi = () => {
    console.log('Set demo api');
    if (currentApiUrl !== demoApiUrl) {
      setCurrentApiUrl(demoApiUrl);
    }
  };

  return (
    <ApolloClientContext.Provider
      value={{
        client,
        setProductionApi,
        setDemoApi,
        currentApiUrl, // Provide the current API URL in the context
      }}
    >
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </ApolloClientContext.Provider>
  );
};

export const useApolloClientContext = () => {
  const context = useContext(ApolloClientContext);
  if (!context) {
    throw new Error(
      'useApolloClientContext must be used within an ApolloClientProvider'
    );
  }
  return context;
};
