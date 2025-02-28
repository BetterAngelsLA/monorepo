import { LENGTH_CONVERSIONS, TLengthUnit } from './conversions';
import { formatLength } from './formats';
import { TLengthFormat } from './types';

interface TFormattedLength {
  length?: number | null;
  inputUnit: TLengthUnit;
  outputUnit: TLengthUnit;
  format?: TLengthFormat;
}

export function getFormattedLength(props: TFormattedLength): string {
  const { length, format, inputUnit, outputUnit } = props;

  if (!length) {
    return '';
  }

  const convertedLength = LENGTH_CONVERSIONS[inputUnit][outputUnit](length);

  return formatLength({ value: convertedLength, format });
}
