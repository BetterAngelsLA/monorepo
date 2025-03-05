import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { DataTable as RnpDataTable } from 'react-native-paper';

export type TDataTableTitle = {
  // header: string | ReactNode;
  viewStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  maxLines?: number;
  children?: ReactNode;
};

export function DataTableTitle(props: TDataTableTitle) {
  const { children, maxLines = 1, textStyle, viewStyle } = props;

  return (
    <RnpDataTable.Title
      style={[styles.defaulViewStyle, viewStyle]}
      textStyle={[styles.defaulTextStyle, textStyle]}
      numberOfLines={maxLines}
    >
      {children}
    </RnpDataTable.Title>
  );
}

const styles = StyleSheet.create({
  defaulViewStyle: {
    paddingVertical: 0,
    paddingRight: Spacings.xs,
  },
  defaulTextStyle: {
    color: Colors.PRIMARY_EXTRA_DARK,
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    fontFamily: 'Poppins-SemiBold',
    // fontFamily: 'Poppins-Regular',
  },
});
