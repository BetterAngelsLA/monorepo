import type { ApolloLink, ServerError } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { router } from 'expo-router';
import { API_ERROR_CODES } from '../../common';

type TErrorExtensions = {
  code?: string;
  http?: {
    status?: number;
  };
};

function isServerError(err: unknown): err is ServerError {
  return typeof err === 'object' && err !== null && 'statusCode' in err;
}

type TProps = {
  onUnauthenticated?: () => void;
  authPath?: string;
};

export const createErrorLink = ({
  onUnauthenticated,
  authPath = '/auth',
}: TProps): ApolloLink =>
  onError((err) => {
    const {
      networkError,
      graphQLErrors,
      operation: { operationName },
    } = err;

    let redirecting = false;

    const redirectToAuth = () => {
      if (redirecting) {
        return;
      }

      redirecting = true;

      if ('canGoBack' in router && router.canGoBack?.()) {
        router.dismissAll?.();
      }

      onUnauthenticated ? onUnauthenticated() : router.replace(authPath);

      // allow future redirects
      setTimeout(() => (redirecting = false), 0);
    };

    const isUnauthorized = graphQLErrors?.some((e) => {
      const extensions = e.extensions as TErrorExtensions | undefined;

      return extensions?.code === API_ERROR_CODES.UNAUTHENTICATED;
    });

    const statusCode =
      isServerError(networkError) &&
      (networkError.statusCode as number | undefined);

    const isHttp401 = statusCode === 401;

    console.log('*****************  isUnauthorized:', isUnauthorized);
    console.log('**********************  isHttp401:', isHttp401);

    if (isUnauthorized || isHttp401) {
      redirectToAuth();

      return;
    }

    console.log('');
    console.log('-------');
    console.log(`################# Error Link operationName: ${operationName}`);
    console.log('');
    console.log('################################### graphQLErrors');
    console.log(JSON.stringify(graphQLErrors, null, 2));

    return;
  });
