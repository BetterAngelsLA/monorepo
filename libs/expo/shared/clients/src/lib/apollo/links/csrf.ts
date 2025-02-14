import { ApolloLink, FetchResult, Observable } from '@apollo/client';
import { Subscription } from 'zen-observable-ts';
import { CSRF_HEADER_NAME } from './constants';
import { csrfManager } from './csrf-manager';

export const csrfLink = (apiUrl: string) => {
  return new ApolloLink(
    (operation, forward) =>
      new Observable<FetchResult>((observer) => {
        let subscription: Subscription | undefined;
        (async () => {
          try {
            // Retrieve the CSRF token via our new manager.
            const csrfToken = await csrfManager.getToken(apiUrl);
            // Inject the token (if available) into the outgoing headers.
            operation.setContext(({ headers = {} }) => ({
              headers: {
                ...headers,
                ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
              },
            }));

            // Forward the operation.
            subscription = forward(operation).subscribe({
              next: (result: FetchResult) => {
                observer.next(result);
              },
              error: (err) => observer.error(err),
              complete: () => observer.complete(),
            });
          } catch (error) {
            console.error('CSRF link error:', error);
            observer.error(error);
          }
        })();
        // Always return a cleanup function.
        return () => {
          if (subscription) {
            subscription.unsubscribe();
          }
        };
      })
  );
};
