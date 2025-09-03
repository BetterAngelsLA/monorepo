import { mergeObjectPayload } from '../../mergeObjectPayload';
import {
  TItem,
  adaptPagination,
  generateIncoming,
  makeOptions,
  paginationKeys,
} from '../utils';

describe('mergeObjectPayload – paginated (sparse) jumps with offsets', () => {
  test('load page 1 (offset 0), then page 3 (offset 6), then page 2 (offset 3)', () => {
    const limit = 3;
    const mergeFn = mergeObjectPayload<
      TItem,
      { pagination?: { offset?: number; limit?: number } }
    >(paginationKeys, adaptPagination);

    // --- Load Page 1 (offset 0) ---
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
    expect((afterPage1 as any).pageInfo).toEqual({ offset: 0, limit });

    // --- Load Page 3 (offset 6) ---
    const afterPage3 = mergeFn(
      afterPage1 as any,
      generateIncoming(
        [
          { id: 7, name: 'G' },
          { id: 8, name: 'H' },
          { id: 9, name: 'I' },
        ],
        { pageInfo: { offset: 6, limit } } // omit totalCount to test carry-forward
      ) as any,
      makeOptions({ pagination: { offset: 6, limit } })
    );

    // Expect holes for page 2 (indices 3,4,5)
    expect(
      (afterPage3 as any).results.map((it: TItem | undefined) => it?.id)
    ).toEqual([1, 2, 3, undefined, undefined, undefined, 7, 8, 9]);

    expect((afterPage3 as any).totalCount).toBe(9); // carried forward
    expect((afterPage3 as any).pageInfo).toEqual({ offset: 6, limit });

    // --- Load  Page 2 (offset 3) fills the holes ---
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

    // Now the sequence should be fully dense 1..9 in order
    expect(
      (afterPage2 as any).results.map((it: TItem | undefined) => it?.id)
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // totalCount remains, pageInfo reflects the latest page's meta if present
    expect((afterPage2 as any).totalCount).toBe(9);
    expect((afterPage2 as any).pageInfo).toEqual({ offset: 3, limit });
  });
});
