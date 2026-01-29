import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { Platform } from 'react-native';
import { createNativeFetch } from '../common/nativeFetch';
import { isReactNativeFileInstance } from './ReactNativeFile';
import { createErrorLink } from './links/errorLink';
import { loggerLink } from './links/loggerLink';

type TArgs = {
  apiUrl: string;
  cacheStore?: InMemoryCache;
  onUnauthenticated?: () => void;
  authPath?: string;
};

export const createApolloClient = (args: TArgs) => {
  const { cacheStore, apiUrl, authPath, onUnauthenticated } = args;

  const nativeFetch =
    Platform.OS === 'web' ? undefined : createNativeFetch(apiUrl);

  const uploadHttpLink = new UploadHttpLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
    isExtractableFile: isReactNativeFileInstance,
    ...(nativeFetch ? { fetch: nativeFetch } : {}),
  });

  const errorLink = createErrorLink({
    authPath,
    onUnauthenticated,
  });

  const composedLinks = [errorLink, uploadHttpLink];

  // Debug only: logs GraphQL requests/responses
  if (
    process.env['EXPO_PUBLIC_GQL_DEBUG'] === 'true' &&
    process.env['NODE_ENV'] !== 'production'
  ) {
    composedLinks.unshift(loggerLink);
  }

  const client = new ApolloClient({
    link: ApolloLink.from(composedLinks),
    cache: cacheStore ?? new InMemoryCache(),
    // NOTE: in v4 the notifyOnNetworkStatusChange default value changed to `true`.
    // Resetting default to false to mimic earlier (v3) behavior until we make
    // necessary updates to switch to the new default.
    defaultOptions: {
      watchQuery: {
        notifyOnNetworkStatusChange: false,
      },
    },
  });

  return client;
};
