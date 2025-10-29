import type { ResolveMergePagination } from '../types';

/**
 * For APIs that already use { pagination: { offset, limit } }
 */
export function resolveOffsetPagination<
  TVars = any
>(): ResolveMergePagination<TVars> {
  return function convertOffsetVars(variables: any) {
    const offset = Number(variables?.pagination?.offset) || 0;
    const limit = Number(variables?.pagination?.limit) || 0;

    return { offset, limit };
  };
}
