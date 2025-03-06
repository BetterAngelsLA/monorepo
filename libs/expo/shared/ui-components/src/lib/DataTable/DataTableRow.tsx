import { ReactNode } from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { DataTable as RnpDataTable } from 'react-native-paper';

export type TDataTableRow = {
  viewStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children: ReactNode;
};

export function DataTableRow(props: TDataTableRow) {
  const { children, textStyle, viewStyle } = props;

  return (
    <RnpDataTable.Row style={styles.defaultRowStyle}>
      {children}
    </RnpDataTable.Row>
  );
}

const styles = StyleSheet.create({
  defaultRowStyle: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 0,
    borderBottomWidth: 0,
  },
});
