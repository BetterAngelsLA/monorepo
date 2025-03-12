import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { DataTable, TextBold } from '@monorepo/expo/shared/ui-components';
import { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { ClientProfileCardHeader } from './ClientProfileCardHeader';
import { getVisibleItems } from './getVisibleItems';

{
  /* TODO: update or remove once we have a ticket for the Edit Button */
}
type TClickAction = {
  onClick?: () => void;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  buttonContent?: ReactElement;
};

export type TTableItem = string | ReactNode | undefined | null;

export type TClientProfileCardItem = {
  header?: TTableItem[];
  rows: TTableItem[][];
  placeholder?: string | ReactNode;
};

type TClientProfileCard = {
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  items: TClientProfileCardItem[];
  showAll?: boolean;
  action?: TClickAction;
  style?: ViewStyle;
  compact?: boolean;
};

export function ClientProfileCard(props: TClientProfileCard) {
  const {
    action = {},
    compact,
    items,
    showAll,
    subtitle,
    title,
    style,
  } = props;

  {
    /* TODO: update or remove once we have a ticket for the Edit Button */
  }
  const { onClick, accessibilityHint, accessibilityLabel } = action;

  const visibleItems = getVisibleItems({ items, showAll });

  return (
    <View style={style}>
      <ClientProfileCardHeader title={title} subtitle={subtitle} />

      <View
        style={[styles.tableView, compact ? styles.tableViewCompact : null]}
      >
        {visibleItems.map((item, idx) => {
          const header = item.header || [];
          const hasTitles = header.some((t) => !!t);

          return (
            <DataTable key={idx} style={styles.table}>
              {hasTitles && (
                <DataTable.Header>
                  {header.map((title, idx) => {
                    return (
                      <DataTable.Title
                        key={idx}
                        textStyle={styles.tableHeaderTitleText}
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
                          textStyle={styles.tableCellText}
                          numberOfLines={null}
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
      </View>

      {/* TODO: update or remove once we have a ticket for the Edit Button */}
      {!!onClick && (
        <View>
          <Pressable
            onPress={onClick}
            style={{ alignSelf: 'flex-end' }}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
          >
            <TextBold size="xs">Edit Btn</TextBold>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitleText: {
    color: Colors.PRIMARY_EXTRA_DARK,
    fontSize: FontSizes.md.fontSize,
    lineHeight: FontSizes.md.lineHeight,
    fontWeight: 600,
    marginBottom: Spacings.sm,
  },
  tableView: {
    gap: Spacings.lg,
  },
  tableViewCompact: {
    gap: Spacings.sm,
  },
  table: {
    gap: Spacings.xs,
  },
  tableHeaderTitleText: {
    color: Colors.PRIMARY_EXTRA_DARK,
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    fontFamily: 'Poppins-Regular',
    fontWeight: 400,
  },
  tableCellText: {
    color: Colors.PRIMARY_EXTRA_DARK,
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: 700,
  },
});
