import { FieldFunctionOptions } from '@apollo/client';

export function buildPositionByIdMap<TItem>(
  items: Array<TItem | undefined>,
  readItemId: (
    item: TItem,
    readField: FieldFunctionOptions['readField']
  ) => string | number | null | undefined,
  readField: FieldFunctionOptions['readField']
): Map<string | number, number> {
  const positionById = new Map<string | number, number>();

  for (let index = 0; index < items.length; index = index + 1) {
    const item = items[index];

    if (item === undefined) {
      continue;
    }

    const id = readItemId(item, readField);

    if (id === null || id === undefined) {
      continue;
    }

    if (!positionById.has(id)) {
      positionById.set(id, index);
    }
  }

  return positionById;
}
