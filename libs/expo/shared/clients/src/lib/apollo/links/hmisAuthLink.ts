import { ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { Observable } from '@apollo/client/utilities';
import { getHmisAuthToken } from '@monorepo/expo/shared/utils';
import NitroCookies from 'react-native-nitro-cookies';
import { MODERN_BROWSER_USER_AGENT } from '../../common/constants';

/**
 * Apollo link that adds HMIS token in custom header ONLY for HMIS operations
 * Uses X-HMIS-Token header to avoid conflicts with user Authorization
 * Reads token from cookies set by server
 */
export const createHmisAuthLink = (): ApolloLink => {
  const setContextLink = new SetContextLink(async (prevContext, operation) => {
    const operationName = operation.operationName?.toLowerCase() || '';

    if (!operationName.includes('hmis')) {
      return prevContext;
    }

    const headers = {
      ...(prevContext['headers'] ?? {}),
      'User-Agent': MODERN_BROWSER_USER_AGENT,
    };
    const authToken = await getHmisAuthToken();

    if (authToken) {
      headers['x-hmis-token'] = authToken;
    }

    return { ...prevContext, headers };
  });

  // Afterware link to extract and store cookies from Set-Cookie header
  const cookieLink = new ApolloLink(
    (operation, forward) =>
      new Observable((observer) => {
        const subscription = forward(operation).subscribe({
          next: (response: ApolloLink.Result) => {
            observer.next(response);

            // Store cookies asynchronously for HMIS login
            if (operation.operationName?.toLowerCase().includes('hmislogin')) {
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
            }
          },
          error: (error) => observer.error(error),
          complete: () => observer.complete(),
        });

        return () => subscription.unsubscribe();
      })
  );

  return cookieLink.concat(setContextLink);
};
