import { ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { Observable } from '@apollo/client/utilities';
import { getHmisAuthToken } from '@monorepo/expo/shared/utils';
import NitroCookies from 'react-native-nitro-cookies';
import { MODERN_BROWSER_USER_AGENT } from '../../common/constants';

/**
 * Adds X-HMIS-Token header
 */
const createAuthHeaderLink = () =>
  new SetContextLink(async (prevContext) => {
    const authToken = await getHmisAuthToken();
    return {
      ...prevContext,
      headers: {
        ...(prevContext['headers'] ?? {}),
        'User-Agent': MODERN_BROWSER_USER_AGENT,
        ...(authToken ? { 'x-hmis-token': authToken } : {}),
      },
    };
  });

/**
 * Extracts and stores cookies from responses
 */
const createCookieExtractorLink = () =>
  new ApolloLink(
    (operation, forward) =>
      new Observable((observer) => {
        const subscription = forward(operation).subscribe({
          next: (response) => {
            observer.next(response);

            const setCookieHeader = (
              operation.getContext()['response'] as Response | undefined
            )?.headers.get('set-cookie');

            if (setCookieHeader) {
              const domainMatch = setCookieHeader.match(/Domain=([^;,]+)/i);
              if (domainMatch) {
                NitroCookies.setFromResponse(
                  `https://${domainMatch[1].trim()}`,
                  setCookieHeader
                ).catch((error) =>
                  console.error('[HMIS] Failed to store cookies:', error)
                );
              }
            }
          },
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        });

        return () => subscription.unsubscribe();
      })
  );

/**
 * Apollo link that handles HMIS authentication and cookie management
 * Only processes HMIS operations
 */
export const createHmisAuthLink = (): ApolloLink => {
  const authAndCookieLink = createCookieExtractorLink().concat(
    createAuthHeaderLink()
  );

  return new ApolloLink((operation, forward) => {
    if (!operation.operationName?.toLowerCase().includes('hmis')) {
      return forward(operation);
    }
    return authAndCookieLink.request(operation, forward);
  });
};
