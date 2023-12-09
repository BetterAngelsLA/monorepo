import { ApolloLink, Observable } from '@apollo/client';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../../constants';
import { getItem, setItem } from '../../storage';

const csrfTokenRegex = new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`);

export const csrfLink = (apiUrl: string, customFetch = fetch) => {
  return new ApolloLink((operation, forward) => {
    return new Observable((observer) => {
      const processOperation = async () => {
        try {
          // Attempt to get the CSRF token from storage
          const csrfToken = await getItem(CSRF_COOKIE_NAME);

          // If the token is not in storage, try to fetch it
          if (!csrfToken) {
            const response = await customFetch(apiUrl, {
              credentials: 'include',
            });
            const cookies = response.headers?.get('Set-Cookie');
            const csrfTokenMatch = cookies?.match(csrfTokenRegex);

            // If a token is found in the response, update csrfToken and store it
            if (csrfTokenMatch?.[1]) {
              await setItem(CSRF_COOKIE_NAME, csrfTokenMatch[1]);
            }
          }

          // If a CSRF token is available, set it in the request headers
          operation.setContext(({ headers = {} }) => ({
            headers: {
              ...headers,
              ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
            },
          }));

          // Forward the operation and process the response
          forward(operation).subscribe({
            next: (response) => {
              const context = operation.getContext();
              // Helper function to extract 'set-cookie' headers
              const extractSetCookieHeader = (response: Response | undefined) =>
                response?.headers.get('set-cookie');

              // Get 'set-cookie' headers from GraphQL response
              const graphqlCookie = extractSetCookieHeader(context['response']);
              const graphqlCookies = graphqlCookie ? [graphqlCookie] : [];

              // Get 'set-cookie' headers from REST responses
              const restCookies = (
                (context['restResponses'] as Response[]) || []
              )
                .map(extractSetCookieHeader)
                .filter(Boolean);

              // Extract CSRF token
              const combinedCookies = [...graphqlCookies, ...restCookies].join(
                '; '
              );
              const csrfTokenRegex = new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`);
              const csrfTokenMatch = combinedCookies?.match(csrfTokenRegex);
              const csrfToken = csrfTokenMatch?.[1];

              if (csrfToken) {
                setItem(CSRF_COOKIE_NAME, csrfToken);
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
