import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { DataTable, TextBold } from '@monorepo/expo/shared/ui-components';
import { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from './EmptyState';

type TClickAction = {
  onClick?: () => void;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  buttonContent?: ReactElement;
};

type TTableItem = string | ReactNode | undefined | null;

export type TClientProfileCardItem = {
  header?: TTableItem[];
  rows: TTableItem[][];
  placeholder?: string | ReactNode;
};

type TClientProfileCard = {
  items: TClientProfileCardItem[];
  showAll?: boolean;
  action?: TClickAction;
};

export function ClientProfileCard(props: TClientProfileCard) {
  const { items, showAll, action = {} } = props;

  const {
    onClick,
    accessibilityLabel = 'edit',
    accessibilityHint = '',
    buttonContent,
  } = action;

  const visibleItems = getVisibleItems({ items, showAll });

  return (
    <View style={styles.container}>
      {visibleItems.map((item, idx) => {
        const header = item.header || [];
        const hasTitles = header.some((t) => !!t);

        return (
          <DataTable key={idx} style={styles.table}>
            {hasTitles && (
              <DataTable.Header>
                {header.map((title, idx) => {
                  return <DataTable.Title key={idx}>{title}</DataTable.Title>;
                })}
              </DataTable.Header>
            )}

            {item.rows.map((row, rowIdx) => {
              const rowCells = Array.isArray(row) ? row : [row];

              return (
                <DataTable.Row key={rowIdx}>
                  {rowCells.map((cellData, cellIdx) => {
                    return (
                      <DataTable.Cell key={cellIdx}>{cellData}</DataTable.Cell>
                    );
                  })}
                </DataTable.Row>
              );
            })}
          </DataTable>
        );
      })}

      {!!onClick && (
        <View>
          <Pressable onPress={onClick} style={{ alignSelf: 'flex-end' }}>
            <TextBold size="xs">Edit Btn</TextBold>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacings.lg,
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.md,
    borderRadius: Radiuses.xs,
  },
  table: {},
});

type TGetVisibleItems = {
  items: TClientProfileCardItem[];
  showAll?: boolean;
};

function getVisibleItems(props: TGetVisibleItems) {
  const { items, showAll } = props;

  const cardHasContent = cardHasData(items);
  const visibleItems: TClientProfileCardItem[] = [];

  for (const item of items) {
    const rowsAreEmpty = allRowsEmpty(item.rows);

    if (cardHasContent && rowsAreEmpty && !showAll) {
      continue;
    }

    const totColumns = item.header?.length;
    const placeholderValue = <EmptyState placeholder={item.placeholder} />;

    if (rowsAreEmpty) {
      const emptyRow = new Array(totColumns || 1).fill(placeholderValue);

      item.rows = [emptyRow];

      visibleItems.push(item);

      continue;
    }

    const updatedRows = [] as TTableItem[][];

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
