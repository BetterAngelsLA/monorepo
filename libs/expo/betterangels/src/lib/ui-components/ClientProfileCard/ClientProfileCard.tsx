import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { DataTable, TextBold } from '@monorepo/expo/shared/ui-components';
import { ReactElement, ReactNode, isValidElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type TClickAction = {
  onClick?: () => void;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  buttonContent?: ReactElement;
};

type TTableItem = string | ReactNode;

type TClientProfileCardItem = {
  title?: TTableItem | TTableItem[];
  content: TTableItem | TTableItem[] | TTableItem[][];
};

type TClientProfileCard = {
  items: TClientProfileCardItem[];
  showAll?: boolean;
  action?: TClickAction;
  placeholder?: string | ReactNode;
};

export function ClientProfileCard(props: TClientProfileCard) {
  const { items, placeholder, showAll, action = {} } = props;

  const {
    onClick,
    accessibilityLabel = 'edit',
    accessibilityHint = '',
    buttonContent,
  } = action;

  const visibleItems = getVisibleItems({ items, showAll, placeholder });

  return (
    <View style={styles.container}>
      {visibleItems.map((item, idx) => {
        const titles = Array.isArray(item.title) ? item.title : [item.title];
        const hasSomeTitle = titles.some((t) => !!t);

        const rows = Array.isArray(item.content)
          ? item.content
          : [item.content];

        if (!rows.length) {
          return null;
        }

        return (
          <DataTable key={idx} style={styles.table}>
            {hasSomeTitle && (
              <DataTable.Header>
                {titles.map((title, idx) => {
                  return <DataTable.Title key={idx}>{title}</DataTable.Title>;
                })}
              </DataTable.Header>
            )}

            {rows.map((row, rowIdx) => {
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
  placeholder?: string | ReactNode;
  showAll?: boolean;
};

function getVisibleItems(props: TGetVisibleItems) {
  const { items, placeholder, showAll } = props;

  // if (showAll) {
  //   return items.map((i) => {
  //     return {

  //     }
  //   })
  // }

  // return items.filter((item) => !!itemHasContent(item));
  return items;
}

function hasSomeContent(items: TClientProfileCardItem[]): boolean {
  return items.some((item) => itemHasContent(item));
}

function itemHasContent(item: TClientProfileCardItem): boolean {
  const content = item.content;

  if (Array.isArray(content) && !content.every((i) => !i)) {
    return false;
  }

  if (typeof content === 'undefined' || content === null) {
    return false;
  }

  if (typeof content === 'string') {
    return !!content.trim().length;
  }

  return true;
}

export function Placeholder(placeholder?: string | ReactNode | null) {
  if (placeholder === null) {
    return null;
  }

  if (isValidElement(placeholder)) {
    return placeholder;
  }

  return (
    <TextBold size="sm" color={Colors.NEUTRAL_DARK}>
      Not Provided
    </TextBold>
  );
}
