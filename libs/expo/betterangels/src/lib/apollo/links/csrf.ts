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
      const context = operation.getContext();
      // Helper function to extract 'set-cookie' headers
      const extractSetCookieHeader = (response: Response | undefined) =>
        response?.headers.get('set-cookie');

      // Get 'set-cookie' headers from GraphQL response
      const graphqlCookie = extractSetCookieHeader(context['response']);
      const graphqlCookies = graphqlCookie ? [graphqlCookie] : [];

      // Get 'set-cookie' headers from REST responses
      const restCookies = ((context['restResponses'] as Response[]) || [])
        .map(extractSetCookieHeader)
        .filter(Boolean);

      // Extract CSRF token
      const combinedCookies = [...graphqlCookies, ...restCookies].join('; ');
      const csrfTokenRegex = new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`);
      const csrfTokenMatch = combinedCookies?.match(csrfTokenRegex);
      const csrfToken = csrfTokenMatch?.[1];

      if (csrfToken) {
        setItem(CSRF_COOKIE_NAME, csrfToken);
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
