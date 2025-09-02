import type { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import type { AdaptArgs } from '../types';

export type MergeOpts<TItem> = {
  getId?: (
    item: TItem,
    readField: FieldFunctionOptions['readField']
  ) => string | number | null | undefined;
};

export function cacheMerge<TItem = unknown, TVars = unknown>(
  keys: { resultsKey: string; totalKey: string; pageInfoKey: string },
  adapt: AdaptArgs<TVars>,
  opts?: MergeOpts<TItem>
): FieldMergeFunction<
  unknown,
  unknown,
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  const { resultsKey, totalKey, pageInfoKey } = keys;

  return (existing, incoming, options) => {
    const { readField } = options;
    const { offset = 0 } = adapt(options.args as TVars) || ({} as any); // <-- TVars

    const exObj = existing as Record<string, unknown> | undefined;
    const inObj = (incoming as Record<string, unknown>) ?? {};

    const prev = (exObj?.[resultsKey] as readonly TItem[] | undefined) ?? [];
    const next = (inObj?.[resultsKey] as readonly TItem[] | undefined) ?? [];

    const merged = prev.slice() as (TItem | undefined)[];

    const getId =
      opts?.getId ??
      ((item: TItem, rf: FieldFunctionOptions['readField']) =>
        (rf && rf('id', item as any)) as string | number | null | undefined);

    const posById = new Map<string | number, number>();
    for (let i = 0; i < merged.length; i++) {
      const it = merged[i];
      if (it !== undefined) {
        const id = getId(it, readField);
        if (id !== null && id !== undefined && !posById.has(id))
          posById.set(id, i);
      }
    }

    for (let i = 0; i < next.length; i++) {
      const item = next[i] as TItem;
      const targetIndex = offset + i;

      const id = getId(item, readField);
      if (id !== null && id !== undefined) {
        const existingAt = posById.get(id);
        if (existingAt !== undefined && existingAt !== targetIndex) {
          merged[existingAt] = undefined;
        }
        posById.set(id, targetIndex);
      }

      merged[targetIndex] = item;
    }

    const out: Record<string, unknown> = { ...inObj, [resultsKey]: merged };
    out[totalKey] = inObj[totalKey] ?? exObj?.[totalKey];
    out[pageInfoKey] = inObj[pageInfoKey] ?? exObj?.[pageInfoKey];

    return out;
  };
}
