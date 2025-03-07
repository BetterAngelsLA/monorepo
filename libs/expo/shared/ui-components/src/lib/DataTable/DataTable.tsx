/** Data tables allow displaying sets of data.
 *
 * Based on react-native-paper DataTable
 * https://github.com/callstack/react-native-paper/blob/main/src/components/DataTable/DataTable.tsx
 *
 * ## Usage
 * ```js
 *
 * const content: TClientProfileCardItem[] = [
 *   {
 *     header: ['First Name'],
 *     rows: [[firstName]],
 *   },
 *   {
 *     header: ['Middle Name'],
 *     rows: [[middleName]],
 *   },
 *   {
 *     header: ['Last Name'],
 *     rows: [[lastName]],
 *   },
 * ];
 *
 * return (
 *   <View style={[styles.container, style]}>
 *     {content.map((item, idx) => {
 *       const header = item.header || [];
 *
 *       return (
 *         <DataTable key={idx}>
 *           {hasTitles && (
 *             <DataTable.Header>
 *               {header.map((title, idx) => {
 *                 return (
 *                   <DataTable.Title
 *                     key={idx}
 *                   >
 *                     {title}
 *                   </DataTable.Title>
 *                 );
 *               })}
 *             </DataTable.Header>
 *           )}
 *
 *           {item.rows.map((row, rowIdx) => {
 *             return (
 *               <DataTable.Row key={rowIdx}>
 *                 {row.map((cellData, cellIdx) => {
 *                   return (
 *                     <DataTable.Cell key={cellIdx}>
 *                       {cellData}
 *                     </DataTable.Cell>
 *                   );
 *                 })}
 *               </DataTable.Row>
 *             );
 *           })}
 *         </DataTable>
 *       );
 *     })}
 *   </View>
 * );
 * ```
 */

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
    <RnpDataTable style={[styles.container, style]} {...rest}>
      {children}
    </RnpDataTable>
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
