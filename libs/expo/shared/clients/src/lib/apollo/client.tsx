import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { Platform } from 'react-native';
import { CSRF_HEADER_NAME, getCSRFToken } from '../common';
import { isReactNativeFileInstance } from './ReactNativeFile';

type TArgs = {
  apiUrl: string;
  csrfUrl?: string;
  cacheStore?: InMemoryCache;
};

export const createApolloClient = (args: TArgs) => {
  const { cacheStore, apiUrl, csrfUrl = `${apiUrl}/admin/login/` } = args;

  console.log('*****************  csrfUrl:', csrfUrl);

  return new ApolloClient({
    link: from([
      setContext(async (_, { headers = {} }) => {
        const token = await getCSRFToken(apiUrl, csrfUrl);
        return {
          headers: {
            ...headers,
            ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
            ...(Platform.OS !== 'web' ? { referer: apiUrl } : {}),
          },
        };
      }),
      new RestLink({ uri: apiUrl, credentials: 'include' }),
      createUploadLink({
        uri: `${apiUrl}/graphql`,
        credentials: 'include',
        isExtractableFile: isReactNativeFileInstance,
      }),
    ]),
    cache: cacheStore || new InMemoryCache(),
    credentials: 'include',
  });
};
