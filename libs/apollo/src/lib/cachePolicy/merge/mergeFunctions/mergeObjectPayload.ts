import type { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import type { ResolveMergePagination } from '../types';

export type MergeObjectOptions<TItem> = {
  /**
   * Read the list of items from the incoming server payload.
   * If not provided, we fall back to `incoming[resultsKey]`.
   */
  getItems?: (incoming: unknown) => ReadonlyArray<TItem> | undefined;

  /**
   * Read the total count from the incoming server payload.
   * If not provided, we fall back to `incoming[totalKey]` or existing total.
   */
  getTotalCount?: (incoming: unknown) => number | undefined;

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
 *   items: [ ... ],
 *   totalCount: number,
 *   pageInfo: { ... }
 * }
 *
 * - places new items at offset
 * - de-dupes by id
 * - preserves total/pageInfo if missing
 */
export function mergeObjectPayload<TItem = unknown, TVars = unknown>(
  keys: { resultsKey: string; totalKey: string; pageInfoKey: string },
  resolvePagination: ResolveMergePagination<TVars>,
  opts?: MergeObjectOptions<TItem>
): FieldMergeFunction<
  unknown,
  unknown,
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  const { resultsKey, totalKey, pageInfoKey } = keys;

  return (existing, incoming, fieldOptions) => {
    const { readField, args } = fieldOptions;

    // 1. figure out where to insert this page
    const { offset = 0 } = resolvePagination(args as TVars) || ({} as any);

    // 2. normalize existing/incoming to objects
    const existingObject = existing as Record<string, unknown> | undefined;
    const incomingObject = (incoming as Record<string, unknown>) ?? {};

    // 3. read previous merged list
    const previousList =
      (existingObject?.[resultsKey] as ReadonlyArray<TItem> | undefined) ?? [];

    // 4. read incoming list — prefer accessor
    const incomingListFromAccessor = opts?.getItems?.(incoming);
    const incomingList =
      incomingListFromAccessor ??
      (incomingObject[resultsKey] as ReadonlyArray<TItem> | undefined) ??
      [];

    // make a mutable copy; Apollo accepts sparse arrays
    const merged = previousList.slice() as (TItem | undefined)[];

    // 5. pick ID function
    const getItemId =
      opts?.getItemId ??
      ((item: TItem, rf: FieldFunctionOptions['readField']) =>
        (rf && rf('id', item as any)) as string | number | null | undefined);

    // 6. index existing items by id → position
    const positionById = new Map<string | number, number>();

    for (let i = 0; i < merged.length; i++) {
      const existingItem = merged[i];
      if (existingItem !== undefined) {
        const id = getItemId(existingItem, readField);

        if (id !== null && id !== undefined && !positionById.has(id)) {
          positionById.set(id, i);
        }
      }
    }

    // 7. insert incoming items at the right offset
    for (let i = 0; i < incomingList.length; i++) {
      const item = incomingList[i] as TItem;
      const targetIndex = offset + i;

      const id = getItemId(item, readField);

      if (id !== null && id !== undefined) {
        const existingAt = positionById.get(id);

        if (existingAt !== undefined && existingAt !== targetIndex) {
          merged[existingAt] = undefined;
        }

        positionById.set(id, targetIndex);
      }

      merged[targetIndex] = item;
    }

    // 8. build final object
    const result: Record<string, unknown> = {
      ...incomingObject,
      [resultsKey]: merged,
    };

    // total: accessor → incoming → existing
    const totalFromAccessor = opts?.getTotalCount?.(incoming);

    result[totalKey] =
      totalFromAccessor ??
      (incomingObject[totalKey] as number | undefined) ??
      (existingObject?.[totalKey] as number | undefined);

    // pageInfo: incoming → existing
    result[pageInfoKey] =
      incomingObject[pageInfoKey] ?? existingObject?.[pageInfoKey];

    return result;
  };
}
