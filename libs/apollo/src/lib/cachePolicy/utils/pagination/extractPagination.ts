import { PaginationVars } from '../../merge/types';

export function extractPagination<TVars>(
  value: TVars | undefined
): PaginationVars | undefined {
  let pagination = extractPaginationObject(value);

  if (!pagination) {
    return undefined;
  }

  const page = pagination['page'];
  const perPage = pagination['perPage'];

  if (page !== undefined || perPage !== undefined) {
    return {
      type: 'perPage',
      page: page as number | string | null,
      perPage: perPage as number | string | null,
    };
  }

  const offset = pagination['offset'];
  const limit = pagination['limit'];

  if (offset !== undefined || limit !== undefined) {
    return {
      type: 'offset',
      offset: offset as number | string | null,
      limit: limit as number | string | null,
    };
  }

  return undefined;
}

function extractPaginationObject<T>(
  value: T | undefined
): Record<string, unknown> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  // If value has a `pagination` key, use that
  if (
    typeof value === 'object' &&
    value !== null &&
    'pagination' in (value as object)
  ) {
    const inner = (value as Record<string, unknown>)['pagination'];

    if (typeof inner === 'object' && inner !== null) {
      return inner as Record<string, unknown>;
    }
  }

  // If the top-level value itself looks like a pagination object
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }

  return undefined;
}
