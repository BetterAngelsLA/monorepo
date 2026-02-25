import { TFormValidationError } from '../../../../errors';
import { toErrorMessage } from './toErrorMessage';
import { toOptionalString } from './toOptionalString';

export function toFormValidationError(
  rawInput: unknown
): TFormValidationError | undefined {
  if (!rawInput || typeof rawInput !== 'object') {
    return undefined;
  }

  const input = rawInput as Record<string, unknown>;

  const field = toOptionalString(input['field']) || '';
  const errorCode = toOptionalString(input['errorCode']) || '';
  const location = toOptionalString(input['location']);
  const message = toErrorMessage(input['message']);

  return {
    field,
    errorCode,
    location,
    message,
  };
}
