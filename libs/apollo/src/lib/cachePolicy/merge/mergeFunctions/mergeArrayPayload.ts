import type { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import type { ResolveMergePagination } from '../types';

export function mergeArrayPayload<TItem = unknown, TVars = unknown>(
  resolvePagination: ResolveMergePagination<TVars>
): FieldMergeFunction<
  readonly TItem[] | undefined,
  readonly TItem[] | undefined,
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  return (existing, incoming, options) => {
    const { offset = 0 } =
      resolvePagination(options.args as TVars) || ({} as any);

    const prev = (existing as readonly TItem[] | undefined) ?? [];
    const next = (incoming as readonly TItem[] | undefined) ?? [];

    const merged = prev.slice() as (TItem | undefined)[];

    for (let i = 0; i < next.length; i++) merged[offset + i] = next[i] as TItem;

    return merged as unknown as readonly TItem[];
  };
}
