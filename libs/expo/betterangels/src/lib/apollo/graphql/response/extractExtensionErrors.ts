import { FetchResult } from '@apollo/client';
import { TFormValidationError } from '../../../errors';

export function extractExtensionErrors(response: FetchResult) {
  const errors = response.errors?.[0];

  return errors?.extensions?.['errors'] as TFormValidationError[] | undefined;
}
