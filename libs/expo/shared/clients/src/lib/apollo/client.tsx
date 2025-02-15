import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import CookieManager from '@react-native-cookies/cookies';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { Platform } from 'react-native';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './constants';

// Read token from web cookies.
const getTokenWeb = (): string | null => {
  if (typeof document !== 'undefined' && document.cookie) {
    const match = document.cookie.match(
      new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`)
    );
    return match ? match[1] : null;
  }
  return null;
};

// Read token from native cookies.
const getTokenNative = async (apiUrl: string): Promise<string | null> => {
  try {
    const cookies = await CookieManager.get(apiUrl);
    return cookies[CSRF_COOKIE_NAME]?.value || null;
  } catch (error) {
    console.error('Error reading native cookies:', error);
    return null;
  }
};

// Fetch the CSRF token by calling the CSRF URL (expected to set the cookie).
const fetchToken = async (csrfUrl: string): Promise<void> => {
  try {
    await fetch(csrfUrl, {
      credentials: 'include',
      headers: { Accept: 'text/html' },
    });
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
  }
};

export const createApolloClient = (
  apiUrl: string,
  csrfUrl = `${apiUrl}/admin/login/`
) => {
  // Set the CSRF header on every request.
  const authLink = setContext(async (_, { headers = {} }) => {
    let token: string | null;
    if (Platform.OS === 'web') {
      token = getTokenWeb();
      if (!token) {
        await fetchToken(csrfUrl);
        token = getTokenWeb();
      }
    } else {
      token = await getTokenNative(apiUrl);
      if (!token) {
        await fetchToken(csrfUrl);
        token = await getTokenNative(apiUrl);
      }
    }
    return {
      headers: {
        ...headers,
        ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
        ...(Platform.OS !== 'web' ? { referer: apiUrl } : {}),
      },
    };
  });

  const restLink = new RestLink({
    uri: apiUrl,
    credentials: 'include',
  });

  const uploadLink = createUploadLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
  });

  return new ApolloClient({
    link: from([authLink, restLink, uploadLink]),
    cache: new InMemoryCache(),
    credentials: 'include',
  });
};
