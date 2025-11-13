import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { RestLink } from 'apollo-link-rest';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { isReactNativeFileInstance } from './ReactNativeFile';
import { createAuthLink } from './links/authLink';
import { createErrorLink } from './links/errorLink';
import { loggerLink } from './links/loggerLink';
import { hasRestDirective } from './links/utils';

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

  const restLink = new RestLink({
    uri: apiUrl,
    credentials: 'include',
  });

  const uploadHttpLink = new UploadHttpLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
    isExtractableFile: isReactNativeFileInstance,
  });

  const errorLink = createErrorLink({
    authPath,
    onUnauthenticated,
  });

  // Split between REST operations and GraphQL operations
  const restOrUploadLink = ApolloLink.split(
    (operation) => hasRestDirective(operation.query),
    restLink as unknown as ApolloLink, // if hasRestDirective=true
    uploadHttpLink as unknown as ApolloLink // if hasRestDirective=false
  );

  const composedLinks: ApolloLink[] = [errorLink, authLink, restOrUploadLink];

  // Debug only: logs GraphQL requests/responses
  if (
    process.env['EXPO_PUBLIC_GQL_DEBUG'] === 'true' &&
    process.env['NODE_ENV'] !== 'production'
  ) {
    composedLinks.unshift(loggerLink);
  }

  return new ApolloClient({
    link: ApolloLink.from(composedLinks),
    cache: cacheStore ?? new InMemoryCache(),
  });
};
