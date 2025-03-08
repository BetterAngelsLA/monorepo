import { inchesToFeetInches } from './conversions';
import { TLengthFormat } from './types';

type TFormatLength = {
  value: number;
  format?: TLengthFormat;
};

export function formatLength(props: TFormatLength): string {
  const { format, value } = props;

  switch (format) {
    case 'feet-inches-text': {
      const { feet, inches } = inchesToFeetInches(value);

      return `${feet} ft ${inches} in`;
    }
    case 'feet-inches-symbol': {
      const { feet, inches } = inchesToFeetInches(value);

      return `${feet}' ${inches}''`;
    }
    case 'decimal':
    default:
      return `${value.toFixed(2)}`;
  }
}
