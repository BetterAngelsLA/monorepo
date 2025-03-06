import { TClientProfileCardItem, TTableItem } from './ClientProfileCard';
import { EmptyState } from './EmptyState';

type TGetVisibleItems = {
  items: TClientProfileCardItem[];
  showAll?: boolean;
};

export function getVisibleItems(props: TGetVisibleItems) {
  const { items, showAll } = props;

  const cardHasContent = cardHasData(items);
  const visibleItems: TClientProfileCardItem[] = [];

  for (const item of items) {
    const allRowsAreEmpty = allRowsEmpty(item.rows);

    // if any item has some content, show only those with content
    // unless showAll is True
    if (cardHasContent && allRowsAreEmpty && !showAll) {
      continue;
    }

    const totColumns = item.header?.length;
    const placeholderValue = <EmptyState placeholder={item.placeholder} />;

    // if allRowsAreEmpty for the item: show single row with placeholder
    if (allRowsAreEmpty) {
      const emptyRow = new Array(totColumns || 1).fill(placeholderValue);

      item.rows = [emptyRow];

      visibleItems.push(item);

      continue;
    }

    const updatedRows = [] as TTableItem[][];

    // showing only rows with content
    for (const row of item.rows) {
      if (isEmptyRow(row)) {
        continue;
      }

      const updatedRow = row.map((cell) => {
        return cell || placeholderValue;
      });

      updatedRows.push(updatedRow);
    }

    item.rows = updatedRows;

    visibleItems.push(item);
  }

  return visibleItems;
}

function cardHasData(items: TClientProfileCardItem[]): boolean {
  return items.some((item) => !allRowsEmpty(item.rows));
}

function allRowsEmpty(rows: TTableItem[][]): boolean {
  if (!rows.length) {
    return true;
  }

  return rows.every((row) => isEmptyRow(row));
}

function isEmptyRow(row: TTableItem[]): boolean {
  if (!row.length) {
    return true;
  }

  return row.every((cell) => !cell);
}
