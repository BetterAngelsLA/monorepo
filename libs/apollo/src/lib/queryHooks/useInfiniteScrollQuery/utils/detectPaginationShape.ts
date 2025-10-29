import type { OperationVariables } from '@apollo/client';

export function detectPaginationShape(
  variables: OperationVariables | undefined
): PaginationShape {
  const pagination = (variables as any)?.pagination;

  if (
    pagination &&
    (Object.prototype.hasOwnProperty.call(pagination, 'page') ||
      Object.prototype.hasOwnProperty.call(pagination, 'perPage'))
  ) {
    return 'pagePerPage';
  }

  if (
    pagination &&
    (Object.prototype.hasOwnProperty.call(pagination, 'offset') ||
      Object.prototype.hasOwnProperty.call(pagination, 'limit'))
  ) {
    return 'offsetLimit';
  }

  return 'unknown';
}
