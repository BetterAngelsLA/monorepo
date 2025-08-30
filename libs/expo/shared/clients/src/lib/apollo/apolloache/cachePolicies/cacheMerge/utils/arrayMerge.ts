import { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import { AdaptArgs } from '../types';

export function arrayMerge<TItem = unknown>(
  adapt: AdaptArgs<unknown>
): FieldMergeFunction<
  unknown,
  unknown,
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  return (existing, incoming, options) => {
    const { offset } = adapt(options.args as unknown);
    const start = offset ?? 0;

    const prev = (existing as readonly TItem[] | undefined) ?? [];
    const next = (incoming as readonly TItem[] | undefined) ?? [];

    const out = prev.slice() as TItem[];
    for (let i = 0; i < next.length; i++) out[start + i] = next[i] as TItem;
    return out;
  };
}
