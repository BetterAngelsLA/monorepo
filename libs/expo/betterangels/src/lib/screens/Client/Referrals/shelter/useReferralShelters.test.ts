import { loadReferralShelters } from './useReferralShelters';
import type { SheltersQuery } from '../__generated__/Shelters.generated';
const shelter = (id: number): SheltersQuery['shelters']['results'][number] => ({
  __typename: 'ShelterType',
  id: String(id),
  name: `Shelter ${id}`,
  location: null,
  pets: [],
  demographics: [],
  accessibility: [],
});
const page = (
  ids: number[],
  totalCount: number,
): SheltersQuery['shelters'] => ({
  __typename: 'ShelterTypeOffsetPaginated',
  results: ids.map(shelter),
  totalCount,
});
it('loads beyond 100 and advances by the server actual page size', async () => {
  const fetch = vi.fn(async (offset: number) =>
    page(
      Array.from({ length: Math.min(40, 125 - offset) }, (_, i) => offset + i),
      125,
    ),
  );
  expect(await loadReferralShelters(fetch)).toHaveLength(125);
  expect(fetch.mock.calls.map(([offset]) => offset)).toEqual([0, 40, 80, 120]);
});
it.each([
  [page([1], 2), page([], 2)],
  [page([1], 2), page([1], 2)],
  [page([1], 2), page([2], 3)],
  [page([1, 2], 1)],
  [page([], -1)],
])('refuses an incomplete or shifting directory', async (...pages) => {
  let index = 0;
  await expect(
    loadReferralShelters(async () => pages[index++]),
  ).rejects.toThrow();
});
it('propagates later-page errors without returning an incomplete selection list', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(page([1], 2))
    .mockRejectedValueOnce(new Error('offline'));
  await expect(loadReferralShelters(fetch)).rejects.toThrow('offline');
});
it('stops fetching after the form or environment is left', async () => {
  let cancelled = false;
  const fetch = vi.fn(async () => {
    cancelled = true;
    return page([1], 2);
  });
  expect(await loadReferralShelters(fetch, () => cancelled)).toEqual([]);
  expect(fetch).toHaveBeenCalledOnce();
});
