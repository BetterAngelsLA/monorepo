import { Colors, FontSizes } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { DataTable as RnpDataTable } from 'react-native-paper';
import TextOrNode from '../TextOrNode';

const DEFAULT_NUMBER_OF_LINES = 1;

export type TDataTableCell = {
  viewStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  numberOfLines?: number | null;
  children: ReactNode;
};

export function DataTableCell(props: TDataTableCell) {
  const { children, numberOfLines, textStyle, viewStyle } = props;

  let textNumberOfLines =
    numberOfLines === null
      ? undefined
      : numberOfLines || DEFAULT_NUMBER_OF_LINES;

  return (
    <RnpDataTable.Cell style={[styles.defaultCellStyle, viewStyle]}>
      {/* RNP DataTable.Cell Text hardcoded `numberOfLines={1}`
      so using TextOrNode to override */}
      <TextOrNode
        numberOfLines={textNumberOfLines}
        textStyle={[styles.defaultTextStyle, textStyle]}
      >
        {children}
      </TextOrNode>
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
  defaultTextStyle: {
    color: Colors.PRIMARY_EXTRA_DARK,
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    fontFamily: 'Poppins-Regular',
    fontWeight: 400, // RnpDataTable theme seems to use fontWeight
  },
});
