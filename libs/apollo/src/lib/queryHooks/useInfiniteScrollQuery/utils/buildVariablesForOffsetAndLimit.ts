import type { OperationVariables } from '@apollo/client';

export function buildVariablesForOffsetAndLimit<
  TVars extends OperationVariables
>(
  baseVariables: TVars | undefined,
  shape: PaginationShape,
  args: { offset: number; limit: number }
): TVars {
  const base = (baseVariables ?? {}) as any;

  if (shape === 'pagePerPage') {
    const perPageFromUser = Number(base?.pagination?.perPage);
    const effectivePerPage =
      Number.isFinite(perPageFromUser) && perPageFromUser > 0
        ? perPageFromUser
        : args.limit;

    const pageNumber =
      effectivePerPage > 0 ? Math.floor(args.offset / effectivePerPage) + 1 : 1;

    return {
      ...base,
      pagination: { page: pageNumber, perPage: effectivePerPage },
    } as TVars;
  }

  // offset/limit (or unknown → fall back to offset/limit)
  return {
    ...base,
    pagination: { offset: args.offset, limit: args.limit },
  } as TVars;
}
