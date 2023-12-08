import { ApolloLink, Observable } from '@apollo/client';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../../constants';
import { getItem, setItem } from '../../storage';

const csrfTokenRegex = new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`);

export const csrfLink = (apiUrl: string) => {
  return new ApolloLink((operation, forward) => {
    return new Observable((observer) => {
      const processOperation = async () => {
        try {
          let csrfToken = await getItem(CSRF_COOKIE_NAME);
          if (!csrfToken) {
            const response = await fetch(apiUrl, { credentials: 'include' });
            const cookies = response.headers.get('Set-Cookie');
            const csrfTokenMatch = cookies?.match(csrfTokenRegex);
            csrfToken = csrfTokenMatch?.[1] || '';
            if (csrfToken) {
              await setItem(CSRF_COOKIE_NAME, csrfToken);
            }
          }

          operation.setContext(({ headers = {} }) => ({
            headers: {
              ...headers,
              [CSRF_HEADER_NAME]: csrfToken,
            },
          }));

          // Forward the operation and process the response
          forward(operation).subscribe({
            next: (response) => {
              const context = operation.getContext();
              const extractSetCookieHeader = (response: Response | undefined) =>
                response?.headers.get('set-cookie');

              const graphqlCookie = extractSetCookieHeader(context['response']);
              const graphqlCookies = graphqlCookie ? [graphqlCookie] : [];

              const restCookies = (
                (context['restResponses'] as Response[]) || []
              )
                .map(extractSetCookieHeader)
                .filter(Boolean);

              const combinedCookies = [...graphqlCookies, ...restCookies].join(
                '; '
              );
              const csrfTokenMatch = combinedCookies.match(csrfTokenRegex);
              const newCsrfToken = csrfTokenMatch?.[1];

              if (newCsrfToken) {
                setItem(CSRF_COOKIE_NAME, newCsrfToken);
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
    });
  });
};
