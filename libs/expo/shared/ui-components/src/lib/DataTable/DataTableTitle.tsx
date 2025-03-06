import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import {
  Provider as PaperProvider,
  DataTable as RnpDataTable,
} from 'react-native-paper';
import TextOrNode from '../TextOrNode';

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
        theme={{ fonts: {}, colors: {} }}
        style={[styles.defaultViewStyle, viewStyle]}
        numberOfLines={maxLines}
      >
        <TextOrNode textStyle={[styles.defaultTextStyle, textStyle]}>
          {children}
        </TextOrNode>
      </RnpDataTable.Title>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  defaultViewStyle: {
    paddingVertical: 0,
    paddingRight: Spacings.xs,
  },
  defaultTextStyle: {
    color: Colors.PRIMARY_EXTRA_DARK,
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: 700,
  },
});
