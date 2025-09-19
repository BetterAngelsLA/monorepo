import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { Platform } from 'react-native';
import { CSRF_HEADER_NAME, getCSRFToken } from '../common';
import { isReactNativeFileInstance } from './ReactNativeFile';
import { createErrorLink } from './createErrorLink';

type TArgs = {
  apiUrl: string;
  csrfUrl?: string;
  cacheStore?: InMemoryCache;
  onUnauthenticated?: () => void;
};

export const createApolloClient = (args: TArgs) => {
  const {
    cacheStore,
    apiUrl,
    csrfUrl = `${apiUrl}/admin/login/`,
    onUnauthenticated,
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
    onUnauthenticated,
  });

  const restLink = new RestLink({ uri: apiUrl, credentials: 'include' });

  const uploadLink = createUploadLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
    isExtractableFile: isReactNativeFileInstance,
  });

  return new ApolloClient({
    link: from([errorLink, authLink, restLink, uploadLink]),
    cache: cacheStore || new InMemoryCache(),
    credentials: 'include',
  });
};
