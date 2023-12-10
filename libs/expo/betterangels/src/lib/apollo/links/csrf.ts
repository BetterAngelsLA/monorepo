import { ApolloLink, FetchResult, Observable } from '@apollo/client';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../../constants';
import { getItem, setItem } from '../../storage';

const csrfTokenRegex = new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`);

const extractCsrfToken = async (
  apiUrl: string,
  customFetch: (url: string, init?: RequestInit) => Promise<Response>
) => {
  let csrfToken = await getItem(CSRF_COOKIE_NAME);
  if (!csrfToken) {
    const response = await customFetch(apiUrl, { credentials: 'include' });
    const cookies = response.headers?.get('Set-Cookie');
    const match = cookies?.match(csrfTokenRegex);
    if (match) {
      csrfToken = match[1];
      await setItem(CSRF_COOKIE_NAME, csrfToken);
    }
  }
  return csrfToken;
};

const updateHeadersWithCsrf = (csrfToken: string | null) =>
  csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {};

export const csrfLink = (
  apiUrl: string,
  customFetch: (url: string, init?: RequestInit) => Promise<Response> = fetch
) =>
  new ApolloLink(
    (operation, forward) =>
      new Observable<FetchResult>((observer) => {
        const processOperation = async () => {
          try {
            const csrfToken = await extractCsrfToken(apiUrl, customFetch);
            operation.setContext(({ headers = {} }) => ({
              headers: {
                ...headers,
                ...updateHeadersWithCsrf(csrfToken),
              },
            }));

            forward(operation).subscribe({
              next: (response: FetchResult) => {
                const context = operation.getContext();
                const combinedCookies = [
                  // Extract 'set-cookie' header from the response if it exists
                  context['response']?.headers?.get('set-cookie'),
                  // Extract 'set-cookie' headers from any REST responses and filter out any null or undefined values
                  ...((context['restResponses'] as Response[]) || [])
                    .map((res) => res?.headers.get('set-cookie'))
                    .filter(Boolean),
                ]
                  .filter(Boolean)
                  .join('; ');

                const match = combinedCookies.match(csrfTokenRegex);
                if (match) {
                  setItem(CSRF_COOKIE_NAME, match[1]);
                }
                observer.next(response);
              },
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer),
            });
          } catch (error) {
            console.error('Error in CSRF Apollo Link:', error);
            observer.error(error);
          }
        };
        processOperation();
      })
  );
