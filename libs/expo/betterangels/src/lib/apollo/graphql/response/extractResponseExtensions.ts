import { TFormValidationError } from '../../../errors';
import { extractGqlExtensions } from './extractGqlExtensions';
import { TResultMinimal, TResultWithError } from './types';
import { isNonNullable, toFormValidationError } from './utils';

export function extractResponseExtensions(
  response?: TResultMinimal | TResultWithError | null
): TFormValidationError[] | undefined {
  if (!response) {
    return undefined;
  }

  const responseExtensions = extractGqlExtensions(response);

  if (!responseExtensions.length) {
    return undefined;
  }

  const allRawExtensionEntries: unknown[] = [];

  // collect extension entries
  for (const ResponseExtension of responseExtensions) {
    const extensions = ResponseExtension.extensions;

    if (!extensions || typeof extensions !== 'object') {
      continue;
    }

    const rawErrors = (extensions as Record<string, unknown>)['errors'];

    if (Array.isArray(rawErrors)) {
      allRawExtensionEntries.push(...rawErrors);
    }
  }

  if (!allRawExtensionEntries.length) {
    return undefined;
  }

  // normalize to TFormValidationError
  const mappedValidationErrors = allRawExtensionEntries
    .map((item) => {
      return toFormValidationError(item);
    })
    .filter((maybeError): maybeError is TFormValidationError => {
      return isNonNullable(maybeError);
    });

  if (!mappedValidationErrors.length) {
    return undefined;
  }

  return mappedValidationErrors;
}
