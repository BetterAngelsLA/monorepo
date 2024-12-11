import { ApolloLink, Observable } from '@apollo/client';
import { getCookie } from '../../utils/storage/cookies';

const csrfCookieName =
  import.meta.env.VITE_SHELTER_CSRF_COOKIE_NAME || 'csrftoken';
const csrfHeaderName =
  import.meta.env.VITE_SHELTER_CSRF_HEADER_NAME || 'x-csrftoken';

const extractCsrfToken = async (apiUrl: string, customFetch = fetch) => {
  const csrfToken = getCookie(csrfCookieName);

  if (csrfToken) {
    return csrfToken;
  }

  await customFetch(apiUrl, { credentials: 'include' });

  return getCookie(csrfCookieName);
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
