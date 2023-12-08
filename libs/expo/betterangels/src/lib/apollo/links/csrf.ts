import { ApolloLink, FetchResult, Observable } from '@apollo/client';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../../constants';
import { getItem, setItem } from '../../storage';

export const csrfLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const addCsrfTokenToRequest = async () => {
      const token = await getItem(CSRF_COOKIE_NAME);
      if (token) {
        operation.setContext(({ headers = {} }) => ({
          headers: {
            ...headers,
            [CSRF_HEADER_NAME]: token,
          },
        }));
      }
    };

    const processResponse = (response: FetchResult) => {
      const headers = operation.getContext()['response']?.headers;
      if (headers) {
        const cookies = headers.get('Set-Cookie');
        const csrfTokenRegex = new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`);
        const csrfTokenMatch = cookies?.match(csrfTokenRegex);
        const csrfToken = csrfTokenMatch?.[1];
        if (csrfToken) {
          setItem(CSRF_COOKIE_NAME, csrfToken);
        }
      }
      return response;
    };

    addCsrfTokenToRequest().then(() => {
      forward(operation).subscribe({
        next: (response) => observer.next(processResponse(response)),
        error: (e) => observer.error(e),
        complete: () => observer.complete(),
      });
    });
  });
});
