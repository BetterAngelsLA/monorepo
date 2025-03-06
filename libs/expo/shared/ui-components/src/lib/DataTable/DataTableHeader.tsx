import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { DataTable as RnpDataTable } from 'react-native-paper';

export type TDataTableHeader = {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children: ReactNode;
};

export function DataTableHeader(props: TDataTableHeader) {
  const { children, style } = props;

  return (
    <RnpDataTable.Header style={[styles.defaultHeaderStyle, style]}>
      {children}
    </RnpDataTable.Header>
  );
}

const styles = StyleSheet.create({
  defaultHeaderStyle: {
    paddingHorizontal: 0,
    borderBottomWidth: 0,
    marginVertical: 0,
    marginBottom: Spacings.xs,
  },
  defaultTextStyle: {
    color: Colors.PRIMARY_EXTRA_DARK,
  },
});
