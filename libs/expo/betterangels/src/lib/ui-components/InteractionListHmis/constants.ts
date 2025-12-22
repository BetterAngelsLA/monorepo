import { Ordering } from '../../apollo';

export const DEFAULT_PAGINATION_LIMIT = 20;

export const DEFAULT_QUERY_ORDER = [
  {
    date: Ordering.AscNullsLast,
  },
  {
    id: Ordering.Desc,
  },
];
