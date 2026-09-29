import { Ordering } from '@monorepo/ba-platform/types';
import { getInteractionOrder } from './getInteractionOrder';

describe('getInteractionOrder', () => {
  it('sorts interactions newest first', () => {
    expect(getInteractionOrder('newestFirst')).toEqual([
      { interactedAt: Ordering.Desc },
      { id: Ordering.Desc },
    ]);
  });

  it('sorts interactions oldest first', () => {
    expect(getInteractionOrder('oldestFirst')).toEqual([
      { interactedAt: Ordering.Asc },
      { id: Ordering.Asc },
    ]);
  });
});
