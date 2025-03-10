import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { DataTable } from '@monorepo/expo/shared/ui-components';
import { ReactElement, ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ClientProfileCardEmptyState } from './ClientProfileCardEmptyState';

/* TODO: update or remove once we have a ticket for the Edit Button */
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
  style?: ViewStyle;
};

export function ClientProfileCard(props: TClientProfileCard) {
  // const { items, showAll, action = {}, style } = props;
  const { items, showAll, style } = props;

  /* TODO: update or remove once we have a ticket for the Edit Button */
  // const {
  //   onClick,
  //   accessibilityLabel = 'edit',
  //   accessibilityHint = '',
  //   buttonContent,
  // } = action;

  const visibleItems = getVisibleItems({ items, showAll });

  return (
    <View style={[styles.container, style]}>
      {visibleItems.map((item, idx) => {
        const header = item.header || [];
        const hasTitles = header.some((t) => !!t);

        return (
          <DataTable key={idx}>
            {hasTitles && (
              <DataTable.Header>
                {header.map((title, idx) => {
                  return (
                    <DataTable.Title
                      key={idx}
                      textStyle={styles.headerTitleText}
                      maxLines={2}
                    >
                      {title}
                    </DataTable.Title>
                  );
                })}
              </DataTable.Header>
            )}

            {item.rows.map((row, rowIdx) => {
              return (
                <DataTable.Row key={rowIdx}>
                  {row.map((cellData, cellIdx) => {
                    return (
                      <DataTable.Cell
                        key={cellIdx}
                        numberOfLines={null}
                        textStyle={styles.cellText}
                      >
                        {cellData}
                      </DataTable.Cell>
                    );
                  })}
                </DataTable.Row>
              );
            })}
          </DataTable>
        );
      })}

      {/* TODO: update or remove once we have a ticket for the Edit Button */}
      {/* {!!onClick && (
        <View>
          <Pressable onPress={onClick} style={{ alignSelf: 'flex-end' }}>
            <TextBold size="xs">Edit Btn</TextBold>
          </Pressable>
        </View>
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacings.lg,
  },
  headerTitleText: {
    color: Colors.PRIMARY_EXTRA_DARK,
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    fontFamily: 'Poppins-Regular',
    fontWeight: 400,
  },
  cellText: {
    color: Colors.PRIMARY_EXTRA_DARK,
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: 700,
  },
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
    const placeholderValue = (
      <ClientProfileCardEmptyState placeholder={item.placeholder} />
    );

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
