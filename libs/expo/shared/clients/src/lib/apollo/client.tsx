import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { Platform } from 'react-native';
import { CSRF_HEADER_NAME, getCSRFToken } from '../common';
import { isReactNativeFileInstance } from './ReactNativeFile';
import { createErrorLink } from './links/createErrorLink';
import { loggerLink } from './links/loggerLink';

type TArgs = {
  apiUrl: string;
  csrfUrl?: string;
  cacheStore?: InMemoryCache;
  onUnauthenticated?: () => void;
  authPath?: string;
  withLogs?: boolean;
};

export const createApolloClient = (args: TArgs) => {
  const {
    cacheStore,
    apiUrl,
    csrfUrl = `${apiUrl}/admin/login/`,
    authPath,
    onUnauthenticated,
    withLogs = false,
  } = args;

  const authLink = setContext(async (_, { headers = {} }) => {
    const token = await getCSRFToken(apiUrl, csrfUrl);

    return {
      headers: {
        ...headers,
        ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
        ...(Platform.OS !== 'web' ? { referer: apiUrl } : {}),
      },
    };
  });

  const errorLink = createErrorLink({
    authPath,
    onUnauthenticated,
  });

  const restLink = new RestLink({ uri: apiUrl, credentials: 'include' });

  const uploadLink = createUploadLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
    isExtractableFile: isReactNativeFileInstance,
  });

  const links = [errorLink, authLink, restLink, uploadLink];

  // debug only: logs gql req/resp
  if (withLogs && process.env.NODE_ENV !== 'production') {
    links.unshift(loggerLink);
  }

  return new ApolloClient({
    link: from(links),
    cache: cacheStore || new InMemoryCache(),
    credentials: 'include',
  });
};
