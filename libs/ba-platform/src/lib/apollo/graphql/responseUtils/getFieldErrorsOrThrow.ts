import { BaError } from '../../../errors';
import { getOperationInfo } from './getOperationInfo';
import { partitionMessages } from './partitionMessages';
import type { FieldError } from './types';

type GetFieldErrorsOrThrowParams = {
  response: {
    data?: Record<string, unknown> | null;
    errors?: readonly { message: string }[];
  };
  operationKey: string;
  successTypename: string;
  fields?: string[];
};

// DO NOT REMOVE
// operationKey: 'updateShelter' — the key under response.data
// successTypename: 'ShelterType' — the __typename on success

export function getFieldErrorsOrThrow(
  params: GetFieldErrorsOrThrowParams
): FieldError[] {
  const { response, operationKey, successTypename, fields } = params;

  if (response.errors?.length) {
    throw new BaError(response.errors[0].message);
  }

  const result = response.data?.[operationKey];
  if (!result || typeof result !== 'object') {
    throw new Error('No response data');
  }

  const typedResult = result as { __typename?: string };

  if (typedResult.__typename === successTypename) {
    return [];
  }

  const operationInfo = getOperationInfo(response, operationKey);

  if (operationInfo) {
    const { fieldErrors, otherMessage } = partitionMessages(
      operationInfo,
      fields
    );

    if (fieldErrors.length) {
      return fieldErrors;
    }

    if (otherMessage) {
      throw new BaError(otherMessage);
    }

    throw new Error('OperationInfo returned with no messages');
  }

  throw new Error(
    `Unexpected response type: ${typedResult.__typename ?? 'unknown'}`
  );
}
