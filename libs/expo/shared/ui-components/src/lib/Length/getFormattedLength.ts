import { LENGTH_CONVERSIONS } from './conversions';
import { formatLength } from './formatLength';
import { TLengthFormat, TLengthUnit } from './types';

interface TFormattedLength {
  length?: number | null;
  inputUnit: TLengthUnit;
  outputUnit: TLengthUnit;
  format?: TLengthFormat;
}

export function getFormattedLength(props: TFormattedLength): string {
  const { length, format, inputUnit, outputUnit } = props;

  if (typeof length !== 'number' || isNaN(length)) {
    return '';
  }

  try {
    const convertedLength = LENGTH_CONVERSIONS[inputUnit][outputUnit](length);

    return formatLength({ value: convertedLength, format });
  } catch (e) {
    console.error(
      `getFormattedLength: could not format length [${length}] with inputUnit [${inputUnit}] outputUnit [${outputUnit}] format [${format}]`
    );

    return '';
  }
}
