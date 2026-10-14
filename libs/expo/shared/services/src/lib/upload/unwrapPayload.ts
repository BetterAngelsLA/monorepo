import { OperationInfoError, PresignedUploadError } from './errors';

export type TOperationInfoPayload = {
  // `__typename` is optional to structurally match generated GraphQL types.
  __typename?: 'OperationInfo';
  messages: readonly { message: string }[];
};

/**
 * Validates a mutation payload that can be either an `OperationInfo` error or
 * a success type, throwing a typed error when it is not the expected success.
 *
 * @param payload      The mutation result payload (or null/undefined).
 * @param context      Human-readable name used in error messages.
 * @param successTypename The `__typename` that represents success.
 */
export function unwrapPayload<T extends { __typename?: string }>(
  payload: T | null | undefined,
  context: string,
  successTypename: string,
): Exclude<T, TOperationInfoPayload> {
  if (!payload) {
    throw new PresignedUploadError(`Missing ${context} response`);
  }

  if (payload.__typename === 'OperationInfo') {
    throw new OperationInfoError(
      (payload as unknown as TOperationInfoPayload).messages,
    );
  }

  if (payload.__typename !== successTypename) {
    throw new PresignedUploadError(
      `Unexpected ${context} response type: ${String(payload.__typename)}`,
    );
  }

  return payload as Exclude<T, TOperationInfoPayload>;
}
