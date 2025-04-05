import { FetchResult } from '@apollo/client';
import { TApiValidationError } from './types';

export function extractExtensionErrors(response: FetchResult) {
  const errors = response.errors?.[0];

  return errors?.extensions?.['errors'] as TApiValidationError[] | undefined;
}
