import { Ordering } from '@monorepo/ba-platform/types';
import type { TSortDirection } from '../../state';

export function getTaskOrder(direction: TSortDirection) {
  if (direction === 'oldestFirst') {
    return [{ createdAt: Ordering.AscNullsLast }, { id: Ordering.Asc }];
  }

  return [{ createdAt: Ordering.DescNullsLast }, { id: Ordering.Desc }];
}
