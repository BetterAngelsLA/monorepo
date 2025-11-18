import type { ApolloLink, ErrorLike } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { GraphQLFormattedError } from 'graphql';
import { isUnauthorizedError } from './utils/isUnauthorizedError';
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

  return new ErrorLink(({ error, operation }) => {
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

    if (isUnauthorizedError(graphQLErrors, networkError)) {
      redirectToAuth(operationName ?? '');

      return; // stop here, don't forward
    }

    // otherwise do nothing and let the response bubble up
  });
};
