import {
  DEFAULT_QUERY_RESULTS_KEY,
  DEFAULT_QUERY_TOTAL_COUNT_KEY,
} from '../../../cachePolicy';
import { readAtPath } from '../../../utils';

/**
 * Extracts list items and total count from a query result,
 * using explicit path access. No guessing of shape.
 */
export function extractItemsAndTotalFromData<TData, TItem>(args: {
  data: TData | undefined;
  queryFieldName: string;
  itemsPath?: string | readonly string[];
  totalCountPath?: string | readonly string[];
}): { items: TItem[] | undefined; total: number } {
  const {
    data,
    queryFieldName,
    itemsPath = [DEFAULT_QUERY_RESULTS_KEY],
    totalCountPath = [DEFAULT_QUERY_TOTAL_COUNT_KEY],
  } = args;

  const field = (data as any)?.[queryFieldName];

  if (!field) {
    return { items: undefined, total: 0 };
  }

  const items = readAtPath(field, itemsPath) as TItem[] | undefined;
  const total = readAtPath(field, totalCountPath);

  return {
    items,
    total: typeof total === 'number' ? total : 0,
  };
}
