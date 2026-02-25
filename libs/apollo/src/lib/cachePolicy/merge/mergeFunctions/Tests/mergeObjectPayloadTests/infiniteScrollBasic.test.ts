import { describe, expect, it } from 'vitest';
import { mergeObjectPayload } from '../../mergeObjectPayload';
import {
  TItem,
  adaptPagination,
  generateIncoming,
  makeOptions,
} from '../testUtils';

describe('mergeObjectPayload – wrapper strategy (infinite scroll)', () => {
  it('merges sequential pages at offsets and preserves metadata', () => {
    // wrapper to satisfy ResolveMergePagination type
    const resolvePaginationStrict = (
      vars: { pagination?: { offset?: number; limit?: number } } | undefined
    ) => {
      const base = adaptPagination(vars);
      return {
        offset: base.offset ?? 0,
        limit: base.limit ?? 0,
      };
    };

    const mergeFn = mergeObjectPayload<
      TItem,
      { pagination?: { offset?: number; limit?: number } }
    >({
      resolvePaginationFn: resolvePaginationStrict,
    });

    // --- Page 1 (offset 0) ---
    const afterPage1 = mergeFn(
      undefined,
      generateIncoming(
        [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
          { id: 3, name: 'C' },
        ],
        { totalCount: 6, pageInfo: { offset: 0, limit: 3 } }
      ) as any,
      makeOptions({ pagination: { offset: 0, limit: 3 } })
    );

    expect((afterPage1 as any).results.map((it: TItem) => it?.id)).toEqual([
      1, 2, 3,
    ]);
    expect((afterPage1 as any).totalCount).toBe(6);
    expect((afterPage1 as any).pageInfo).toEqual({ offset: 0, limit: 3 });

    // --- Page 2 (offset 3), omit totalCount to verify carry-forward ---
    const afterPage2 = mergeFn(
      afterPage1 as any,
      generateIncoming(
        [
          { id: 4, name: 'D' },
          { id: 5, name: 'E' },
          { id: 6, name: 'F' },
        ],
        { pageInfo: { offset: 3, limit: 3 } }
      ) as any,
      makeOptions({ pagination: { offset: 3, limit: 3 } })
    );

    expect(
      (afterPage2 as any).results.map((it: TItem | undefined) => it?.id)
    ).toEqual([1, 2, 3, 4, 5, 6]);
    expect((afterPage2 as any).totalCount).toBe(6); // carried forward
    expect((afterPage2 as any).pageInfo).toEqual({ offset: 3, limit: 3 });
  });
});
