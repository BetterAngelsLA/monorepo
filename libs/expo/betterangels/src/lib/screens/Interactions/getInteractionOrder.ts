import { Ordering } from '@monorepo/ba-platform/types';
import type { TSortDirection } from '../../ui-components';

export function getInteractionOrder(direction: TSortDirection) {
  if (direction === 'oldestFirst') {
    return [{ interactedAt: Ordering.Asc }, { id: Ordering.Asc }];
  }

  return [{ interactedAt: Ordering.Desc }, { id: Ordering.Desc }];
}
