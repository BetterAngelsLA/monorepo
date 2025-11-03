import type { ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { isUnauthorizedError } from './utils/isUnauthorizedError';
import { createRedirectHandler } from './utils/redirectHandler';

type TProps = {
  onUnauthenticated?: (() => void) | null;
  authPath?: string;
  safeOperations?: string[];
};

export const createErrorLink = ({
  onUnauthenticated,
  authPath = '/auth?clearSession=1',
  safeOperations = ['CurrentUser', 'currentUser'],
}: TProps): ApolloLink => {
  const redirectToAuth = createRedirectHandler({
    authPath,
    safeOperations,
    onUnauthenticated,
  });

  return onError((err) => {
    const {
      networkError,
      graphQLErrors,
      operation: { operationName },
    } = err;

    if (isUnauthorizedError(graphQLErrors, networkError)) {
      redirectToAuth(operationName);

      return;
    }
  });
};
