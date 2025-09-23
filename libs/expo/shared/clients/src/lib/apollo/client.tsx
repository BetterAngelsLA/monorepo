import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { isReactNativeFileInstance } from './ReactNativeFile';
import { createAuthLink } from './links/authLink';
import { createErrorLink } from './links/errorLink';
import { loggerLink } from './links/loggerLink';

type TArgs = {
  apiUrl: string;
  csrfUrl?: string;
  cacheStore?: InMemoryCache;
  onUnauthenticated?: () => void;
  authPath?: string;
  debugMode?: boolean;
};

export const createApolloClient = (args: TArgs) => {
  const {
    cacheStore,
    apiUrl,
    csrfUrl = `${apiUrl}/admin/login/`,
    authPath,
    onUnauthenticated,
    debugMode = false,
  } = args;

  const authLink = createAuthLink({ apiUrl, csrfUrl });

  const restLink = new RestLink({ uri: apiUrl, credentials: 'include' });

  const uploadLink = createUploadLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
    isExtractableFile: isReactNativeFileInstance,
  });

  const errorLink = createErrorLink({
    authPath,
    onUnauthenticated,
  });

  const links = [errorLink, authLink, restLink, uploadLink];

  // debug only: logs gql req/resp
  if (debugMode && process.env.NODE_ENV !== 'production') {
    links.unshift(loggerLink);
  }

  return new ApolloClient({
    link: from(links),
    cache: cacheStore || new InMemoryCache(),
    credentials: 'include',
  });
};
