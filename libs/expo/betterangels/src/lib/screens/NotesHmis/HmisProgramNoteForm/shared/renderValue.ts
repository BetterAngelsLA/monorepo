import { isoToDateSafe } from '@monorepo/expo/shared/utils';
import { format, isValid, parse } from 'date-fns';

type TProps = {
  value?: unknown;
  dateFormat?: string;
};

export function renderValue(props: TProps): string {
  const { value, dateFormat = 'yyyy-MM-dd' } = props;

  if (!value) {
    return '';
  }

  if (dateFormat) {
    let date: Date | undefined;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      // Try ISO first
      const isoDate = isoToDateSafe(value);

      if (isoDate) {
        date = isoDate;
      } else {
        date = parse(value, dateFormat, new Date());
      }
    }

    if (date && isValid(date)) {
      return format(date, dateFormat);
    }

    return ''; // invalid date: render nothing
  }

  return String(value);
}
