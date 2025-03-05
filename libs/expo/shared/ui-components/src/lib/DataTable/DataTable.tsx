import { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { DataTable as RnpDataTable } from 'react-native-paper';
import { DataTableCell } from './DataTableCell';
import { DataTableHeader } from './DataTableHeader';
import { DataTableRow } from './DataTableRow';
import { DataTableTitle } from './DataTableTitle';

export type TDataTableItem = {
  content?: string | ReactNode | null;
  title?: string | ReactNode | null;
  placeholder?: string | ReactNode | null;
  style?: ViewStyle;
  color?: string;
};

export type TDataTable = {
  style?: ViewStyle;
  children: ReactNode;
};

export function DataTable(props: TDataTable) {
  const { style, children, ...rest } = props;

  return (
    <RnpDataTable style={[styles.container, style]}>{children}</RnpDataTable>
  );
}

DataTable.Header = DataTableHeader;
DataTable.Title = DataTableTitle;
DataTable.Row = DataTableRow;
DataTable.Cell = DataTableCell;

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
});
