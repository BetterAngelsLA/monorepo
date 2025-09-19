import type { ApolloLink, ServerError } from '@apollo/client';
import { Observable, type FetchResult } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

function complete(): Observable<FetchResult> {
  return new Observable((observer) => observer.complete());
}

function isServerError(err: unknown): err is ServerError {
  return typeof err === 'object' && err !== null && 'statusCode' in err;
}

// this list should be in sync with the server list
// safeOperations should just be public and never return a 401
const safeOperations = ['GetFeatureControls', 'currentUser'];

type TProps = {
  onUnauthenticated?: () => void;
};

export const createErrorLink = ({ onUnauthenticated }: TProps): ApolloLink =>
  onError((err) => {
    const {
      networkError,
      operation: { operationName },
    } = err;

    if (safeOperations.includes(operationName)) {
      return undefined;
    }

    // handle specific errors
    if (isServerError(networkError)) {
      if (onUnauthenticated && networkError.statusCode === 401) {
        onUnauthenticated();

        return complete();
      }
    }

    // otherwise continue
    return undefined;
  });
