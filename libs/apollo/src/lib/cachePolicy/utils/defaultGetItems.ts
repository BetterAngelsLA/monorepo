import { DEFAULT_QUERY_RESULTS_KEY } from '../constants';

export function defaultGetItems<T = unknown>(
  obj: Record<string, unknown> | undefined,
  key = DEFAULT_QUERY_RESULTS_KEY
): ReadonlyArray<T> {
  if (!obj) {
    return [];
  }

  const value = obj[key];

  if (Array.isArray(value)) {
    return value as ReadonlyArray<T>;
  }

  return [];
}
