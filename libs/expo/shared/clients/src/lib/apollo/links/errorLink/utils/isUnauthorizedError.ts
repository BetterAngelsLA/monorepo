import { API_ERROR_CODES } from '../../../../common';
import { isServerError } from './utils';

type TErrorExtensions = { code?: string };

export function isUnauthorizedError(
  graphQLErrors?: readonly any[],
  networkError?: unknown
): boolean {
  const hasGraphql401 = graphQLErrors?.some(
    (e) =>
      (e.extensions as TErrorExtensions | undefined)?.code ===
      API_ERROR_CODES.UNAUTHENTICATED
  );

  const serverStatus = isServerError(networkError)
    ? (networkError.statusCode as number | undefined)
    : undefined;

  const hasHttp401 = serverStatus === 401;

  return !!hasGraphql401 || hasHttp401;
}
