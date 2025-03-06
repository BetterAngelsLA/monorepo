import { Colors, FontSizes } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { DataTable as RnpDataTable } from 'react-native-paper';

export type TDataTableCell = {
  viewStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children: ReactNode;
};

export function DataTableCell(props: TDataTableCell) {
  const { children, textStyle, viewStyle } = props;

  return (
    <RnpDataTable.Cell
      style={[styles.defaultCellStyle, viewStyle]}
      textStyle={[styles.defaulTextStyle, textStyle]}
    >
      {children}
    </RnpDataTable.Cell>
  );
}

const styles = StyleSheet.create({
  defaultCellStyle: {
    paddingVertical: 0,
    paddingTop: 0,
    marginVertical: 0,
    marginTop: 0,
  },
  defaulTextStyle: {
    color: Colors.PRIMARY_EXTRA_DARK,
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    fontFamily: 'Poppins-Regular',
    fontWeight: 400, // RnpDataTable theme seems to use fontWeight
  },
});
