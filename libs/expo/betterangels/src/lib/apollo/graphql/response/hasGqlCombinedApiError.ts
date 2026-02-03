import type { ErrorLike } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ApiErrorCode } from '@monorepo/expo/shared/clients';

export function hasGqlCombinedApiError(
  code: ApiErrorCode,
  error?: ErrorLike
): boolean {
  if (!CombinedGraphQLErrors.is(error)) {
    return false;
  }

  return error.errors.some((graphQLError) => {
    return graphQLError.extensions?.code === code;
  });
}
