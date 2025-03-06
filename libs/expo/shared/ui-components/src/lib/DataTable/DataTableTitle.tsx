import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import {
  Provider as PaperProvider,
  DataTable as RnpDataTable,
} from 'react-native-paper';

export type TDataTableTitle = {
  viewStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  maxLines?: number;
  children?: ReactNode;
};

export function DataTableTitle(props: TDataTableTitle) {
  const { children, maxLines = 1, textStyle, viewStyle } = props;

  return (
    <PaperProvider theme={{}}>
      <RnpDataTable.Title
        style={[styles.defaulViewStyle, viewStyle]}
        textStyle={[styles.defaulTextStyle, textStyle]}
        numberOfLines={maxLines}
      >
        {children}
      </RnpDataTable.Title>
    </PaperProvider>
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
    fontWeight: 700, // RnpDataTable theme seems to use fontWeight
  },
});
