import { ApolloLink } from '@apollo/client';
import { TApiValidationError } from './types';

type MinimalResult = {
  errors?: readonly {
    extensions?: Record<string, unknown>;
  }[];
};

export function extractExtensionErrors(
  response: ApolloLink.Result | MinimalResult
) {
  const errors = response.errors?.[0];

  return errors?.extensions?.['errors'] as TApiValidationError[] | undefined;
}
