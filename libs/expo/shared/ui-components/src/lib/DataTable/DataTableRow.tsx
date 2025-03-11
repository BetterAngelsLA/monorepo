import { ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { DataTable as RnpDataTable } from 'react-native-paper';

export type TDataTableRow = {
  viewStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function DataTableRow(props: TDataTableRow) {
  const { children, viewStyle } = props;

  return (
    <RnpDataTable.Row style={[styles.defaultRowStyle, viewStyle]}>
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
