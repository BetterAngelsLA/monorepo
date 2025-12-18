import { Ordering } from '../../apollo';

export const DEFAULT_PAGINATION_LIMIT = 20;

export const DEFAULT_QUERY_ORDER = {
  date: Ordering.AscNullsLast,
  id: Ordering.Desc,
};

// HmisNoteOrdering

// input HmisNoteOrdering {
//   id: Ordering
//   addedDate: Ordering
//   lastUpdated: Ordering
//   date: Ordering
// }
