import type { ExtensionError } from '../types';

type FilterExtensionErrorsParams = {
  errors: ExtensionError[];
  key: 'field' | 'errorCode' | 'message';
  filters: string[];
};

/**
 * Filter extension errors by a specific key, keeping only those whose
 * value matches one of the provided filters.
 */
export function filterExtensionErrors(
  params: FilterExtensionErrorsParams
): ExtensionError[] {
  const { errors, key, filters } = params;

  const filterSet = new Set(filters);

  return errors.filter((e) => {
    const value = e[key];

    return typeof value === 'string' && filterSet.has(value);
  });
}
