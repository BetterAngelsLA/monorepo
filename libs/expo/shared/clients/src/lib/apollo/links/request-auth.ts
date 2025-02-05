// request-auth-link.ts
import { ApolloLink, Observable } from '@apollo/client';
import { CSRF_HEADER_NAME } from './constants';
import { csrfManager } from './csrf-manager';

export const requestAuthLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const apiUrl = operation.getContext()['apiUrl'];
    csrfManager
      .getToken(apiUrl)
      .then((token) => {
        operation.setContext(({ headers = {} }) => ({
          headers: {
            ...headers,
            [CSRF_HEADER_NAME]: token,
          },
        }));
        return forward(operation);
      })
      .then((observable) => observable.subscribe(observer))
      .catch(observer.error.bind(observer));
  });
});
