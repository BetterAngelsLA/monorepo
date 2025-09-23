import type { ApolloLink, ServerError } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { router } from 'expo-router';
import { API_ERROR_CODES } from '../../common';

type TErrorExtensions = {
  code?: string;
  http?: { status?: number };
};

function isServerError(err: unknown): err is ServerError {
  return (
    typeof err === 'object' && err !== null && 'statusCode' in (err as any)
  );
}

type TProps = {
  onUnauthenticated?: (() => void) | null;
  authPath?: string;
  safeOperations?: string[];
  debug?: boolean;
};

// Dedup redirects across multiple failing operations
let redirectInFlight = false;

export const createErrorLink = ({
  onUnauthenticated,
  authPath = '/auth',
  safeOperations = ['CurrentUser', 'currentUser'],
  debug = process.env.NODE_ENV !== 'production',
}: TProps): ApolloLink =>
  onError((err) => {
    const {
      networkError,
      graphQLErrors,
      operation: { operationName },
    } = err;

    const isUnauthorized =
      graphQLErrors?.some((e) => {
        const extensions = e.extensions as TErrorExtensions | undefined;
        return extensions?.code === API_ERROR_CODES.UNAUTHENTICATED;
      }) ?? false;

    const serverStatus = isServerError(networkError)
      ? (networkError.statusCode as number | undefined)
      : undefined;

    const isHttp401 = serverStatus === 401;

    const log = (...args: any[]) => {
      if (debug) {
        console.log(...args);
      }
    };

    log('[errorLink]', {
      operationName,
      isUnauthorized,
      isHttp401,
      serverStatus,
    });

    const redirectToAuth = () => {
      const ignoreOperation = safeOperations.includes(operationName);

      if (ignoreOperation || onUnauthenticated === null) {
        return;
      }

      if (redirectInFlight) {
        return;
      }

      redirectInFlight = true;

      try {
        // Custom handler wins
        if (onUnauthenticated) {
          onUnauthenticated();
          return;
        }

        // Otherwise navigate to auth
        if ('canGoBack' in router && router.canGoBack?.()) {
          router.dismissAll?.();
        }

        router.replace(authPath);
      } finally {
        // release in next tick so concurrent errors dedupe
        setTimeout(() => {
          redirectInFlight = false;
        }, 0);
      }
    };

    if (isUnauthorized || isHttp401) {
      redirectToAuth();

      return;
    }
  });
