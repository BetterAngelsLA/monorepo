import { Ordering } from '../../apollo';

export const DEFAULT_PAGINATION_LIMIT = 20;
export const DEFAULT_ITEM_GAP = 16;

export const DEFAULT_QUERY_ORDER = {
  firstName: Ordering.AscNullsLast,
  id: Ordering.Desc,
};
