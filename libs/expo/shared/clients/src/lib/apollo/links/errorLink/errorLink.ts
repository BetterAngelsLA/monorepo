import type { ApolloLink, ErrorLike } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { Observable } from '@apollo/client/utilities';
import { GraphQLFormattedError } from 'graphql';
import { isHmisTokenExpiredError } from './utils/isHmisTokenExpiredError';
import { isUnauthorizedError } from './utils/isUnauthorizedError';
import { refreshHmisToken } from './utils/refreshHmisToken';
import { createRedirectHandler } from './utils/redirectHandler';

type TProps = {
  onUnauthenticated?: (() => void) | null;
  authPath?: string;
  safeOperations?: string[];
};

export const createErrorLink = ({
  onUnauthenticated,
  authPath = '/auth',
  safeOperations = ['CurrentUser', 'currentUser'],
}: TProps): ApolloLink => {
  const redirectToAuth = createRedirectHandler({
    authPath,
    safeOperations,
    onUnauthenticated,
  });

  return new ErrorLink(({ error, operation, forward }) => {
    const { operationName } = operation;

    let graphQLErrors: readonly GraphQLFormattedError[] | undefined;
    let networkError: ErrorLike | undefined;

    if (CombinedGraphQLErrors.is(error)) {
      // If it's a GraphQL bundle, pull out the actual errors array.
      graphQLErrors = error.errors;
    } else {
      // Otherwise assume Network Error
      networkError = error;
    }

    // Check for HMIS token expired error first
    if (isHmisTokenExpiredError(graphQLErrors)) {
      // Attempt to refresh token and retry operation
      return new Observable((observer) => {
        refreshHmisToken()
          .then((success) => {
            if (!success) {
              observer.error(error);
              return;
            }
            // Retry the operation with refreshed token
            forward(operation).subscribe({
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer),
            });
          })
          .catch((err) => observer.error(err));
      });
    }

    if (isUnauthorizedError(graphQLErrors, networkError)) {
      redirectToAuth(operationName ?? '');
      return; // stop here, don't forward
    }

    // otherwise do nothing and let the response bubble up
    return undefined;
  });
};
