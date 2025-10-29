import type { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import type { ResolveMergePagination } from '../types';

/**
 * Options for customizing item-level behavior.
 * For example, you can override how we compute an item's identity.
 */
// asdf
// export type MergeOpts<TItem> = {
export type MergeItemOptions<TItem> = {
  /**
   * Extract a stable identifier for an item.
   * Defaults to reading the `id` field from Apollo's cache (via `readField('id', item)`).
   */
  getItemId?: (
    item: TItem,
    readField: FieldFunctionOptions['readField']
  ) => string | number | null | undefined;
};

/**
 * Merge function for paginated "wrapper" fields like:
 *
 * {
 *   results: [ ...items ],
 *   totalCount: Int,
 *   pageInfo: { offset, limit }
 * }
 *
 * Supports both infinite scroll and arbitrary offset jumps:
 * - Places new items into the correct slot based on `offset`.
 * - De-dupes items by ID so the same object never appears twice.
 * - Preserves `totalCount` and `pageInfo` if the incoming page omits them.
 * - Uses a sparse array so gaps are left unfilled until those pages are loaded.
 */
export function mergeObjectPayload<TItem = unknown, TVars = unknown>(
  keys: { resultsKey: string; totalKey: string; pageInfoKey: string },
  adapt: ResolveMergePagination<TVars>, // function that extracts { offset, limit } from query variables
  opts?: MergeItemOptions<TItem>
): FieldMergeFunction<
  unknown, // existing value in the cache
  unknown, // incoming value from the server
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  const { resultsKey, totalKey, pageInfoKey } = keys;

  return (existing, incoming, options) => {
    const { readField } = options;

    // 1. Figure out where this page of results should be placed.
    //    `adapt` looks at query variables (options.args) and returns an offset.
    const { offset = 0 } = adapt(options.args as TVars) || ({} as any);

    // 2. Normalize inputs: existing (cached) object vs incoming (new) object.
    const exObj = existing as Record<string, unknown> | undefined;
    const inObj = (incoming as Record<string, unknown>) ?? {};

    // Pull out previous results array and incoming results array.
    const prev = (exObj?.[resultsKey] as readonly TItem[] | undefined) ?? [];
    const next = (inObj?.[resultsKey] as readonly TItem[] | undefined) ?? [];

    // Clone existing results into a mutable array (Apollo accepts sparse arrays).
    const merged = prev.slice() as (TItem | undefined)[];

    // 3. Choose ID extractor: custom or default (`id` via readField).
    const getItemId =
      opts?.getItemId ??
      ((item: TItem, rf: FieldFunctionOptions['readField']) =>
        (rf && rf('id', item as any)) as string | number | null | undefined);

    // 4. Build an index of existing items by ID → position.
    //    This lets us detect duplicates and remove old copies later.
    const posById = new Map<string | number, number>();

    for (let i = 0; i < merged.length; i++) {
      const it = merged[i];

      if (it !== undefined) {
        const id = getItemId(it, readField);

        if (id !== null && id !== undefined && !posById.has(id)) {
          posById.set(id, i);
        }
      }
    }

    // 5. Insert each incoming item into the correct position based on offset.
    for (let i = 0; i < next.length; i++) {
      const item = next[i] as TItem;
      const targetIndex = offset + i;

      const id = getItemId(item, readField);

      if (id !== null && id !== undefined) {
        const existingAt = posById.get(id);

        // If this ID already exists elsewhere, clear the old slot
        // so we don’t end up with duplicates in the merged array.
        if (existingAt !== undefined && existingAt !== targetIndex) {
          merged[existingAt] = undefined;
        }

        // Update the index to the new position.
        posById.set(id, targetIndex);
      }

      // Place/overwrite the item at the computed index.
      merged[targetIndex] = item;
    }

    // 6. Build the final merged object:
    //    - Always include merged results.
    //    - Carry forward `totalCount` and `pageInfo` if incoming page omitted them.
    const out: Record<string, unknown> = { ...inObj, [resultsKey]: merged };
    out[totalKey] = inObj[totalKey] ?? exObj?.[totalKey];
    out[pageInfoKey] = inObj[pageInfoKey] ?? exObj?.[pageInfoKey];

    console.log();
    console.log('| ------ mergeObjectPayload MERGED DATA - out  ------ |');
    console.log(JSON.stringify(out, null, 2));
    console.log();

    return out;
  };
}
