import { ApolloLink, Observable } from '@apollo/client';

export const loggerLink = new ApolloLink(
  (operation: ApolloLink.Operation, forward) => {
    console.log(
      '[GraphQL req]',
      operation.operationName || '(anonymous)',
      operation.variables && Object.keys(operation.variables).length > 0
        ? operation.variables
        : ''
    );

    // If there’s no next link, just return an empty observable
    if (!forward) {
      return new Observable<ApolloLink.Result>((observer) => {
        observer.complete();
      });
    }

    return new Observable<ApolloLink.Result>((observer) => {
      const subscription = forward(operation).subscribe({
        next: (result) => {
          console.log(
            '[GraphQL resp]',
            operation.operationName || '(anonymous)',
            result
          );
          observer.next(result);
        },
        error: (error) => {
          console.error(
            '[GraphQL error]',
            operation.operationName || '(anonymous)',
            error
          );
          observer.error(error);
        },
        complete: observer.complete.bind(observer),
      });

      // Cleanup
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    });
  }
);
