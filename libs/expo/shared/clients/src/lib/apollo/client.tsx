import {
  ApolloClient,
  ApolloLink,
  from,
  InMemoryCache,
  NormalizedCacheObject,
  Observable,
} from '@apollo/client';
import CookieManager from '@react-native-cookies/cookies';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { Platform } from 'react-native';
import { isReactNativeFileInstance } from './ReactNativeFile';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './constants';

export const createApolloClient = (
  apiUrl: string,
  csrfUrl = `${apiUrl}/admin/login/`
): ApolloClient<NormalizedCacheObject> => {
  // Initialize the CSRF manager (which clears any existing CSRF tokens).
  const csrfManager = new CSRFTokenManager(csrfUrl);

  const authLink = new ApolloLink(
    (operation, forward) =>
      new Observable((observer) => {
        let subscription: { unsubscribe(): void } | undefined;
        (async () => {
          try {
            // Get the token (fetching from server if necessary)
            const token = await csrfManager.getToken();
            operation.setContext(({ headers = {} }) => ({
              headers: {
                ...headers,
                ...(token && { [CSRF_HEADER_NAME]: token }),
                ...(Platform.OS !== 'web' && { referer: apiUrl }),
              },
            }));
            subscription = forward(operation).subscribe({
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer),
            });
          } catch (err) {
            console.error('Error in authLink:', err);
            observer.error(err);
          }
        })();
        return () => subscription && subscription.unsubscribe();
      })
  );

  const restLink = new RestLink({ uri: apiUrl, credentials: 'include' });
  const uploadLink = createUploadLink({
    uri: `${apiUrl}/graphql`,
    isExtractableFile: isReactNativeFileInstance,
  });

  return new ApolloClient({
    link: from([authLink, restLink, uploadLink]),
    cache: new InMemoryCache(),
  });
};

export class CSRFTokenManager {
  private domain: string;
  private hostname: string;
  private readonly CLEAR_EXPIRY = '1970-01-01T00:00:00.00Z';

  constructor(private csrfUrl: string) {
    const url = new URL(csrfUrl);
    this.domain = url.origin;
    this.hostname = url.hostname;
    // Clear any existing CSRF tokens on initialization.
    this.clearToken().catch((err) =>
      console.error('Error clearing CSRF token on init:', err)
    );
  }

  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') return this.getTokenFromDocument();
    const token = await this.getNativeToken();
    return token || (await this.fetchToken());
  }

  private getTokenFromDocument(): string | null {
    if (typeof document === 'undefined' || !document.cookie) return null;
    const match = document.cookie.match(
      new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`)
    );
    return match ? match[1] : null;
  }

  private async getNativeToken(): Promise<string | null> {
    const cookies = await CookieManager.get(this.domain);
    const cookie = Object.values(cookies).find(
      (c) => c.name === CSRF_COOKIE_NAME && c.value?.trim()
    );
    return cookie ? cookie.value.trim() : null;
  }

  private async fetchToken(): Promise<string | null> {
    try {
      // Request the CSRF endpoint; assume the server sets the token as a cookie.
      await fetch(this.csrfUrl, { credentials: 'include' });
      return await this.getNativeToken();
    } catch (error) {
      console.error('Token fetch failed:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    if (Platform.OS === 'web') {
      document.cookie = `${CSRF_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } else {
      await this.clearCSRFCookie();
    }
  }

  private async clearCSRFCookie(): Promise<void> {
    const cookies = await CookieManager.get(this.domain);
    const csrfCookies = Object.values(cookies).filter(
      (c) => c.name === CSRF_COOKIE_NAME
    );
    console.log(
      `Clearing ${csrfCookies.length} instance(s) of ${CSRF_COOKIE_NAME}`
    );
    await Promise.all(
      csrfCookies.map((cookie) => {
        const urlToClear =
          Platform.OS === 'android'
            ? this.domain
            : `${cookie.secure ? 'https://' : 'http://'}${
                cookie.domain || this.hostname
              }${cookie.path || '/'}`;
        return CookieManager.set(urlToClear, {
          name: cookie.name,
          value: '',
          domain: cookie.domain || this.hostname,
          path: cookie.path || '/',
          expires: this.CLEAR_EXPIRY,
        });
      })
    );
    if (Platform.OS === 'android') await CookieManager.flush();
  }
}
