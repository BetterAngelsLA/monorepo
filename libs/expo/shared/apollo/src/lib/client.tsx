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
import { isReactNativeFileInstance } from './ReactNativeFile';
import { CSRF_COOKIE_NAME } from './links';
import { csrfLink } from './links/csrf';

export const createApolloClient = (
  apiUrl: string
): ApolloClient<NormalizedCacheObject> => {
  console.log(`apiUrl: ${apiUrl}`);
  const getHeaders = (): { [key: string]: string } | undefined => {
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

export const ApolloClientProvider = ({
  children,
  productionClient,
  demoClient,
}: ApolloClientProviderProps) => {
  const [currentClient, setCurrentClient] = useState<
    'production' | 'demo' | null
  >(null);

  useEffect(() => {
    // Load current client from AsyncStorage when component mounts
    const loadCurrentClient = async () => {
      try {
        const storedClient = await AsyncStorage.getItem('currentClient');
        if (storedClient === 'production' || storedClient === 'demo') {
          setCurrentClient(storedClient);
        } else {
          // Default to 'production' if no valid value is stored
          setCurrentClient('production');
        }
      } catch (error) {
        console.error('Error loading current client from AsyncStorage', error);
        setCurrentClient('production');
      }
    };

    loadCurrentClient();
  }, []);

  const switchClient = async (client: 'production' | 'demo') => {
    if (currentClient !== client) {
      await setItem(CSRF_COOKIE_NAME, '');
      try {
        await AsyncStorage.setItem('currentClient', client);
        setCurrentClient(client);
      } catch (error) {
        console.error('Error switching client', error);
      }
    }
  };

  const switchToProduction = () => {
    switchClient('production');
  };

  const switchToDemo = () => {
    switchClient('demo');
  };

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

export const useApolloClientContext = () => {
  const context = useContext(ApolloClientContext);
  if (!context) {
    throw new Error(
      'useApolloClientContext must be used within an ApolloClientProvider'
    );
  }
  return context;
};
