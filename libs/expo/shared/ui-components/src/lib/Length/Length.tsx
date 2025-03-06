import { Text, TextStyle } from 'react-native';
import { getFormattedLength } from './getFormattedLength';
import { TLengthFormat, TLengthUnit } from './types';

interface TLength {
  length: number;
  inputUnit: TLengthUnit;
  outputUnit: TLengthUnit;
  format?: TLengthFormat;
  style?: TextStyle;
}

export function Length(props: TLength) {
  const { length, format, inputUnit, outputUnit, style } = props;

  const formattedLength = getFormattedLength({
    length,
    inputUnit,
    outputUnit,
    format,
  });

  return <Text style={style}>{formattedLength}</Text>;
}
