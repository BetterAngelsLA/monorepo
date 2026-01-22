import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { isReactNativeFileInstance } from './ReactNativeFile';
import { createAuthLink } from './links/authLink';
import { createErrorLink } from './links/errorLink';
import { createHmisAuthLink } from './links/hmisAuthLink';
import { loggerLink } from './links/loggerLink';

type TArgs = {
  apiUrl: string;
  csrfUrl?: string;
  cacheStore?: InMemoryCache;
  onUnauthenticated?: () => void;
  authPath?: string;
};

export const createApolloClient = (args: TArgs) => {
  const {
    cacheStore,
    apiUrl,
    csrfUrl = `${apiUrl}/admin/login/`,
    authPath,
    onUnauthenticated,
  } = args;

  const authLink = createAuthLink({ apiUrl, csrfUrl });

  const uploadHttpLink = new UploadHttpLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
    isExtractableFile: isReactNativeFileInstance,
  });

  const errorLink = createErrorLink({
    authPath,
    onUnauthenticated,
  });

  const hmisAuthLink = createHmisAuthLink();

  const composedLinks = [errorLink, authLink, hmisAuthLink, uploadHttpLink];

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
