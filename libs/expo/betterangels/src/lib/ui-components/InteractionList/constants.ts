import { Ordering } from '../../apollo';

export const DEFAULT_PAGINATION_LIMIT = 20;
export const DEFAULT_ITEM_GAP = 16;

// ordering: [{ interactedAt: Ordering.Desc }, { id: Ordering.Desc }],
export const DEFAULT_QUERY_ORDER = {
  interactedAt: Ordering.AscNullsLast,
  id: Ordering.Desc,
};
