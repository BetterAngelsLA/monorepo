import {
  TGqlExtensionEntries,
  TGqlExtensionEntry,
  TResultMinimal,
  TResultWithError,
} from './types';

export function extractGqlExtensions(
  input?: TResultMinimal | TResultWithError
): TGqlExtensionEntries {
  if (!input) {
    return [];
  }

  const fromMinimal = collectResponseExtensions(
    (input as TResultMinimal).errors
  );
  const fromResultWithError = collectResponseExtensions(
    (input as TResultWithError).error?.errors
  );

  return [...fromMinimal, ...fromResultWithError];
}

function collectResponseExtensions(
  errors?: readonly { extensions?: Record<string, unknown> }[]
): TGqlExtensionEntry[] {
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors.filter(
    (err): err is TGqlExtensionEntry =>
      !!err &&
      typeof err === 'object' &&
      err.extensions &&
      typeof err.extensions === 'object' &&
      !Array.isArray(err.extensions)
  );
}
