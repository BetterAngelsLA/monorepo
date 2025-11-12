import { describe, expect, it } from 'vitest';
import { mergeObjectPayload } from '../../mergeObjectPayload';
import {
  TItem,
  adaptPagination,
  generateIncoming,
  makeOptions,
} from '../testUtils';

describe('mergeObjectPayload – paginated (sparse) jumps with offsets', () => {
  it('load page 1 (offset 0), then page 3 (offset 6), then page 2 (offset 3)', () => {
    const limit = 3;

    // stricter wrapper that matches ResolveMergePagination<TVars>
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
      // the rest can be omitted because mergeObjectPayload has defaults,
      // but could also be explicit to match payload shape:
      // itemsPath: ['results'],
      // totalCountPath: ['totalCount'],
      // itemIdPath: ['id'],
    });

    // --- page 1 ---
    const afterPage1 = mergeFn(
      undefined,
      generateIncoming(
        [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
          { id: 3, name: 'C' },
        ],
        { totalCount: 9, pageInfo: { offset: 0, limit } }
      ) as any,
      makeOptions({ pagination: { offset: 0, limit } })
    );

    expect(
      (afterPage1 as any).results.map((it: TItem | undefined) => it?.id)
    ).toEqual([1, 2, 3]);
    expect((afterPage1 as any).totalCount).toBe(9);

    // --- page 3 ---
    const afterPage3 = mergeFn(
      afterPage1 as any,
      generateIncoming(
        [
          { id: 7, name: 'G' },
          { id: 8, name: 'H' },
          { id: 9, name: 'I' },
        ],
        { pageInfo: { offset: 6, limit } }
      ) as any,
      makeOptions({ pagination: { offset: 6, limit } })
    );

    expect(
      (afterPage3 as any).results.map((it: TItem | undefined) => it?.id)
    ).toEqual([1, 2, 3, undefined, undefined, undefined, 7, 8, 9]);
    expect((afterPage3 as any).totalCount).toBe(9);

    // --- page 2 ---
    const afterPage2 = mergeFn(
      afterPage3 as any,
      generateIncoming(
        [
          { id: 4, name: 'D' },
          { id: 5, name: 'E' },
          { id: 6, name: 'F' },
        ],
        { pageInfo: { offset: 3, limit } }
      ) as any,
      makeOptions({ pagination: { offset: 3, limit } })
    );

    expect(
      (afterPage2 as any).results.map((it: TItem | undefined) => it?.id)
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect((afterPage2 as any).totalCount).toBe(9);
  });
});
