import { Ordering } from '@monorepo/ba-platform/types';
import { getTaskOrder } from './getTaskOrder';

describe('getTaskOrder', () => {
  it('sorts tasks newest first', () => {
    expect(getTaskOrder('newestFirst')).toEqual([
      { createdAt: Ordering.DescNullsLast },
      { id: Ordering.Desc },
    ]);
  });

  it('sorts tasks oldest first', () => {
    expect(getTaskOrder('oldestFirst')).toEqual([
      { createdAt: Ordering.AscNullsLast },
      { id: Ordering.Asc },
    ]);
  });
});
