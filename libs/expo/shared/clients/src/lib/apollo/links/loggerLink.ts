import { ApolloLink, Observable } from '@apollo/client';
import { formatDataForLog, formatResponseForLog } from '../../common/apiDebug';

export const loggerLink = new ApolloLink(
  (operation: ApolloLink.Operation, forward) => {
    const operationName = operation.operationName || '(anonymous)';

    console.log(
      '[GraphQL req]',
      operationName,
      formatDataForLog(
        operation.variables && Object.keys(operation.variables).length > 0
          ? operation.variables
          : '',
      ),
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
            operationName,
            formatResponseForLog(result),
          );
          observer.next(result);
        },
        error: (error) => {
          console.error(
            '[GraphQL error]',
            operationName,
            formatDataForLog(error),
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
  },
);
