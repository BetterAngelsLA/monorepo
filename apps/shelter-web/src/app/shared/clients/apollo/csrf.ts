import { ApolloLink, Observable } from '@apollo/client';
import { eraseCookie, getCookie } from '../../utils/storage/cookies';

const csrfCookieName =
  import.meta.env.VITE_SHELTER_CSRF_COOKIE_NAME || 'csrftoken';
const csrfHeaderName =
  import.meta.env.VITE_SHELTER_CSRF_HEADER_NAME || 'x-csrftoken';

/**
 * Extracts a CSRF token for API requests.
 *
 * TEMPORARY WORKAROUND:
 * Currently our applications run on subdomains of the same parent domain (e.g., api.dev.betterangels.la,
 * shelter.betterangels.la). This leads to cookie collisions where multiple CSRF tokens can exist on
 * different domain levels (.betterangels.la, .dev.betterangels.la, etc).
 *
 * Until we move to completely separate domains for each application, this function:
 * 1. Checks if multiple CSRF tokens exist
 * 2. If multiple tokens found, systematically removes them starting from the most specific domain level
 *    (e.g., .api.dev.betterangels.la) and working down (.dev.betterangels.la, .betterangels.la)
 *    until only one token remains
 * 3. Returns the remaining token
 *
 * This cleanup ensures consistent CSRF handling across our applications while they share a parent domain.
 * The code can be simplified once applications move to separate domains.
 */
const extractCsrfToken = async (apiUrl: string, customFetch = fetch) => {
  let csrfTokens = getCookie(csrfCookieName);
  let csrfToken;

  if (csrfTokens.length === 1) {
    csrfToken = csrfTokens[0];
  } else if (csrfTokens.length > 1) {
    const hostParts = window.location.hostname.split('.');
    // Try each domain level, starting from the most specific
    for (let i = 0; i < hostParts.length - 1 && csrfTokens.length > 1; i++) {
      // Get domain starting from current position to end
      // e.g., api.dev.betterangels.la, then dev.betterangels.la, then betterangels.la
      const domainToTry = '.' + hostParts.slice(i).join('.');
      eraseCookie(csrfCookieName, domainToTry);
      csrfTokens = getCookie(csrfCookieName);
    }
    csrfToken = csrfTokens[0];
  }

  if (csrfToken) {
    return csrfToken;
  }

  await customFetch(apiUrl, { credentials: 'include' });
  return getCookie(csrfCookieName)[0];
};

const updateHeadersWithCsrf = (csrfToken: string | null) =>
  csrfToken ? { [csrfHeaderName]: csrfToken } : {};

export const csrfLink = (apiUrl: string, customFetch = fetch) =>
  new ApolloLink(
    (operation, forward) =>
      new Observable((observer) => {
        const processOperation = async () => {
          try {
            const csrfToken = await extractCsrfToken(apiUrl, customFetch);

            operation.setContext(({ headers = {} }) => ({
              headers: {
                ...headers,
                ...updateHeadersWithCsrf(csrfToken),
              },
            }));

            const subscription = forward(operation).subscribe({
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer),
            });

            return () => subscription.unsubscribe();
          } catch (err) {
            console.error('Error in CSRF Apollo Link:', err);
            observer.error(err);
          }
        };

        processOperation();
      })
  );
