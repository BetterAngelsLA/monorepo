import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import CookieManager from '@react-native-cookies/cookies';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { Platform } from 'react-native';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './constants';

const getTokenFromWeb = (): string | null =>
  document.cookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`))?.[1] ?? null;

const getTokenFromNative = async (apiUrl: string): Promise<string | null> =>
  (await CookieManager.get(apiUrl))[CSRF_COOKIE_NAME]?.value ?? null;

const getCSRFToken = async (
  apiUrl: string,
  csrfUrl: string
): Promise<string | null> => {
  const readToken = async () =>
    Platform.OS === 'web'
      ? getTokenFromWeb()
      : await getTokenFromNative(apiUrl);

  let token = await readToken();
  if (!token) {
    await fetch(csrfUrl, {
      credentials: 'include',
      headers: { Accept: 'text/html' },
    });
    token = await readToken();
  }
  return token;
};

export const createApolloClient = (
  apiUrl: string,
  csrfUrl = `${apiUrl}/admin/login/`
) =>
  new ApolloClient({
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
      }),
    ]),
    cache: new InMemoryCache(),
    credentials: 'include',
  });
