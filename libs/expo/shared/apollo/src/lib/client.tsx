// Import necessary modules and components
import {
  ApolloClient,
  ApolloProvider,
  from,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';
import { setItem } from '@monorepo/expo/shared/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { CSRF_COOKIE_NAME } from './links';
import { csrfLink } from './links/csrf';
import { isReactNativeFileInstance } from './ReactNativeFile';

/**
 * Creates an Apollo Client instance configured with the provided API URL.
 *
 * @param apiUrl - The base URL of the API to connect to.
 * @returns A configured Apollo Client instance.
 */
export const createApolloClient = (
  apiUrl: string
): ApolloClient<NormalizedCacheObject> => {
  const getHeaders = () =>
    Platform.OS !== 'web' ? { Referer: apiUrl } : undefined;

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
    link: from([csrfLink(`${apiUrl}/admin/login/`), restLink, uploadLink]),
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

/**
 * ApolloClientProvider component that manages the active Apollo Client instance
 * and provides functions to switch between production and demo clients.
 * It uses AsyncStorage to persist the current client selection across app reloads.
 *
 * @param props - The props for the component, including children and client instances.
 * @returns A provider component that supplies the Apollo Client context to its children.
 */
export const ApolloClientProvider = ({
  children,
  productionClient,
  demoClient,
}: ApolloClientProviderProps) => {
  const [currentClient, setCurrentClient] = useState<
    'production' | 'demo' | null
  >(null);

  useEffect(() => {
    /**
     * Loads the current client from AsyncStorage.
     * Defaults to 'production' if no valid value is stored.
     */
    const loadCurrentClient = async () => {
      try {
        const storedClient = await AsyncStorage.getItem('currentClient');
        setCurrentClient(storedClient === 'demo' ? 'demo' : 'production');
      } catch (error) {
        console.error('Error loading current client from AsyncStorage', error);
        setCurrentClient('production');
      }
    };

    loadCurrentClient();
  }, []);

  /**
   * Switches the active Apollo Client to the specified client ('production' or 'demo').
   * Updates the current client in state, persists it to AsyncStorage, and clears the CSRF cookie.
   *
   * @param client - The client to switch to ('production' or 'demo').
   */
  const switchClient = async (client: 'production' | 'demo') => {
    if (currentClient !== client) {
      try {
        await setItem(CSRF_COOKIE_NAME, '');
        await AsyncStorage.setItem('currentClient', client);
        setCurrentClient(client);
      } catch (error) {
        console.error('Error switching client', error);
      }
    }
  };

  const switchToProduction = () => switchClient('production');
  const switchToDemo = () => switchClient('demo');

  if (currentClient === null) {
    return null;
  }

  const activeClient =
    currentClient === 'production' ? productionClient : demoClient;

  return (
    <ApolloClientContext.Provider
      value={{ switchToProduction, switchToDemo, currentClient }}
    >
      <ApolloProvider client={activeClient}>{children}</ApolloProvider>
    </ApolloClientContext.Provider>
  );
};

/**
 * Custom hook to access the Apollo Client context.
 * Provides functions to switch clients and the current client information.
 *
 * @returns The Apollo Client context value.
 * @throws An error if used outside of the ApolloClientProvider.
 */
export const useApolloClientContext = () => {
  const context = useContext(ApolloClientContext);
  if (!context) {
    throw new Error(
      'useApolloClientContext must be used within an ApolloClientProvider'
    );
  }
  return context;
};
