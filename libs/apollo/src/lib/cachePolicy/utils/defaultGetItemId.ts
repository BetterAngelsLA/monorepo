import type { FieldFunctionOptions } from '@apollo/client';
import { DEFAULT_QUERY_ID_KEY } from '../constants';

/**
 * Default implementation of getItemId.
 * Falls back to Apollo's `readField('id', item)` pattern.
 */
export function defaultGetItemId<TItem>(
  item: TItem,
  readField: FieldFunctionOptions['readField']
): string | number | null | undefined {
  if (typeof readField !== 'function') {
    return null;
  }

  return readField(DEFAULT_QUERY_ID_KEY, item as any) as
    | string
    | number
    | null
    | undefined;
}
