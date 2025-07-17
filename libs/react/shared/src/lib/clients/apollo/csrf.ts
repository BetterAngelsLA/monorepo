import { ApolloLink, Observable } from '@apollo/client';
import { eraseCookie, getCookie } from '../../utils/storage/cookies';

type CSRFOptions = {
  apiUrl: string;
  cookieName: string;
  headerName: string;
  customFetch?: typeof fetch;
};

const extractCsrfToken = async (
  apiUrl: string,
  cookieName: string,
  customFetch: typeof fetch = fetch
) => {
  let csrfTokens = getCookie(cookieName);
  let csrfToken;

  if (csrfTokens.length === 1) {
    csrfToken = csrfTokens[0];
  } else if (csrfTokens.length > 1) {
    const hostParts = window.location.hostname.split('.');
    for (let i = 0; i < hostParts.length - 1 && csrfTokens.length > 1; i++) {
      const domainToTry = '.' + hostParts.slice(i).join('.');
      eraseCookie(cookieName, domainToTry);
      csrfTokens = getCookie(cookieName);
    }
    csrfToken = csrfTokens[0];
  }

  if (csrfToken) return csrfToken;

  await customFetch(apiUrl, { credentials: 'include' });
  return getCookie(cookieName)[0];
};

const updateHeadersWithCsrf = (csrfToken: string | null, headerName: string) =>
  csrfToken ? { [headerName]: csrfToken } : {};

export const csrfLink = ({
  apiUrl,
  cookieName,
  headerName,
  customFetch = fetch,
}: CSRFOptions) =>
  new ApolloLink(
    (operation, forward) =>
      new Observable((observer) => {
        const processOperation = async () => {
          try {
            const csrfToken = await extractCsrfToken(
              apiUrl,
              cookieName,
              customFetch
            );

            operation.setContext(({ headers = {} }) => ({
              headers: {
                ...headers,
                ...updateHeadersWithCsrf(csrfToken, headerName),
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
