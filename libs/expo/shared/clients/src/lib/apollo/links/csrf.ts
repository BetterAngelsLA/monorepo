import { ApolloLink, FetchResult, Observable } from '@apollo/client';
import { CSRF_HEADER_NAME } from './constants';
import { csrfManager } from './csrf-manager';

export const csrfLink = (apiUrl: string, customFetch = fetch) => {
  return new ApolloLink(
    (operation, forward) =>
      new Observable((observer) => {
        (async () => {
          try {
            // Retrieve (or fetch) the CSRF token via the centralized manager.
            const csrfToken = await csrfManager.getToken(apiUrl, customFetch);

            // Inject the token into the outgoing headers.
            operation.setContext(({ headers = {} }) => ({
              headers: {
                ...headers,
                ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
              },
            }));

            forward(operation).subscribe({
              next: (response: FetchResult) => {
                const context = operation.getContext();
                const combinedCookies = [
                  context['response']?.headers?.get('set-cookie'),
                  ...(context['restResponses'] || []).map((res: Response) =>
                    res.headers.get('set-cookie')
                  ),
                ]
                  .filter(Boolean)
                  .join('; ');

                csrfManager
                  .updateTokenFromCookies(apiUrl, combinedCookies)
                  .catch(console.error);

                observer.next(response);
              },
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer),
            });
          } catch (error) {
            console.error('CSRF link error:', error);
            observer.error(error);
          }
        })();
      })
  );
};
