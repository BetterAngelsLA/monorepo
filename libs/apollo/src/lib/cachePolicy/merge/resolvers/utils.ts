export type OffsetPaginationVars = {
  type: 'offset';
  offset: number | string | null | undefined;
  limit: number | string | null | undefined;
};

export type PerPagePaginationVars = {
  type: 'perPage';
  page: number | string | null | undefined;
  perPage: number | string | null | undefined;
};

export type PaginationVars = PerPagePaginationVars | OffsetPaginationVars;

export type MergePaginationArgs = { offset: number; limit: number };

// -------------------- Utilities --------------------

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

export function toNumberOrFallback(value: unknown, fallback: number): number {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }

  return fallback;
}

// export function extractPaginationVariables<TVars>(
//   variables?: TVars | {}
// ): PaginationLike | undefined {
//   const pagination = (variables as any)?.pagination;

//   if (pagination === null || pagination === undefined) {
//     return undefined;
//   }

//   return pagination as PaginationLike;
// }

// type PaginationLike = {
//   offset?: unknown;
//   limit?: unknown;
//   page?: unknown;
//   perPage?: unknown;
// };

// export function extractPaginationFromVariables<TVars>(
//   variables: TVars | undefined
// ): PaginationLike | undefined {
//   const pagination = (variables as any)?.pagination;

//   if (pagination === null || pagination === undefined) {
//     return undefined;
//   }

//   return pagination as PaginationLike;
// }

// // 2) Shape detector
// export function hasPageBasedShape(
//   pagination: PaginationLike | undefined
// ): boolean {
//   if (!pagination) {
//     return false;
//   }

//   if ('page' in pagination) {
//     return true;
//   }

//   if ('perPage' in pagination) {
//     return true;
//   }

//   return false;
// }
