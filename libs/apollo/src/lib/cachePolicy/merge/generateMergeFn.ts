import type { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import { extractPagination } from '../utils';
import { mergeArrayPayload, mergeObjectPayload } from './mergeFunctions';
import { resolveOffsetPagination, resolvePerPagePagination } from './resolvers';
import type {
  MergePaginationArgs,
  ResolveMergePagination,
  TCacheMergeOpts,
  WrapperMode,
} from './types';

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  if (Number.isFinite(n)) {
    return n;
  }
  return fallback;
}

function defaultResolvePaginationFn<TVars = unknown>(
  variables: TVars | undefined
): MergePaginationArgs {
  const pagination = extractPagination(variables);

  const resolveUsingOffset = resolveOffsetPagination<TVars>();
  const resolveUsingPerPage = resolvePerPagePagination<TVars>();

  if (pagination?.type === 'perPage') {
    return resolveUsingPerPage(variables);
  }

  return resolveUsingOffset(variables);
}

type TResult = FieldMergeFunction<
  unknown,
  unknown,
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
>;

export function generateMergeFn<TItem = unknown, TVars = unknown>(
  options?: TCacheMergeOpts<TItem, TVars>
): TResult {
  const mergeOptions = (options ?? {}) as
    | WrapperMode<TItem, TVars>
    | { mode: 'array' };

  const resolvePaginationFn: ResolveMergePagination<TVars> =
    (mergeOptions as WrapperMode<TItem, TVars>).resolvePaginationFn ??
    (defaultResolvePaginationFn as ResolveMergePagination<TVars>);

  const itemsFieldName =
    (mergeOptions as WrapperMode<TItem, TVars>).itemsFieldName ?? 'results';
  const totalFieldName =
    (mergeOptions as WrapperMode<TItem, TVars>).totalFieldName ?? 'totalCount';
  const pageInfoFieldName =
    (mergeOptions as WrapperMode<TItem, TVars>).pageInfoFieldName ?? 'pageInfo';

  // merge-item options (top-level getId still supported if you kept it in your types)
  const mergeItemOpts =
    (mergeOptions as WrapperMode<TItem, TVars>).mergeItemOpts ?? {};
  if (
    (mergeOptions as WrapperMode<TItem, TVars>).getItemId &&
    !mergeItemOpts.getItemId
  ) {
    mergeItemOpts.getItemId = (
      mergeOptions as WrapperMode<TItem, TVars>
    ).getItemId;
  }

  // array mode
  if ((mergeOptions as any).mode === 'array') {
    const base = mergeArrayPayload<TItem, TVars>(
      resolvePaginationFn
    ) as unknown as TResult;

    return function mergeArrayWithTransform(existing, incoming, fieldOpts) {
      const transformer = (options as any)?.transformIncoming;
      const normalizedIncoming =
        typeof transformer === 'function' ? transformer(incoming) : incoming;

      return base(existing, normalizedIncoming, fieldOpts);
    };
  }

  // wrapper mode (default)
  const base = mergeObjectPayload<TItem, TVars>(
    {
      resultsKey: itemsFieldName,
      totalKey: totalFieldName,
      pageInfoKey: pageInfoFieldName,
    },
    resolvePaginationFn,
    mergeItemOpts
  ) as unknown as TResult;

  return function mergeObjectWithTransform(existing, incoming, fieldOpts) {
    const transformer = (options as any)?.transformIncoming;
    const normalizedIncoming =
      typeof transformer === 'function' ? transformer(incoming) : incoming;

    return base(existing, normalizedIncoming, fieldOpts);
  };
}
