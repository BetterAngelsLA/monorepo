import { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import { AdaptArgs } from '../types';

/** Factory: merge for wrapper fields ({ results, totalCount, pageInfo }) */
export function wrapperMerge<TItem = unknown>(
  keys: { resultsKey: string; totalKey: string; pageInfoKey: string },
  adapt: AdaptArgs<unknown>
): FieldMergeFunction<
  unknown,
  unknown,
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  const { resultsKey, totalKey, pageInfoKey } = keys;

  return (existing, incoming, options) => {
    const { offset } = adapt(options.args as unknown);
    const start = offset ?? 0;

    const exObj = existing as Record<string, unknown> | undefined;
    const inObj = (incoming as Record<string, unknown>) ?? {};

    const prev = (exObj?.[resultsKey] as readonly TItem[] | undefined) ?? [];
    const next = (inObj?.[resultsKey] as readonly TItem[] | undefined) ?? [];

    const merged = prev.slice() as TItem[];
    for (let i = 0; i < next.length; i++) merged[start + i] = next[i] as TItem;

    const out: Record<string, unknown> = { ...inObj, [resultsKey]: merged };

    // carry forward metadata if incoming omitted it
    out[totalKey] = inObj[totalKey] ?? exObj?.[totalKey];
    out[pageInfoKey] = inObj[pageInfoKey] ?? exObj?.[pageInfoKey];

    return out;
  };
}
